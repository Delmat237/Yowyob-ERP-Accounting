"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  UserSquare,
  Phone,
  Globe,
  MapPin,
  Hash,
  Building,
  CalendarDays,
} from "lucide-react";
import { CustomPageLoader } from "@/components/ui/custom-page-loader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BusinessActorsService } from "@/src/lib/services/BusinessActorsService";
import { BusinessActor } from "@/src/lib/models/BusinessActor";

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

export default function BusinessActorSettingsPage() {
  const [actor, setActor] = useState<BusinessActor | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const data = await BusinessActorsService.getMyProfile();
        if (!cancelled) setActor(data ?? null);
      } catch (error) {
        console.error(error);
        if (!cancelled) toast.error("Impossible de charger votre profil professionnel.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return <CustomPageLoader message="Chargement de votre profil professionnel..." />;
  }

  if (!actor) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-6 text-sm text-amber-800">
            Aucun profil Business Actor trouvé pour votre compte.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
          <UserSquare className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            {actor.name || "Mon Profil Pro"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Votre profil professionnel (Business Actor) sur la plateforme.
          </p>
        </div>
      </div>

      <Card className="border-gray-100 shadow-sm rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg">Identité professionnelle</CardTitle>
          <CardDescription>Informations légales et de contact.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
          <Field icon={UserSquare} label="Nom" value={actor.name} />
          <Field icon={Building} label="Profil métier" value={actor.businessProfile} />
          <Field icon={Hash} label="NIU" value={actor.niu} />
          <Field icon={Hash} label="N° registre du commerce" value={actor.tradeRegistryNumber} />
          <Field icon={Phone} label="Téléphone" value={actor.contactPhone} />
          <Field icon={Globe} label="Site web" value={actor.website} />
          <Field icon={MapPin} label="Adresse privée" value={actor.privateAddress} />
          <Field icon={MapPin} label="Adresse professionnelle" value={actor.businessAddress} />
        </CardContent>
      </Card>

      <Card className="border-gray-100 shadow-sm rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg">Métadonnées</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
          <Field label="ID acteur" value={actor.id} />
          <Field label="ID business" value={actor.businessId} />
          <Field
            icon={CalendarDays}
            label="Créé le"
            value={actor.createdAt ? new Date(actor.createdAt).toLocaleString("fr-FR") : undefined}
          />
        </CardContent>
      </Card>
    </div>
  );
}
