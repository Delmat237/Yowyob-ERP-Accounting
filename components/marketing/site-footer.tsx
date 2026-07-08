import Link from 'next/link';
import { Building2 } from 'lucide-react';

// Colonnes du pied de page. Chaque entrée pointe vers une page réelle
// du site marketing (cf. app/(marketing)/...).
const footerColumns = [
  {
    title: 'Produit',
    links: [
      { label: 'Accueil', href: '/' },
      { label: 'Fonctionnalités', href: '/features' },
      { label: 'Tarifs', href: '/pricing' },
      { label: 'API', href: '/developers' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Documentation', href: '/docs' },
      { label: "Centre d'aide", href: '/help' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Entreprise',
    links: [
      { label: 'À propos', href: '/about' },
      { label: 'Carrières', href: '/careers' },
      { label: 'Presse', href: '/press' },
    ],
  },
  {
    title: 'Légal',
    links: [
      { label: 'Conditions KSM', href: '/terms' },
      { label: 'Confidentialité', href: '/privacy' },
      { label: 'Cookies & Publicité', href: '/cookies' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold">KSM</span>
            </Link>
            <p className="text-gray-400 text-sm">
              Solution complète pour maîtriser votre gestion comptable.
            </p>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="font-semibold mb-4">{column.title}</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2026 YowYob Inc. Ltd. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
