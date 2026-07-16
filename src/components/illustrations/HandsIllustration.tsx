// Dos manos uniéndose, forma plana propia en los colores de marca. Solo decorativa.
export function HandsIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 90" className={className} aria-hidden>
      <circle cx="60" cy="45" r="42" fill="var(--color-brand-100)" />
      <path
        d="M30 58 L30 38 C30 33 34 30 38 30 C42 30 45 33 45 38 L45 24 C45 19 49 16 53 16 C57 16 60 19 60 24 L60 20 C60 15 64 12 68 12 C72 12 75 15 75 20 L75 55"
        fill="none"
        stroke="var(--color-navy-700)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M90 58 L90 38 C90 33 86 30 82 30 C78 30 75 33 75 38"
        fill="none"
        stroke="var(--color-brand-600)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M30 58 C30 68 40 74 52 74 L68 74 C80 74 90 68 90 58 L90 50 C90 46 87 43 83 43 C79 43 76 46 76 50"
        fill="var(--color-gold-400)"
        stroke="var(--color-gold-400)"
        strokeWidth="4"
        strokeLinejoin="round"
      />
    </svg>
  );
}
