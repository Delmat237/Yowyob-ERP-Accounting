"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Eye,
    EyeOff,
    Mail,
    Lock,
    Building2,
    Loader2,
    XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { OpenAPI } from '@/src/lib2/core/OpenAPI';
import { LoginData } from '@/types/personnel';
import { useAuth } from '@/hooks/use-auth';
import { clearAccountingChoice } from '@/lib/accounting-choice';
import { clearUiState } from '@/lib/clear-ui-state';
import { useAccountingChoiceStore } from '@/hooks/use-accounting-choice-store';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface RegisterFormData {
    firstName: string;
    lastName: string;
    email: string;
    organizationCode: string;
    password: string;
    confirmPassword: string;
}

type AuthUser = {
    id?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    organizationId?: string;
    roles?: string[];
};

type AuthLoginResponse = {
    token: string;
    user: AuthUser;
    // Présent sur /select-context : tenant retenu pour le contexte choisi.
    tenantId?: string;
};

// Organisation accessible dans un contexte (cf Kernel UserOrganizationAccessResponse).
type LoginOrg = {
    organizationId: string;
    organizationCode?: string;
    shortName?: string;
    longName?: string;
    displayName?: string;
    legalName?: string;
};

// Contexte de connexion = un tenant auquel le compte appartient + ses organisations.
type LoginContext = {
    contextId: string;
    tenantId: string;
    organizations?: LoginOrg[];
};

type DiscoverContextsResponse = {
    selectionToken: string;
    expiresInSeconds?: number;
    contexts: LoginContext[];
};

// Option « plate » présentée à l'utilisateur : un (contexte, organisation?) à choisir.
type SelectOption = {
    contextId: string;
    tenantId: string;
    organizationId?: string;
    label: string;
};

function orgLabel(org: LoginOrg): string {
    return org.displayName || org.shortName || org.longName || org.legalName
        || org.organizationCode || org.organizationId;
}

// Aplatit les contextes en options sélectionnables (un par organisation, ou un par
// contexte sans organisation). Sert à décider d'un auto-login (1 seule option).
function buildOptions(contexts: LoginContext[]): SelectOption[] {
    const options: SelectOption[] = [];
    for (const ctx of contexts) {
        const orgs = ctx.organizations ?? [];
        if (orgs.length === 0) {
            options.push({ contextId: ctx.contextId, tenantId: ctx.tenantId, label: 'Espace personnel' });
        } else {
            for (const org of orgs) {
                options.push({
                    contextId: ctx.contextId,
                    tenantId: ctx.tenantId,
                    organizationId: org.organizationId,
                    label: orgLabel(org),
                });
            }
        }
    }
    return options;
}

// ─── Bandeau d'erreur inline ─────────────────────────────────────────────────
function ErrorBanner({ message }: { message: string }) {
    return (
        <div className="flex items-start gap-3 p-3 rounded-lg text-sm border bg-red-50 border-red-200 text-red-800">
            <XCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
            <span>{message}</span>
        </div>
    );
}

