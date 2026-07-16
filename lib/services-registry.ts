// lib/services-registry.ts
// Registre statique des plateformes du système KSM affichées dans le lanceur
// d'applications (la « gaufre » du header).
//
// Les plateformes correspondent aux modules du kernel (dossiers `RT-comops-<nom>-core`
// à la racine de KSM_Kernel_Layer), SAUF `kernel` qui n'est pas une plateforme.
// S'y ajoutent `banking` et `yowpainter`.
//
// Nomenclature des URLs : chaque plateforme est servie sur https://<nom>.yowyob.com
// (le « nom » ne contient jamais « core »). Cas particulier : le module `tp` est
// servi sous le sous-domaine `thirdparty`.

export type PlatformIconShape =
    | "box" | "car" | "graduation" | "book" | "key" | "bus"
    | "truck" | "flag" | "taxi" | "card" | "star" | "brush";

export interface PlatformService {
    id: string;
    name: string;
    initials: string;
    description?: string;
    color: string;
    iconShape: PlatformIconShape;
    /** URL de la plateforme (ouverte dans un nouvel onglet), suivant la nomenclature. */
    url?: string;
    /**
     * Chemin d'une vraie icône (image) à afficher à la place de la tuile à initiales.
     * Ex. "/images/yowyob-logo.png". Repli sur la tuile colorée si absent.
     */
    iconUrl?: string;
    /**
     * Superpose une pastille colorée (couleur + initiales) sur l'icône image, pour
     * distinguer les plateformes qui partagent un même logo (accounting/billing/tp).
     */
    badge?: boolean;
}

// Statut des sous-domaines vérifié en ligne le 2026-07-16 :
//   ✔ répondent          : accounting, billing, hrm, payroll, thirdparty (200)
//   ↪ provisionnés        : cashier (307), auth (502, back momentanément down)
//   ✘ ne résolvent pas    : actor, administration, banking, blockchain, common, file,
//                            inventory, notification, organization, product, resource,
//                            roles, sales, settings, spare, treasury, yowpainter
// Les URL restent renseignées selon la nomenclature : elles s'activeront dès que le
// sous-domaine correspondant sera déployé.
export const PLATFORM_SERVICES: PlatformService[] = [
    // ─── Finance & gestion ───
    { id: "accounting", name: "Accounting", initials: "AC", description: "Comptabilité générale et analytique (plan OHADA).", color: "#2563EB", iconShape: "card", url: "https://accounting.yowyob.com", iconUrl: "/images/yowyob-logo.png", badge: true },
    { id: "billing", name: "Billing", initials: "BL", description: "Facturation et gestion des factures.", color: "#1E40AF", iconShape: "box", url: "https://billing.yowyob.com", iconUrl: "/images/yowyob-logo.png", badge: true },
    { id: "sales", name: "Sales", initials: "SL", description: "Ventes et commandes clients.", color: "#16A34A", iconShape: "taxi", url: "https://sales.yowyob.com" },
    { id: "cashier", name: "Cashier", initials: "CS", description: "Caisse et encaissements.", color: "#DC2626", iconShape: "card", url: "https://cashier.yowyob.com" },
    { id: "treasury", name: "Treasury", initials: "TR", description: "Trésorerie et rapprochements bancaires.", color: "#0369A1", iconShape: "card", url: "https://treasury.yowyob.com" },
    { id: "banking", name: "Banking", initials: "BK", description: "Services bancaires.", color: "#0891B2", iconShape: "card", url: "https://banking.yowyob.com", iconUrl: "/images/ksm-banking.png" },
    { id: "payroll", name: "Payroll", initials: "PR", description: "Paie et bulletins de salaire.", color: "#16A34A", iconShape: "card", url: "https://payroll.yowyob.com", iconUrl: "/images/ksm-payroll.png" },

    // ─── Opérations ───
    { id: "hrm", name: "HRM", initials: "HR", description: "Ressources humaines.", color: "#DB2777", iconShape: "graduation", url: "https://hrm.yowyob.com", iconUrl: "/images/ksm-hrm.png" },
    { id: "inventory", name: "Inventory", initials: "IV", description: "Stock et inventaire.", color: "#D97706", iconShape: "truck", url: "https://inventory.yowyob.com" },
    { id: "product", name: "Product", initials: "PD", description: "Catalogue produits.", color: "#EA580C", iconShape: "box", url: "https://product.yowyob.com" },
    { id: "resource", name: "Resource", initials: "RS", description: "Matériels et équipements.", color: "#0D9488", iconShape: "truck", url: "https://resource.yowyob.com" },
    { id: "spare", name: "Spare", initials: "SP", description: "Pièces détachées.", color: "#B45309", iconShape: "truck", url: "https://spare.yowyob.com" },
    { id: "tp", name: "Third Party", initials: "TP", description: "Tiers : clients et fournisseurs.", color: "#F97316", iconShape: "book", url: "https://thirdparty.yowyob.com", iconUrl: "/images/yowyob-logo.png", badge: true },
    { id: "organization", name: "Organization", initials: "OR", description: "Organisations et agences.", color: "#2563EB", iconShape: "star", url: "https://organization.yowyob.com" },
    { id: "actor", name: "Actor", initials: "AT", description: "Acteurs et intervenants.", color: "#6366F1", iconShape: "star", url: "https://actor.yowyob.com" },

    // ─── Plateforme & administration ───
    { id: "administration", name: "Administration", initials: "AD", description: "Administration de la plateforme.", color: "#64748B", iconShape: "flag", url: "https://administration.yowyob.com" },
    { id: "auth", name: "YowAuth", initials: "YA", description: "Authentification et identités.", color: "#0EA5E9", iconShape: "key", url: "https://auth.yowyob.com" },
    { id: "roles", name: "Roles", initials: "RO", description: "Rôles et permissions.", color: "#9333EA", iconShape: "key", url: "https://roles.yowyob.com" },
    { id: "settings", name: "Settings", initials: "ST", description: "Paramètres et configuration.", color: "#52525B", iconShape: "brush", url: "https://settings.yowyob.com" },
    { id: "notification", name: "Notification", initials: "NT", description: "Notifications et alertes.", color: "#F59E0B", iconShape: "flag", url: "https://notification.yowyob.com" },
    { id: "file", name: "File", initials: "FL", description: "Fichiers et documents.", color: "#475569", iconShape: "book", url: "https://file.yowyob.com" },
    { id: "blockchain", name: "Blockchain", initials: "BC", description: "Traçabilité blockchain.", color: "#8B5CF6", iconShape: "box", url: "https://blockchain.yowyob.com" },


    // ─── Créatif ───
    { id: "yowpainter", name: "Yow Painter", initials: "YP", description: "Marketplace artistes et designers.", color: "#D946EF", iconShape: "brush", url: "https://yowpainter.yowyob.com" },
];
