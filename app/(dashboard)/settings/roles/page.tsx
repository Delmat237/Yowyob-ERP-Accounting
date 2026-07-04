"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, KeyRound } from "lucide-react";
import { CustomPageLoader } from "@/components/ui/custom-page-loader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmployeesRolesService } from "@/src/lib/services/EmployeesRolesService";
import { Role } from "@/src/lib/models/Role";

export default function RolesSettingsPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const data = await EmployeesRolesService.getRoles();
        if (!cancelled) setRoles(data || []);
      } catch (error) {
        console.error(error);
        if (!cancelled) toast.error("Impossible de charger les rôles & droits.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return <CustomPageLoader message="Chargement des rôles..." />;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          Rôles &amp; Droits
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Les rôles disponibles dans votre organisation et les permissions associées.
        </p>
      </div>

      {roles.length === 0 ? (
        <Card className="border-gray-100 shadow-sm rounded-xl">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Aucun rôle défini.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((role) => (
            <Card key={role.id} className="border-gray-100 shadow-sm rounded-xl">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-blue-600" />
                  {role.name || "Rôle"}
                </CardTitle>
                {role.description ? (
                  <CardDescription>{role.description}</CardDescription>
                ) : null}
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                  <KeyRound className="h-3.5 w-3.5" />
                  {role.permissions?.length || 0} permission
                  {(role.permissions?.length || 0) > 1 ? "s" : ""}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(role.permissions || []).map((p) => (
                    <Badge key={p.id || p.authority} variant="secondary" className="font-normal">
                      {p.authority || `${p.resource ?? ""}:${p.action ?? ""}`}
                    </Badge>
                  ))}
                  {(role.permissions?.length || 0) === 0 ? (
                    <span className="text-sm text-muted-foreground">—</span>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
