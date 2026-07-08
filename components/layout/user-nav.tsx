"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Settings, KeyRound } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getRoleLabel } from "@/src/lib/auth/roles";
import { clearSession } from "@/lib/auth-session";

export function UserNav() {
  const router = useRouter();
  const { user, accountingRole, clear } = useAuth();

  const profileHref = "/settings/profile";

  const handleLogout = () => {
    // Vider le store Zustand
    clear();
    // Purger la session (localStorage + tokens OpenAPI des deux clients)
    clearSession();
    // Rediriger vers la page de connexion (replace : pas de retour arrière
    // possible vers le dashboard via le bouton précédent).
    router.replace("/");
  };

  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined" || !user?.id) return;
    setAvatarUrl(localStorage.getItem(`profile_avatar_${user.id}`));
  }, [user?.id]);

  // Dériver le prénom/nom depuis l'email ou le username si absents
  const getDerivedNames = () => {
    if (!user) return { firstName: "", lastName: "" };
    let first = user.firstName || "";
    let last = user.lastName || "";
    if (!first && !last) {
      const username = (user as { username?: string }).username;
      const identifier = username || (user.email ? user.email.split("@")[0] : "");
      if (identifier) {
        const parts = identifier.replace(/[._-]+/g, " ").trim().split(/\s+/);
        if (parts.length === 1) {
          first = parts[0];
        } else if (parts.length > 1) {
          first = parts[0];
          last = parts.slice(1).join(" ");
        }
      }
    }
    return { firstName: first, lastName: last };
  };

  const { firstName, lastName } = getDerivedNames();

  // Initiales pour l'avatar
  const initials = user
    ? `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || user.email?.[0]?.toUpperCase() || "?"
    : "?";

  const displayName = user
    ? `${firstName ?? ""} ${lastName ?? ""}`.trim() || "Utilisateur"
    : "Utilisateur";

  const displayEmail = user?.email ?? "";

  const roleLabel = getRoleLabel(accountingRole);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} className="object-cover" />}
            <AvatarFallback className="bg-blue-600 text-white font-semibold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-60" align="end" forceMount>
        <DropdownMenuLabel className="font-normal pb-2">
          <div className="flex flex-col space-y-0.5">
            <p className="text-sm font-semibold leading-none text-gray-900">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground mt-1">{displayEmail}</p>
            {accountingRole && (
              <span className="text-[10px] font-mono text-gray-400 mt-0.5">{roleLabel}</span>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href={profileHref} className="cursor-pointer">
              <User className="mr-2 h-4 w-4" /> Mon profil
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings" className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" /> Paramètres
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings/password" className="cursor-pointer">
              <KeyRound className="mr-2 h-4 w-4" /> Changer le mot de passe
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50"
        >
          <LogOut className="mr-2 h-4 w-4" /> Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
