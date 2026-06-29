"use client";

import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, ScrollText, Search, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SystemAuditsService } from "@/src/lib/services/SystemAuditsService";
import { SystemAudit } from "@/src/lib/models/SystemAudit";

export default function AuditsSettingsPage() {
  const [audits, setAudits] = useState<SystemAudit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const data = await SystemAuditsService.getOrganizationActivity(100);
        if (!cancelled) setAudits(data || []);
      } catch (error) {
        console.error(error);
        if (!cancelled) toast.error("Impossible de charger le journal d'audit.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return audits;
    return audits.filter((a) =>
      [a.user, a.action, a.remarks]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [audits, query]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          Journal d&apos;audit
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Les dernières actions effectuées au sein de votre organisation.
        </p>
      </div>

      <Card className="border-gray-100 shadow-sm rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-blue-600" />
            {audits.length} entrée{audits.length > 1 ? "s" : ""}
          </CardTitle>
          <div className="relative w-64 max-w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Aucune activité enregistrée.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Détails</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((a, i) => (
                    <TableRow key={a.id || i}>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {a.date ? new Date(a.date).toLocaleString("fr-FR") : "—"}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5 text-sm">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          {a.user || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal">
                          {a.action || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-md break-words">
                        {a.remarks || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
