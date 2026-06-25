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
    CheckCircle2,
    XCircle,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { OpenAPI } from '@/src/lib2/core/OpenAPI';
import { LoginData } from '@/types/personnel';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface RegisterFormData {
    firstName: string;
    lastName: string;
    email: string;
    company: string;
    password: string;
    confirmPassword: string;
    role: string;
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

// ─── Composant de feedback inline ────────────────────────────────────────────
function FeedbackBanner({ type, message }: { type: 'success' | 'error'; message: string }) {
    return (
        <div className={cn(
            "flex items-start gap-3 p-3 rounded-lg text-sm border",
            type === 'success'
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
        )}>
            {type === 'success'
                ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
                : <XCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
            }
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

    // Feedback inline — remplace alert() et console.log()
    const [loginFeedback, setLoginFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [registerFeedback, setRegisterFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
        setLoginFeedback(null);
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
            setLoginFeedback({
                type: 'error',
                message: getErrorMessage(error, 'Identifiants incorrects. Veuillez réessayer.')
            });
            setIsLoading(false);
        }
    };

    // Étape 2 : sélection d'un contexte (et organisation) → login finalisé.
    const completeSelection = async (selectionToken: string, option: SelectOption) => {
        setIsLoading(true);
        setLoginFeedback(null);
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
            OpenAPI.TOKEN = response.token;
            setUser(response.user);

            setPendingSelection(null);
            // Réinitialise le choix d'espace comptable pour CETTE session : le modal de
            // choix (générale vs analytique) réapparaîtra au prochain montage du dashboard.
            // Clé alignée sur ACCOUNTING_CHOICE_KEY de accounting-choice-modal.tsx.
            sessionStorage.removeItem('ksm.accountingChoiceMade');
            setLoginFeedback({ type: 'success', message: `Bienvenue, ${response.user?.firstName ?? ''} !` });
            await new Promise(resolve => setTimeout(resolve, 600));
            router.push('/accounting/dashboard');
            onClose();
        } catch (error: unknown) {
            setLoginFeedback({
                type: 'error',
                message: getErrorMessage(error, 'Connexion impossible. Veuillez réessayer.')
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async () => {
        setIsLoading(true);
        setRegisterFeedback(null);
        try {
            setRegisterFeedback({
                type: 'error',
                message: "L'inscription n'est pas encore exposée par le backend local. Utilisez un compte de test mock pour vous connecter.",
            });
        } catch (error: unknown) {
            setRegisterFeedback({
                type: 'error',
                message: getErrorMessage(error, "Une erreur est survenue lors de l'inscription.")
            });
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

                <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setLoginFeedback(null); setRegisterFeedback(null); }} className="w-full mt-2">
                    <TabsList className="grid w-full grid-cols-2 bg-gray-100 rounded-lg mb-2">
                        <TabsTrigger value="login">Connexion</TabsTrigger>
                        <TabsTrigger value="register">Inscription</TabsTrigger>
                    </TabsList>

                    {/* ── Onglet Connexion ── */}
                    <TabsContent value="login" className="space-y-4 mt-6">
                        {loginFeedback && (
                            <FeedbackBanner type={loginFeedback.type} message={loginFeedback.message} />
                        )}
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
                                    onClick={() => { setPendingSelection(null); setLoginFeedback(null); }}
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
                        {registerFeedback && (
                            <FeedbackBanner type={registerFeedback.type} message={registerFeedback.message} />
                        )}
                        <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
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
                            <div className="space-y-2">
                                <Label htmlFor="company">Entreprise</Label>
                                <Input
                                    id="company"
                                    placeholder="Nom de votre entreprise"
                                    {...registerForm.register('company', { required: 'Entreprise requise' })}
                                />
                                {registerForm.formState.errors.company && (
                                    <p className="text-sm text-red-600">{registerForm.formState.errors.company.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Rôle (Profil souhaité)</Label>
                                <select
                                    id="role"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    {...registerForm.register('role', { required: 'Veuillez sélectionner un rôle' })}
                                >
                                    <option value="" disabled>Sélectionnez votre rôle</option>
                                    <option value="AIDE_COMPTABLE">Aide-comptable</option>
                                    <option value="COMPTABLE">Comptable</option>
                                    <option value="RESPONSABLE_COMPTABLE">Responsable comptable</option>
                                </select>
                                {registerForm.formState.errors.role && (
                                    <p className="text-sm text-red-600">{registerForm.formState.errors.role.message}</p>
                                )}
                            </div>
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
