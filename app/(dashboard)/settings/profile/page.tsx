"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, User, Mail, Shield, ShieldCheck, KeyRound, Save, Pencil } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

export default function ProfilePage() {
  const { user: authUser, accountingRole, setUser } = useAuth();
  const [profile, setProfile] = useState<UserType | null>(null);
  const [form, setForm] = useState<ProfileForm>({ firstName: "", lastName: "", email: "" });
  const [draft, setDraft] = useState<ProfileForm>({ firstName: "", lastName: "", email: "" });
  const [hasBusinessActor, setHasBusinessActor] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const syncFormFromProfile = useCallback((data: UserType, actorName?: string) => {
    const actorParts = splitActorName(actorName);
    const next: ProfileForm = {
      firstName: data.firstName || actorParts.firstName || "",
      lastName: data.lastName || actorParts.lastName || "",
      email: data.email || "",
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
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto" />
          <p className="text-sm text-muted-foreground animate-pulse">Chargement de votre profil...</p>
        </div>
      </div>
    );
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
            <Avatar className="h-24 w-24 border-2 border-blue-100 shadow-md">
              <AvatarFallback className="bg-blue-600 text-white font-bold text-3xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-gray-900">{fullName}</h2>
              <p className="text-xs text-muted-foreground break-all">{displayEmail}</p>
            </div>

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

              {profile?.id && (
                <div className="flex items-center gap-2.5 text-sm text-gray-500 font-mono text-[11px] select-all">
                  <span className="font-sans text-gray-600 font-normal">ID Utilisateur :</span>
                  <span>{profile.id}</span>
                </div>
              )}
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
