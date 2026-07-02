"use client";

import Link from "next/link";
import { Loader2, User, Mail, Shield, Building2, ShieldCheck, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getRoleLabel } from "@/src/lib/auth/roles";
import { useUserProfile } from "@/hooks/use-user-profile";

export default function AnalytiqueProfilePage() {
  const { profile, organization, accountingRole, loading, initials, fullName, refresh, error } =
    useUserProfile({ loadOrganization: true });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Chargement de votre profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="rounded-full h-8 w-8">
          <Link href="/analytique/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mon profil</h1>
          <p className="text-sm text-muted-foreground">
            Informations chargées depuis l&apos;API utilisateur
            {error && " (certaines données proviennent du cache local)"}.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border shadow-sm md:col-span-1">
          <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
            <Avatar className="h-24 w-24 border-2 border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-3xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-foreground">{fullName}</h2>
              <p className="text-xs text-muted-foreground break-all">{profile?.email}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              <Shield className="h-3.5 w-3.5" />
              {getRoleLabel(accountingRole) || "Collaborateur"}
            </span>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm md:col-span-2">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-lg">Détails du compte</CardTitle>
            <CardDescription>Données synchronisées via <code className="text-xs">GET /users/me</code></CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Prénom</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={profile?.firstName || ""} disabled className="pl-9 bg-secondary/50" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nom</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={profile?.lastName || ""} disabled className="pl-9 bg-secondary/50" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Adresse email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={profile?.email || ""} disabled className="pl-9 bg-secondary/50" />
              </div>
            </div>

            <div className="pt-4 border-t border-border space-y-3">
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>
                  Rôle comptable :{" "}
                  <strong className="text-foreground">{getRoleLabel(accountingRole) || "—"}</strong>
                </span>
              </div>
              {profile?.id && (
                <p className="text-[11px] text-muted-foreground font-mono select-all">
                  ID utilisateur : {profile.id}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {organization && (
        <Card className="border-border shadow-sm">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Organisation
            </CardTitle>
            <CardDescription>Informations de l&apos;entité courante</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Raison sociale</p>
              <p className="font-medium text-foreground">{organization.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Email</p>
              <p className="font-medium text-foreground">{organization.email ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Forme juridique</p>
              <p className="font-medium text-foreground">{organization.legalForm ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">N° fiscal</p>
              <p className="font-medium text-foreground">{organization.taxNumber ?? "—"}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button variant="outline" onClick={() => refresh()}>
          Actualiser le profil
        </Button>
      </div>
    </div>
  );
}