function getErrorMessage(error: unknown, fallback: string) {
    if (!(error instanceof Error)) {
        return fallback;
    }

    if (error.message === 'Failed to fetch') {
        return "Vérifier votre connexion ,puis réessayez.";
    }

    return error.message || fallback;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [showRegisterPassword, setShowRegisterPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('login');
    // Sélection de contexte/organisation quand le compte en a plusieurs (multi-tenant / multi-org).
    const [pendingSelection, setPendingSelection] = useState<{ selectionToken: string; options: SelectOption[] } | null>(null);

    const [registerError, setRegisterError] = useState<string | null>(null);

    const loginForm = useForm<LoginData>({ mode: 'onChange' });
    const registerForm = useForm<RegisterFormData>({ mode: 'onChange' });
    const { setUser } = useAuth();

    const apiBase = () => OpenAPI.BASE.replace(/\/$/, '');

    // Étape 1 : découverte des contextes (tenants + organisations) du compte.
    // Tout passe par le backend accounting (OpenAPI[src/lib2].BASE), qui détient
    // les clés Kernel côté serveur. Le navigateur n'envoie NI tenant NI clé : le
    // Kernel résout lui-même les tenants du principal → vrai multi-tenant.
    const handleLogin = async (data: LoginData) => {
        setIsLoading(true);
        setPendingSelection(null);
        try {
            const res = await fetch(`${apiBase()}/api/auth/discover-contexts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: data.email, password: data.password }),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body?.message || 'Identifiants incorrects.');
            }

            const discovered = await res.json() as DiscoverContextsResponse;
            const contexts = discovered.contexts ?? [];
            if (contexts.length === 0) {
                throw new Error("Aucun espace n'est associé à ce compte.");
            }

            const options = buildOptions(contexts);
            if (options.length === 1) {
                // Un seul contexte/organisation → on finalise directement.
                await completeSelection(discovered.selectionToken, options[0]);
            } else {
                // Plusieurs tenants/organisations → l'utilisateur choisit.
                setPendingSelection({ selectionToken: discovered.selectionToken, options });
                setIsLoading(false);
            }
        } catch (error: unknown) {
            toast.error(
                getErrorMessage(error, 'Identifiants incorrects. Veuillez réessayer.'),
            );
            setIsLoading(false);
        }
    };

    // Étape 2 : sélection d'un contexte (et organisation) → login finalisé.
    const completeSelection = async (selectionToken: string, option: SelectOption) => {
        setIsLoading(true);
        try {
            const res = await fetch(`${apiBase()}/api/auth/select-context`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    selectionToken,
                    contextId: option.contextId,
                    organizationId: option.organizationId,
                }),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body?.message || 'Connexion impossible pour cet espace.');
            }

            const response = await res.json() as AuthLoginResponse;

            localStorage.setItem('auth_token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            // Tenant/organisation issus du CONTEXTE choisi (multi-tenant/multi-org),
            // avec repli sur l'env uniquement en dernier recours (déploiement mono-client).
            localStorage.setItem('tenant_id',
                response.tenantId || option.tenantId || process.env.NEXT_PUBLIC_TENANT_ID || '');
            localStorage.setItem('organization_id',
                option.organizationId || response.user?.organizationId
                    || process.env.NEXT_PUBLIC_ORGANIZATION_ID || '');
            localStorage.setItem('organization_name', option.label || 'KSM');
            OpenAPI.TOKEN = response.token;
            setUser(response.user);

            setPendingSelection(null);
            clearAccountingChoice();
            useAccountingChoiceStore.getState().clear();
            clearUiState();

            const firstName = response.user?.firstName?.trim();
            toast.success(
                firstName ? `Bienvenue, ${firstName} !` : 'Connexion réussie',
                { description: 'Redirection vers votre espace…' },
            );
            onClose();
            router.push('/accounting/dashboard');
        } catch (error: unknown) {
            toast.error(
                getErrorMessage(error, 'Connexion impossible. Veuillez réessayer.'),
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (data: RegisterFormData) => {
        setIsLoading(true);
        setRegisterError(null);
        try {
            if (data.password !== data.confirmPassword) {
                setRegisterError("Les mots de passe ne correspondent pas.");
                return;
            }

            // Étape 1 : Découvrir les contextes d'inscription associés au code d'organisation
            const discoverSignUpRes = await fetch(`${apiBase()}/api/kernel/auth/discover-sign-up-contexts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ organizationCode: data.organizationCode }),
            });

            if (!discoverSignUpRes.ok) {
                const body = await discoverSignUpRes.json().catch(() => ({}));
                if (discoverSignUpRes.status === 404) {
                    setRegisterError("Code d'organisation invalide ou introuvable. Veuillez vérifier le code avec votre responsable.");
                } else {
                    setRegisterError(body?.message || "Impossible de valider le code d'organisation.");
                }
                return;
            }

            const signUpContextsData = await discoverSignUpRes.json();
            const signUpContexts = signUpContextsData.data || signUpContextsData;
            
            const selectionToken = signUpContexts.selectionToken;
            const contexts = signUpContexts.contexts || [];

            if (!selectionToken || contexts.length === 0) {
                setRegisterError("Aucun contexte d'inscription disponible pour ce code d'organisation.");
                return;
            }

            // On prend le premier contexte retourné par le Kernel
            const targetContext = contexts[0];

            // Étape 2 : Créer le compte utilisateur dans le tenant et l'organisation correspondante
            const signUpRes = await fetch(`${apiBase()}/api/kernel/auth/sign-up`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenantId: targetContext.tenantId,
                    signUpSelectionToken: selectionToken,
                    contextId: targetContext.contextId,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    username: data.email, // On utilise l'email comme username
                    email: data.email,
                    password: data.password,
                    socialProvider: "LOCAL",
                    accountType: "EMPLOYEE",
                    businessType: "INDIVIDUAL"
                }),
            });

            if (!signUpRes.ok) {
                const body = await signUpRes.json().catch(() => ({}));
                if (signUpRes.status === 409) {
                    setRegisterError("Un compte existe déjà avec cette adresse email.");
                } else {
                    setRegisterError(body?.message || "Échec de l'inscription. Veuillez réessayer.");
                }
                return;
            }

            // Étape 3 : Connexion automatique de l'utilisateur après création du compte
            const discoverRes = await fetch(`${apiBase()}/api/auth/discover-contexts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: data.email, password: data.password }),
            });

            if (!discoverRes.ok) {
                setActiveTab('login');
                setRegisterError(null);
                toast.success("Compte créé avec succès ! Connectez-vous maintenant.");
                return;
            }

            const discovered = await discoverRes.json() as DiscoverContextsResponse;
            const options = buildOptions(discovered.contexts ?? []);
            if (options.length === 0) {
                setActiveTab('login');
                toast.success("Compte créé ! Connectez-vous pour accéder à votre espace.");
                return;
            }

            if (options.length === 1) {
                await completeSelection(discovered.selectionToken, options[0]);
            } else {
                setPendingSelection({ selectionToken: discovered.selectionToken, options });
                setActiveTab('login');
                setIsLoading(false);
            }
        } catch (error: unknown) {
            setRegisterError(getErrorMessage(error, "Une erreur est survenue lors de l'inscription."));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-xl border border-gray-200">
                <DialogHeader className="space-y-3 pb-2 border-b border-gray-100">
                    <div className="flex items-center justify-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-white" />
                        </div>
                        <DialogTitle className="text-xl font-bold text-gray-900 tracking-tight">
                            KSM
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-sm text-gray-500 text-center">
                        Accédez à votre espace de gestion commerciale
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setRegisterError(null); }} className="w-full mt-2">
                    <TabsList className="grid w-full grid-cols-2 bg-gray-100 rounded-lg mb-2">
                        <TabsTrigger value="login">Connexion</TabsTrigger>
                        <TabsTrigger value="register">Inscription</TabsTrigger>
                    </TabsList>

                    {/* ── Onglet Connexion ── */}
                    <TabsContent value="login" className="space-y-4 mt-6">
                        {pendingSelection ? (
                            <div className="space-y-3">
                                <p className="text-sm text-gray-600">
                                    Plusieurs espaces sont associés à ce compte. Choisissez celui auquel vous connecter :
                                </p>
                                <div className="space-y-2">
                                    {pendingSelection.options.map((opt, i) => (
                                        <button
                                            key={`${opt.contextId}-${opt.organizationId ?? 'none'}-${i}`}
                                            type="button"
                                            disabled={isLoading}
                                            onClick={() => completeSelection(pendingSelection.selectionToken, opt)}
                                            className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 text-left hover:border-blue-400 hover:bg-blue-50 transition disabled:opacity-50"
                                        >
                                            <Building2 className="h-4 w-4 text-blue-600 shrink-0" />
                                            <span className="text-sm font-medium text-gray-800">{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                                <Button
                                    type="button"
                                    variant="link"
                                    className="text-sm p-0 h-auto text-gray-500"
                                    onClick={() => setPendingSelection(null)}
                                >
                                    ← Revenir
                                </Button>
                            </div>
                        ) : (
                        <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="votre@email.com"
                                        className="pl-10"
                                        {...loginForm.register('email', {
                                            required: 'Email requis',
                                            pattern: { value: /^\S+@\S+$/i, message: 'Email invalide' }
                                        })}
                                    />
                                </div>
                                {loginForm.formState.errors.email && (
                                    <p className="text-sm text-red-600">{loginForm.formState.errors.email.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Mot de passe</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Votre mot de passe"
                                        className="pl-10 pr-10"
                                        {...loginForm.register('password', { required: 'Mot de passe requis' })}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-1 top-1 h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                                {loginForm.formState.errors.password && (
                                    <p className="text-sm text-red-600">{loginForm.formState.errors.password.message}</p>
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="flex items-center space-x-2 text-sm">
                                    <input type="checkbox" className="rounded" />
                                    <span>Se souvenir de moi</span>
                                </label>
                                <Button variant="link" className="text-sm p-0 h-auto text-blue-600 hover:underline">
                                    Mot de passe oublié ?
                                </Button>
                            </div>
                            <Button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-sm"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Connexion...</>
                                ) : "Se connecter"}
                            </Button>
                        </form>
                        )}
                    </TabsContent>

                    {/* ── Onglet Inscription ── */}
                    <TabsContent value="register" className="space-y-4 mt-6">
                        {registerError && <ErrorBanner message={registerError} />}
                        <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                            {/* Identité */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">Prénom</Label>
                                    <Input
                                        id="firstName"
                                        placeholder="Jean"
                                        {...registerForm.register('firstName', { required: 'Prénom requis' })}
                                    />
                                    {registerForm.formState.errors.firstName && (
                                        <p className="text-sm text-red-600">{registerForm.formState.errors.firstName.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Nom</Label>
                                    <Input
                                        id="lastName"
                                        placeholder="Dupont"
                                        {...registerForm.register('lastName', { required: 'Nom requis' })}
                                    />
                                    {registerForm.formState.errors.lastName && (
                                        <p className="text-sm text-red-600">{registerForm.formState.errors.lastName.message}</p>
                                    )}
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="registerEmail">Email</Label>
                                <Input
                                    id="registerEmail"
                                    type="email"
                                    placeholder="votre@email.com"
                                    {...registerForm.register('email', {
                                        required: 'Email requis',
                                        pattern: { value: /^\S+@\S+$/i, message: 'Email invalide' }
                                    })}
                                />
                                {registerForm.formState.errors.email && (
                                    <p className="text-sm text-red-600">{registerForm.formState.errors.email.message}</p>
                                )}
                            </div>

                            {/* Code d'organisation */}
                            <div className="space-y-2">
                                <Label htmlFor="organizationCode">Code d'organisation</Label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                                    <Input
                                        id="organizationCode"
                                        placeholder="Ex : KSM-CPTA-LA"
                                        className="pl-10"
                                        {...registerForm.register('organizationCode', { required: "Code d'organisation requis" })}
                                    />
                                </div>
                                {registerForm.formState.errors.organizationCode && (
                                    <p className="text-sm text-red-600">{registerForm.formState.errors.organizationCode.message}</p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    Ce code vous est fourni par votre responsable. Il identifie l'organisation à rejoindre.
                                    Votre rôle sera attribué par un administrateur après votre inscription.
                                </p>
                            </div>

                            {/* Mot de passe */}
                            <div className="space-y-2">
                                <Label htmlFor="registerPassword">Mot de passe</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                                    <Input
                                        id="registerPassword"
                                        type={showRegisterPassword ? "text" : "password"}
                                        placeholder="Minimum 6 caractères"
                                        className="pl-10 pr-10"
                                        {...registerForm.register('password', {
                                            required: 'Mot de passe requis',
                                            minLength: { value: 6, message: 'Minimum 6 caractères' }
                                        })}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-1 top-1 h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                                        tabIndex={-1}
                                    >
                                        {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                                {registerForm.formState.errors.password && (
                                    <p className="text-sm text-red-600">{registerForm.formState.errors.password.message}</p>
                                )}
                            </div>

                            {/* Confirmation mot de passe */}
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Confirmez"
                                        className="pl-10 pr-10"
                                        {...registerForm.register('confirmPassword', {
                                            required: 'Confirmation requise',
                                            validate: value => value === registerForm.watch('password') || 'Les mots de passe ne correspondent pas'
                                        })}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-1 top-1 h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        tabIndex={-1}
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                                {registerForm.formState.errors.confirmPassword && (
                                    <p className="text-sm text-red-600">{registerForm.formState.errors.confirmPassword.message}</p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-sm"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Création du compte...</>
                                ) : "Créer mon compte"}
                            </Button>
                        </form>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
