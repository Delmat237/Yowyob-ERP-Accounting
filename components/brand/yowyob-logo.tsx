import Image from 'next/image';
import { cn } from '@/lib/utils';

const LOGO_SRC = '/images/yowyob-logo.png';

/** Logo portrait (218×256) : la hauteur fixe garantit une bonne lisibilité. */
const LOGO_SIZES = {
  sm: 32,
  md: 40,
  lg: 48,
} as const;

type LogoSize = keyof typeof LOGO_SIZES;

type YowyobLogoProps = {
  className?: string;
  imageClassName?: string;
  /** Hauteur d'affichage en px — prioritaire pour la lisibilité. */
  size?: LogoSize;
  showSubtitle?: boolean;
  subtitle?: string;
  priority?: boolean;
  /** Pastille « AC » (identité Accounting) superposée au logo. Activée par défaut. */
  badge?: boolean;
  badgeLabel?: string;
  badgeColor?: string;
};

export function YowyobLogo({
  className,
  imageClassName,
  size = 'md',
  showSubtitle = false,
  subtitle = 'ACCOUNTING',
  priority = false,
  badge = true,
  badgeLabel = 'AC',
  badgeColor = '#2563EB',
}: YowyobLogoProps) {
  const displayHeight = LOGO_SIZES[size];

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="relative inline-flex" style={{ height: displayHeight }}>
        <Image
          src={LOGO_SRC}
          alt="Yowyob ERP — Accounting"
          width={218}
          height={256}
          priority={priority}
          className={cn('w-auto object-contain', imageClassName)}
          style={{ height: displayHeight }}
        />
        {badge ? (
          <span
            aria-hidden
            style={{
              position: 'absolute',
              right: -displayHeight * 0.12,
              bottom: -displayHeight * 0.08,
              minWidth: displayHeight * 0.5,
              height: displayHeight * 0.5,
              padding: '0 4px',
              borderRadius: 999,
              background: badgeColor,
              color: '#fff',
              fontSize: displayHeight * 0.27,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #fff',
              fontFamily: "'Roboto', sans-serif",
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }}
          >
            {badgeLabel}
          </span>
        ) : null}
      </div>
      {showSubtitle ? (
        <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
      ) : null}
    </div>
  );
}
