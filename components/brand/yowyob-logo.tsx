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
};

export function YowyobLogo({
  className,
  imageClassName,
  size = 'md',
  showSubtitle = false,
  subtitle = 'ACCOUNTING',
  priority = false,
}: YowyobLogoProps) {
  const displayHeight = LOGO_SIZES[size];

  return (
    <div className={cn('flex flex-col', className)}>
      <Image
        src={LOGO_SRC}
        alt="Yowyob ERP"
        width={218}
        height={256}
        priority={priority}
        className={cn('w-auto object-contain', imageClassName)}
        style={{ height: displayHeight }}
      />
      {showSubtitle ? (
        <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
      ) : null}
    </div>
  );
}
