import { LucideIcon } from 'lucide-react';

interface PageHeroProps {
  icon?: LucideIcon;
  eyebrow?: string;
  title: string;
  description?: string;
}

// Bandeau d'en-tête commun aux pages marketing (titre + sous-titre).
export function PageHero({ icon: Icon, eyebrow, title, description }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10" />
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {Icon && (
          <div className="mx-auto mb-6 w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">
            <Icon className="h-7 w-7 text-blue-600" />
          </div>
        )}
        {eyebrow && (
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600 mb-3">
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </section>
  );
}
