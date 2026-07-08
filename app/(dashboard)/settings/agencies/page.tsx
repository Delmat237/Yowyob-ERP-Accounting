"use client";

import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Building2, Search, MapPin, Phone, Mail, Star } from "lucide-react";
import { CustomPageLoader } from "@/components/ui/custom-page-loader";
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
import { AgenciesService } from "@/src/lib/services/AgenciesService";
import { Agency } from "@/src/lib/models/Agency";

export default function AgenciesSettingsPage() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const orgId = typeof window !== "undefined" ? localStorage.getItem("organization_id") : null;
        if (!orgId) {
          if (!cancelled) setAgencies([]);
          return;
        }
        const data = await AgenciesService.getAgencies(orgId);
        if (!cancelled) setAgencies(data || []);
      } catch (error) {
        console.error(error);
        if (!cancelled) toast.error("Impossible de charger les agences & sites.");
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
    if (!q) return agencies;
    return agencies.filter((a) =>
      [a.name, a.code, a.city, a.country, a.address]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [agencies, query]);

  if (isLoading) {
    return <CustomPageLoader message="Chargement des agences..." />;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          Agences &amp; Sites
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Les implantations physiques de votre organisation.
        </p>
      </div>

      <Card className="border-gray-100 shadow-sm rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            {agencies.length} agence{agencies.length > 1 ? "s" : ""}
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
          {filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Aucune agence à afficher.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Localisation</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {a.isHeadquarter ? (
                            <Star className="h-4 w-4 text-amber-500" aria-label="Siège" />
                          ) : null}
                          {a.name || a.shortName || "—"}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{a.code || "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          {[a.city, a.country].filter(Boolean).join(", ") || a.address || "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                          {a.phone ? (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {a.phone}
                            </span>
                          ) : null}
                          {a.email ? (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {a.email}
                            </span>
                          ) : null}
                          {!a.phone && !a.email ? "—" : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={a.isActive ? "default" : "secondary"}
                          className={a.isActive ? "bg-emerald-600 hover:bg-emerald-600" : ""}
                        >
                          {a.isActive ? "Active" : "Inactive"}
                        </Badge>
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
