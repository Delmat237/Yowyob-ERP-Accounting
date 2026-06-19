"use client";

import { UserNav } from "./user-nav";
import { Button } from "../ui/button";
import { Menu, Search, Settings, HelpCircle, BookOpen, FileText, ShieldCheck, BarChart3, FileClock, Layers } from "lucide-react";
import { Input } from "../ui/input";
import { useSidebar } from "@/hooks/useSidebar";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import Link from "next/link";
import { NotificationBell } from "../notifications/notification-bell";
import { useAuth } from "@/hooks/use-auth";

// ─── Contenu du centre d'aide par rôle ───────────────────────────────────────

const HELP_CONTENT = {
  AIDE_COMPTABLE: {
    label: "Aide — Aide-comptable",
    sections: [
      {
        title: "Mes tâches principales",
        items: [
          { icon: FileClock, label: "Créer une écriture brouillon", href: "/accounting/entries" },
          { icon: Layers, label: "Imputer une ligne analytique", href: "/accounting/analytics" },
          { icon: BookOpen, label: "Consulter le plan comptable", href: "/accounting/chart-of-accounts" },
          { icon: BarChart3, label: "Suivre les budgets", href: "/accounting/budgets" },
        ],
      },
      {
        title: "Rappels importants",
        items: [
          { icon: ShieldCheck, label: "Je ne peux pas valider les écritures", href: null },
          { icon: ShieldCheck, label: "Je ne peux pas modifier le plan comptable", href: null },
          { icon: ShieldCheck, label: "Je ne peux pas accéder aux paramètres", href: null },
        ],
      },
    ],
  },
  COMPTABLE: {
    label: "Aide — Comptable",
    sections: [
      {
        title: "Mes tâches principales",
        items: [
          { icon: FileClock, label: "Valider les écritures brouillon", href: "/accounting/validation" },
          { icon: BookOpen, label: "Gérer le plan comptable", href: "/accounting/chart-of-accounts" },
          { icon: FileText, label: "Consulter les rapports", href: "/accounting/reports" },
          { icon: BarChart3, label: "Gérer les budgets", href: "/accounting/budgets" },
          { icon: Layers, label: "Axes analytiques", href: "/accounting/analytics" },
        ],
      },
      {
        title: "Rappels importants",
        items: [
          { icon: ShieldCheck, label: "Je ne peux pas installer les packs fiscaux", href: null },
          { icon: ShieldCheck, label: "Je ne peux pas attribuer des rôles", href: null },
        ],
      },
    ],
  },
  RESPONSABLE_COMPTABLE: {
    label: "Aide — Responsable comptable",
    sections: [
      {
        title: "Administration",
        items: [
          { icon: ShieldCheck, label: "Attribuer les rôles comptables", href: "/accounting/role-assignment" },
          { icon: BookOpen, label: "Installer un pack de localisation", href: "/accounting/ohada-pack" },
          { icon: FileClock, label: "Verrouiller une période", href: "/accounting/periods" },
          { icon: BarChart3, label: "Paramètres comptables", href: "/accounting/settings" },
        ],
      },
      {
        title: "Supervision",
        items: [
          { icon: FileText, label: "Rapports financiers", href: "/accounting/reports" },
          { icon: Layers, label: "Journal d'audit", href: "/analyse/audits" },
          { icon: BarChart3, label: "Budgets & Réalisé", href: "/accounting/budgets" },
        ],
      },
    ],
  },
} as const;

// ─── Composant Header ─────────────────────────────────────────────────────────

export function Header() {
  const { toggle, toggleMobile } = useSidebar();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const { accountingRole } = useAuth();

  const helpContent = accountingRole
    ? HELP_CONTENT[accountingRole as keyof typeof HELP_CONTENT]
    : null;

  const handleMenuClick = () => {
    if (isMobile) {
      toggleMobile();
    } else {
      toggle();
    }
  };

  return (
    <header className="flex-shrink-0 h-16 flex items-center px-3 md:px-6 bg-transparent">
      <Button variant="ghost" size="icon" className="mr-2" onClick={handleMenuClick}>
        <Menu className="h-5 w-5 text-gray-600" />
      </Button>
      <div className="font-semibold text-lg tracking-tight text-gray-700 mr-6">
        KSM
      </div>

      <div className="hidden sm:flex flex-1 max-w-2xl">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Rechercher..."
            className="w-full bg-[#eaf1fb] rounded-full pl-10 pr-4 py-2 h-12 border-transparent focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-200"
          />
        </div>
      </div>

      <div className="flex-1" />

      <div className="ml-auto flex items-center gap-1 md:gap-2">
        {/* Centre d'aide spécifique au rôle — masqué sur mobile */}
        <div className="hidden md:flex">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" title="Centre d'aide">
                <HelpCircle className="h-5 w-5 text-gray-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              {helpContent ? (
                <>
                  <DropdownMenuLabel>
                    {helpContent.label}
                  </DropdownMenuLabel>
                  {helpContent.sections.map((section, si) => (
                    <div key={si}>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-[11px] text-gray-500 uppercase tracking-wide px-2 py-1">
                        {section.title}
                      </DropdownMenuLabel>
                      {section.items.map((item, ii) => (
                        item.href ? (
                          <DropdownMenuItem key={ii} asChild className="cursor-pointer gap-2">
                            <Link href={item.href} className="flex items-center gap-2">
                              <item.icon className="h-4 w-4 text-gray-600 shrink-0" />
                              <span className="text-sm">{item.label}</span>
                            </Link>
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem key={ii} disabled className="gap-2 opacity-60">
                            <item.icon className="h-4 w-4 text-gray-600 shrink-0" />
                            <span className="text-sm">{item.label}</span>
                          </DropdownMenuItem>
                        )
                      ))}
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <DropdownMenuLabel>Centre d&apos;aide</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Connectez-vous pour accéder à l&apos;aide personnalisée</DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Paramètres — masqué sur mobile */}
        <div className="hidden md:flex">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5 text-gray-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Paramètres</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href="/settings/company">Organisation</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings/agencies">Agences &amp; Sites</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings/business-actor">Mon Profil Pro</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings/users">Employés</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings/roles">Rôles &amp; Droits</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings/audits">Journal d&apos;audit</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <NotificationBell />
        <UserNav />
      </div>
    </header>
  );
}
