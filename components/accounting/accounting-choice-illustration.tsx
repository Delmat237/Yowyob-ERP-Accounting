"use client";

import { cn } from "@/lib/utils";

type AccountingChoiceIllustrationProps = {
  className?: string;
};

/**
 * Fond décoratif — choix CG / CA, tons bleu clair.
 */
export function AccountingChoiceIllustration({ className }: AccountingChoiceIllustrationProps) {
  return (
    <svg
      viewBox="0 0 1200 800"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      className={cn("w-full h-full min-h-full min-w-full", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="1200" y2="800" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F0F9FF" />
          <stop offset="0.45" stopColor="#E0F2FE" />
          <stop offset="1" stopColor="#DBEAFE" />
        </linearGradient>
        <linearGradient id="cg-panel" x1="80" y1="120" x2="520" y2="680" gradientUnits="userSpaceOnUse">
          <stop stopColor="#BFDBFE" stopOpacity="0.55" />
          <stop offset="1" stopColor="#93C5FD" stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id="ca-panel" x1="680" y1="120" x2="1120" y2="680" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A5B4FC" stopOpacity="0.45" />
          <stop offset="1" stopColor="#7DD3FC" stopOpacity="0.35" />
        </linearGradient>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0H0V40" stroke="#BAE6FD" strokeWidth="1" opacity="0.35" />
        </pattern>
      </defs>

      <rect width="1200" height="800" fill="url(#sky)" />
      <rect width="1200" height="800" fill="url(#grid)" />

      {/* Halo central */}
      <ellipse cx="600" cy="400" rx="420" ry="280" fill="#FFFFFF" opacity="0.45" />
      <ellipse cx="600" cy="400" rx="280" ry="180" fill="#E0F2FE" opacity="0.35" />

      {/* ── Comptabilité Générale (gauche) ── */}
      <g opacity="0.9">
        <rect x="90" y="150" width="420" height="500" rx="28" fill="url(#cg-panel)" stroke="#93C5FD" strokeWidth="2" />
        <text x="130" y="210" fill="#0369A1" fontSize="22" fontWeight="700" fontFamily="inherit">
          Comptabilité Générale
        </text>
        <text x="130" y="238" fill="#0284C7" fontSize="14" fontFamily="inherit" opacity="0.8">
          Plan comptable · Écritures · Journaux
        </text>

        {/* Grand livre */}
        <rect x="130" y="270" width="180" height="240" rx="14" fill="#38BDF8" opacity="0.85" />
        <rect x="148" y="292" width="144" height="20" rx="5" fill="#F0F9FF" opacity="0.95" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect key={i} x="148" y={328 + i * 22} width={120 - (i % 2) * 20} height="10" rx="3" fill="#F0F9FF" opacity={0.85 - i * 0.08} />
        ))}
        <path d="M310 270V510" stroke="#0EA5E9" strokeWidth="3" opacity="0.6" />

        {/* Balance */}
        <rect x="340" y="300" width="130" height="180" rx="12" fill="#FFFFFF" opacity="0.75" stroke="#7DD3FC" strokeWidth="1.5" />
        <text x="360" y="330" fill="#0369A1" fontSize="12" fontWeight="600" fontFamily="inherit">Balance</text>
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <rect x="360" y={345 + i * 24} width="42" height="14" rx="3" fill="#E0F2FE" />
            <rect x="410" y={345 + i * 24} width="42" height="14" rx="3" fill="#BAE6FD" />
          </g>
        ))}

        {/* Symbole = */}
        <circle cx="405" cy="520" r="26" fill="#60A5FA" opacity="0.8" />
        <text x="405" y="528" textAnchor="middle" fill="white" fontSize="22" fontWeight="700" fontFamily="inherit">=</text>
      </g>

      {/* ── Comptabilité Analytique (droite) ── */}
      <g opacity="0.9">
        <rect x="690" y="150" width="420" height="500" rx="28" fill="url(#ca-panel)" stroke="#818CF8" strokeWidth="2" />
        <text x="730" y="210" fill="#4338CA" fontSize="22" fontWeight="700" fontFamily="inherit">
          Comptabilité Analytique
        </text>
        <text x="730" y="238" fill="#4F46E5" fontSize="14" fontFamily="inherit" opacity="0.8">
          Centres de coût · Budgets · Axes
        </text>

        {/* Camembert */}
        <circle cx="820" cy="390" r="78" fill="#DBEAFE" />
        <path d="M820 312 A78 78 0 0 1 898 390 L820 390 Z" fill="#6366F1" opacity="0.85" />
        <path d="M820 390 A78 78 0 0 1 770 458 L820 390 Z" fill="#38BDF8" opacity="0.9" />
        <path d="M820 390 A78 78 0 1 1 820 312 L820 390 Z" fill="#93C5FD" />
        <circle cx="820" cy="390" r="24" fill="#F0F9FF" />

        {/* Barres budget */}
        <rect x="930" y="300" width="140" height="180" rx="12" fill="#FFFFFF" opacity="0.75" stroke="#A5B4FC" strokeWidth="1.5" />
        <text x="950" y="328" fill="#4338CA" fontSize="12" fontWeight="600" fontFamily="inherit">Budget vs réalisé</text>
        {[52, 78, 110, 68, 95].map((h, i) => (
          <g key={i}>
            <rect x={948 + i * 22} y={460 - h} width="14" height={h} rx="4" fill="#818CF8" opacity="0.85" />
            <rect x={954 + i * 22} y={460 - h * 0.65} width="8" height={h * 0.65} rx="2" fill="#38BDF8" opacity="0.9" />
          </g>
        ))}

        {/* Axes / branches */}
        <circle cx="760" cy="520" r="10" fill="#6366F1" />
        <circle cx="860" cy="540" r="10" fill="#38BDF8" />
        <circle cx="960" cy="515" r="10" fill="#60A5FA" />
        <path d="M760 520 H860 M820 390 V520 M860 540 H960" stroke="#7DD3FC" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
      </g>

      {/* Lien central entre les deux mondes */}
      <path
        d="M520 400 C560 400 580 400 600 400 C620 400 640 400 680 400"
        stroke="#0EA5E9"
        strokeWidth="3"
        strokeDasharray="10 8"
        opacity="0.5"
      />
      <circle cx="600" cy="400" r="34" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="3" />
      <path d="M588 400 H612 M600 388 V412" stroke="#0284C7" strokeWidth="3" strokeLinecap="round" />

      {/* Éléments flottants décoratifs */}
      <circle cx="180" cy="120" r="48" fill="#BAE6FD" opacity="0.45" />
      <circle cx="1020" cy="680" r="64" fill="#C7D2FE" opacity="0.4" />
      <circle cx="1040" cy="110" r="36" fill="#7DD3FC" opacity="0.3" />
      <path
        d="M120 680 C200 620 260 650 340 590 C420 530 500 560 580 500"
        stroke="#38BDF8"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.35"
      />
    </svg>
  );
}
