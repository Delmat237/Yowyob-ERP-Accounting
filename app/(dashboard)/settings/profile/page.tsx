"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, User, Mail, Shield, ShieldCheck, KeyRound, Save, Pencil, Camera, Trash2 } from "lucide-react";
import { CustomPageLoader } from "@/components/ui/custom-page-loader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { UsersService } from "@/src/lib/services/UsersService";
import { BusinessActorsService } from "@/src/lib/services/BusinessActorsService";
import { getRoleLabel } from "@/src/lib/auth/roles";
import { User as UserType } from "@/src/lib/models/User";

type ProfileForm = {
  firstName: string;
  lastName: string;
  email: string;
};

function splitActorName(name?: string): Pick<ProfileForm, "firstName" | "lastName"> {
  if (!name?.trim()) return { firstName: "", lastName: "" };
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function buildInitials(firstName: string, lastName: string, email: string) {
  const fromNames = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
  if (fromNames) return fromNames;
  return email?.[0]?.toUpperCase() || "?";
}

/** Taille max d'une photo de profil (2 Mo). */
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

/** Clé de stockage de l'avatar, isolée par utilisateur. */
function avatarStorageKey(userId?: string) {
  return `profile_avatar_${userId || "current"}`;
}

/** Lit un fichier image en data URL (base64), pour affichage et persistance locale. */
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function ProfilePage() {
  const { user: authUser, accountingRole, setUser } = useAuth();
  const [profile, setProfile] = useState<UserType | null>(null);
  const [form, setForm] = useState<ProfileForm>({ firstName: "", lastName: "", email: "" });
  const [draft, setDraft] = useState<ProfileForm>({ firstName: "", lastName: "", email: "" });
  const [hasBusinessActor, setHasBusinessActor] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Identifiant courant : profil chargé, sinon utilisateur de session.
  const userId = profile?.id ?? authUser?.id;

  // Restaure l'avatar stocké localement une fois l'utilisateur connu.
  useEffect(() => {
    if (typeof window === "undefined" || !userId) return;
    setAvatarUrl(localStorage.getItem(avatarStorageKey(userId)));
  }, [userId]);

  const handleAvatarPick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // permet de resélectionner le même fichier
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez choisir un fichier image.");
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      toast.error("Image trop lourde (2 Mo maximum).");
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setAvatarUrl(dataUrl);
      if (userId) localStorage.setItem(avatarStorageKey(userId), dataUrl);
      toast.success("Photo de profil mise à jour.");
    } catch {
      toast.error("Impossible de lire l'image sélectionnée.");
    }
  };

  const handleAvatarRemove = () => {
    setAvatarUrl(null);
    if (userId) localStorage.removeItem(avatarStorageKey(userId));
    toast.success("Photo de profil supprimée.");
  };

  const syncFormFromProfile = useCallback((data: UserType, actorName?: string) => {
    const actorParts = splitActorName(actorName);
    const sessionUser = useAuth.getState().user;
    // Le kernel ne porte PAS de prénom/nom sur le compte (UserAccount = username + email,
    // pas de champ name), et l'acteur peut être absent (/actors/me 404). En dernier recours
    // on dérive un nom lisible depuis le username (ex. "leonel.azangue" → Leonel / Azangue)
    // pour éviter un profil vide, plutôt que de laisser les champs blancs.
    const username = (data as { username?: string }).username;
    const usernameParts = splitActorName(username?.replace(/[._-]+/g, " "));
    const next: ProfileForm = {
      firstName: data.firstName || actorParts.firstName || sessionUser?.firstName || usernameParts.firstName || "",
      lastName: data.lastName || actorParts.lastName || sessionUser?.lastName || usernameParts.lastName || "",
      email: data.email || sessionUser?.email || "",
    };
    setForm(next);
    setDraft(next);
  }, []);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await UsersService.getMe();
      setProfile(data);

      let actorName: string | undefined;
      try {
        const actor = await BusinessActorsService.getMyProfile();
        actorName = actor.name;
        setHasBusinessActor(true);
      } catch {
        setHasBusinessActor(false);
      }

      syncFormFromProfile(data, actorName);
    } catch (error) {
      console.error(error);
      toast.error("Impossible de charger les informations de votre profil.");
      const sessionUser = useAuth.getState().user;
      if (sessionUser) {
        const fallback = {
          id: sessionUser.id,
          firstName: sessionUser.firstName,
          lastName: sessionUser.lastName,
          email: sessionUser.email,
          organizationId: sessionUser.organizationId,
          roles: sessionUser.roles,
        } as UserType;
        setProfile(fallback);
        syncFormFromProfile(fallback);
      }
    } finally {
      setIsLoading(false);
    }
  }, [syncFormFromProfile]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleCancel = () => {
    setDraft(form);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!draft.firstName.trim() && !draft.lastName.trim()) {
      toast.error("Indiquez au moins un prénom ou un nom.");
      return;
    }
    if (!draft.email.trim()) {
      toast.error("L'adresse email est obligatoire.");
      return;
    }

    setIsSaving(true);
    try {
      let updated: UserType | null = null;

      try {
        updated = await UsersService.updateMe({
          firstName: draft.firstName.trim(),
          lastName: draft.lastName.trim(),
          email: draft.email.trim(),
        });
      } catch (apiError) {
        console.warn("PUT /users/me indisponible, repli sur le profil acteur.", apiError);
        if (hasBusinessActor) {
          await BusinessActorsService.updateProfile({
            name: `${draft.firstName.trim()} ${draft.lastName.trim()}`.trim(),
          });
        } else {
          throw apiError;
        }
      }

      const merged: UserType = {
        ...(profile ?? authUser ?? {}),
        ...(updated ?? {}),
        firstName: draft.firstName.trim(),
        lastName: draft.lastName.trim(),
        email: draft.email.trim(),
      };

      setProfile(merged);
      setForm({
        firstName: merged.firstName ?? "",
        lastName: merged.lastName ?? "",
        email: merged.email ?? "",
      });
      setDraft({
        firstName: merged.firstName ?? "",
        lastName: merged.lastName ?? "",
        email: merged.email ?? "",
      });

      localStorage.setItem("user", JSON.stringify(merged));
      setUser(merged);
      setIsEditing(false);
      toast.success("Profil mis à jour", {
        description: "Vos modifications ont été enregistrées.",
      });
    } catch (error) {
      console.error(error);
      toast.error("Impossible d'enregistrer votre profil. Réessayez plus tard.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <CustomPageLoader message="Chargement de votre profil..." />;
  }

  const displayFirstName = isEditing ? draft.firstName : form.firstName;
  const displayLastName = isEditing ? draft.lastName : form.lastName;
  const displayEmail = isEditing ? draft.email : form.email;
  const fullName = `${displayFirstName} ${displayLastName}`.trim() || "Utilisateur";
  const initials = buildInitials(displayFirstName, displayLastName, displayEmail);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Mon Profil
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Visualisez et modifiez vos informations personnelles.
          </p>
        </div>
        {!isEditing ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsEditing(true)}
                aria-label="Modifier"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Modifier</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Enregistrer
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-gray-100 shadow-sm rounded-xl bg-white md:col-span-1">
          <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
            <div className="relative group">
              <Avatar className="h-24 w-24 border-2 border-blue-100 shadow-md">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} className="object-cover" />}
                <AvatarFallback className="bg-blue-600 text-white font-bold text-3xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={handleAvatarPick}
                aria-label="Changer la photo de profil"
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md ring-2 ring-white transition hover:bg-blue-700"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-gray-900">{fullName}</h2>
              <p className="text-xs text-muted-foreground break-all">{displayEmail}</p>
            </div>
            {avatarUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAvatarRemove}
                className="h-7 gap-1.5 text-xs text-gray-500 hover:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Retirer la photo
              </Button>
            )}

            <div className="w-full pt-4 border-t border-gray-50 flex flex-col gap-2">
              <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                <Shield className="h-3.5 w-3.5" />
                {getRoleLabel(accountingRole) || "Collaborateur"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100 shadow-sm rounded-xl bg-white md:col-span-2">
          <CardHeader className="border-b border-gray-50 pb-5">
            <CardTitle className="text-lg font-bold text-gray-900">Détails du compte</CardTitle>
            <CardDescription>
              {isEditing
                ? "Modifiez vos informations puis enregistrez."
                : "Vos informations personnelles enregistrées."}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Prénom
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="firstName"
                    value={displayFirstName}
                    onChange={(e) => setDraft((prev) => ({ ...prev, firstName: e.target.value }))}
                    disabled={!isEditing || isSaving}
                    className="pl-9 rounded-lg border-gray-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Nom
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="lastName"
                    value={displayLastName}
                    onChange={(e) => setDraft((prev) => ({ ...prev, lastName: e.target.value }))}
                    disabled={!isEditing || isSaving}
                    className="pl-9 rounded-lg border-gray-200"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Adresse Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={displayEmail}
                  onChange={(e) => setDraft((prev) => ({ ...prev, email: e.target.value }))}
                  disabled={!isEditing || isSaving}
                  className="pl-9 rounded-lg border-gray-200"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-50 space-y-3">
              <div className="flex items-center gap-2.5 text-sm text-gray-600">
                <ShieldCheck className="h-4.5 w-4.5 text-green-500 shrink-0" />
                <span>
                  Rôle système :{" "}
                  <strong className="font-semibold text-gray-900">
                    {getRoleLabel(accountingRole) || "Collaborateur"}
                  </strong>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-gray-100 shadow-sm rounded-xl bg-white">
        <CardHeader className="border-b border-gray-50 pb-5">
          <CardTitle className="text-lg font-bold text-gray-900">Sécurité</CardTitle>
          <CardDescription>Mettez à jour votre mot de passe.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Button variant="outline" asChild className="gap-2">
            <Link href="/settings/password">
              <KeyRound className="h-4 w-4" />
              Changer le mot de passe
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
