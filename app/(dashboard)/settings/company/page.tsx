"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  Mail,
  Globe,
  Hash,
  Landmark,
  CalendarDays,
  Users,
  BadgeCheck,
  ShieldAlert,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomPageLoader } from "@/components/ui/custom-page-loader";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { OrganizationsService } from "@/src/lib/services/OrganizationsService";
import { Organization } from "@/src/lib/models/Organization";

/** Affiche une paire libellé / valeur ; masque la ligne si la valeur est vide. */
function Field({
  icon: Icon,
  label,
  value,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string | number | null;
}) {
  const display =
    value === undefined || value === null || value === "" ? "—" : String(value);
  return (
    <div className="flex flex-col gap-1 py-2">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
        {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
        {label}
      </span>
      <span className="text-sm text-gray-900 break-words">{display}</span>
    </div>
  );
}

export default function CompanySettingsPage() {
  const { user } = useAuth();
  const [org, setOrg] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const orgId =
    user?.organizationId ||
    (typeof window !== "undefined" ? localStorage.getItem("organization_id") : null);

  useEffect(() => {
    if (!orgId) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const data = await OrganizationsService.getOrganizationById(orgId);
        if (!cancelled) setOrg(data ?? null);
      } catch (error) {
        console.error(error);
        if (!cancelled)
          toast.error("Impossible de charger les informations de l'organisation.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  if (isLoading) {
    return <CustomPageLoader message="Chargement de l'organisation..." />;
  }

  if (!orgId) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-3 py-6">
            <ShieldAlert className="h-6 w-6 text-amber-600" />
            <p className="text-sm text-amber-800">
              Aucune organisation active. Connectez-vous et sélectionnez une organisation
              pour consulter ses paramètres.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="border-gray-200">
          <CardContent className="py-6 text-sm text-muted-foreground">
            Organisation introuvable.
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusActive = org.active ?? org.status?.toLowerCase() === "active";

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-xl bg-blue-600 text-white flex items-center justify-center overflow-hidden shadow-md">
            {org.logoUri ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={org.logoUri} alt={org.name ?? "Logo"} className="h-full w-full object-cover" />
            ) : (
              <Building2 className="h-8 w-8" />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              {org.name || "Organisation"}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {org.code ? `Code ${org.code} · ` : ""}Informations de votre organisation
            </p>
          </div>
        </div>
        <Badge
          variant={statusActive ? "default" : "secondary"}
          className={statusActive ? "bg-emerald-600 hover:bg-emerald-600" : ""}
        >
          <BadgeCheck className="h-3.5 w-3.5 mr-1" />
          {statusActive ? "Active" : org.status || "Inactive"}
        </Badge>
      </div>

      {/* Identité */}
      <Card className="border-gray-100 shadow-sm rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg">Identité</CardTitle>
          <CardDescription>Dénomination et description de l'organisation.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
          <Field icon={Building2} label="Nom" value={org.name} />
          <Field icon={Hash} label="Code" value={org.code} />
          <Field label="Type de service" value={org.serviceType} />
          <Field label="Forme juridique" value={org.legalForm} />
          <div className="md:col-span-2">
            <Field label="Description" value={org.description} />
          </div>
        </CardContent>
      </Card>

      {/* Coordonnées */}
      <Card className="border-gray-100 shadow-sm rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg">Coordonnées</CardTitle>
          <CardDescription>Contacts et présence en ligne.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
          <Field icon={Mail} label="Email" value={org.email} />
          <Field icon={Globe} label="Site web" value={org.websiteUrl} />
          <Field label="Réseau social" value={org.socialNetwork} />
          <Field icon={Users} label="Dirigeant (CEO)" value={org.ceoName} />
        </CardContent>
      </Card>

      {/* Légal & fiscal */}
      <Card className="border-gray-100 shadow-sm rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg">Légal &amp; fiscal</CardTitle>
          <CardDescription>Immatriculation et données financières.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
          <Field icon={Landmark} label="N° d'immatriculation" value={org.businessRegistrationNumber} />
          <Field icon={Hash} label="N° fiscal" value={org.taxNumber} />
          <Field label="Capital social" value={org.capitalShare} />
          <Field icon={CalendarDays} label="Année de création" value={org.yearFounded} />
          <Field icon={Users} label="Nombre d'employés" value={org.numberOfEmployees} />
          <Field label="Mots-clés" value={org.keywords} />
        </CardContent>
      </Card>

      {/* Métadonnées */}
      <Card className="border-gray-100 shadow-sm rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg">Métadonnées</CardTitle>
          <CardDescription>Identifiants techniques et historique.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
          <Field label="ID organisation" value={org.id} />
          <Field label="ID Business Actor" value={org.businessActorId} />
          <Field
            icon={CalendarDays}
            label="Créée le"
            value={org.createdAt ? new Date(org.createdAt).toLocaleString("fr-FR") : undefined}
          />
          <Field
            icon={CalendarDays}
            label="Modifiée le"
            value={org.updatedAt ? new Date(org.updatedAt).toLocaleString("fr-FR") : undefined}
          />
        </CardContent>
      </Card>
    </div>
  );
}
