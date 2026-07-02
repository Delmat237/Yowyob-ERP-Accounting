"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { UsersService } from "@/src/lib/services/UsersService";
import { OrganizationsService } from "@/src/lib/services/OrganizationsService";
import type { User } from "@/src/lib/models/User";
import type { Organization } from "@/src/lib/models/Organization";
import { useAuth } from "@/hooks/use-auth";

function readStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function toProfileFromAuth(user: User): User {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    organizationId: user.organizationId,
    roles: user.roles,
  };
}

export function useUserProfile(options?: { loadOrganization?: boolean }) {
  const { user: authUser, accountingRole } = useAuth();
  const loadOrganization = options?.loadOrganization ?? false;
  const [profile, setProfile] = useState<User | null>(() => authUser ?? readStoredUser());
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(() => !profile);
  const [error, setError] = useState(false);
  const initialLoadDone = useRef(false);

  const load = useCallback(
    async (notifyOnError = false) => {
      const sessionUser = useAuth.getState().user ?? readStoredUser();

      setLoading(true);
      setError(false);
      try {
        const data = await UsersService.getMe();
        setProfile(data);

        if (loadOrganization) {
          const orgId =
            data.organizationId ||
            sessionUser?.organizationId ||
            (typeof window !== "undefined" ? localStorage.getItem("organization_id") : null);
          if (orgId) {
            try {
              const org = await OrganizationsService.getOrganizationById(orgId);
              setOrganization(org ?? null);
            } catch {
              setOrganization(null);
            }
          }
        }
      } catch (err) {
        console.error(err);
        setError(true);
        if (sessionUser) {
          setProfile(toProfileFromAuth(sessionUser));
        }
        if (notifyOnError) {
          toast.error("Impossible de charger le profil depuis l'API.");
        }
      } finally {
        setLoading(false);
      }
    },
    [loadOrganization],
  );

  useEffect(() => {
    if (authUser && !profile) {
      setProfile(toProfileFromAuth(authUser));
      setLoading(false);
    }
  }, [authUser, profile]);

  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;
    void load(false);
  }, [load]);

  const username = (profile as User & { username?: string })?.username;
  const initials =
    `${profile?.firstName?.[0] ?? ""}${profile?.lastName?.[0] ?? ""}`.toUpperCase() ||
    username?.[0]?.toUpperCase() ||
    "?";
  const fullName =
    `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim() ||
    username ||
    "Utilisateur";

  return {
    profile,
    organization,
    accountingRole,
    loading,
    error,
    initials,
    fullName,
    refresh: () => load(true),
  };
}
