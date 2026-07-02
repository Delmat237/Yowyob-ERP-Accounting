"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, User, Mail, Shield, Building2, Landmark, ShieldCheck, KeyRound, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { UsersService } from "@/src/lib/services/UsersService";
import { getRoleLabel } from "@/src/lib/auth/roles";
import { User as UserType } from "@/src/lib/models/User";

export default function ProfilePage() {
  const { user: authUser, accountingRole } = useAuth();
  const [profile, setProfile] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const data = await UsersService.getMe();
      setProfile(data);
    } catch (error) {
      console.error(error);
      toast.error("Impossible de charger les informations de votre profil.");
      // Fallback sur l'utilisateur du store en cas de problème d'API
      if (authUser) {
        setProfile({
          id: authUser.id,
          firstName: authUser.firstName,
          lastName: authUser.lastName,
          email: authUser.email,
        } as UserType);
      }
    } finally {
      setIsLoading(false);
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

  // Le user kernel ne renvoie pas firstName/lastName (ils vivent sur l'acteur) ;
  // on retombe sur le username pour l'affichage.
  const username = (profile as any)?.username as string | undefined;

  const initials = profile
    ? (`${profile.firstName?.[0] ?? ""}${profile.lastName?.[0] ?? ""}`.toUpperCase()
        || username?.[0]?.toUpperCase()
        || "?")
    : "?";

  const fullName = profile
    ? (`${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim()
        || username
        || "Utilisateur")
    : "Utilisateur";

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          Mon Profil
        </h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Visualisez et gérez vos informations personnelles au sein de la plateforme ERP.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: Avatar Card */}
        <Card className="border-gray-100 shadow-sm rounded-xl bg-white md:col-span-1">
          <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
            <Avatar className="h-24 w-24 border-2 border-blue-100 shadow-md">
              <AvatarFallback className="bg-blue-600 text-white font-bold text-3xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-gray-900">{fullName}</h2>
              <p className="text-xs text-muted-foreground break-all">{profile?.email}</p>
            </div>
            
            <div className="w-full pt-4 border-t border-gray-50 flex flex-col gap-2">
              <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                <Shield className="h-3.5 w-3.5" />
                {getRoleLabel(accountingRole) || "Collaborateur"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Right Side: Account Details Form */}
        <Card className="border-gray-100 shadow-sm rounded-xl bg-white md:col-span-2">
          <CardHeader className="border-b border-gray-50 pb-5">
            <CardTitle className="text-lg font-bold text-gray-900">Détails du compte</CardTitle>
            <CardDescription>Vos informations personnelles enregistrées.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Prénom</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={profile?.firstName || ""}
                    disabled
                    className="pl-9 rounded-lg border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Nom</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={profile?.lastName || ""}
                    disabled
                    className="pl-9 rounded-lg border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Adresse Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={profile?.email || ""}
                  disabled
                  className="pl-9 rounded-lg border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Additional info display */}
            <div className="pt-4 border-t border-gray-50 space-y-3">
              <div className="flex items-center gap-2.5 text-sm text-gray-600">
                <ShieldCheck className="h-4.5 w-4.5 text-green-500 shrink-0" />
                <span>Rôle système : <strong className="font-semibold text-gray-900">{getRoleLabel(accountingRole) || "Collaborateur"}</strong></span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
