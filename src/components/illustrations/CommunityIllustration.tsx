// Ilustración plana propia (sin fotos ni assets de terceros): tres personas y
// burbujas de conversación, en los colores de marca. Solo decorativa.
export function CommunityIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 120" className={className} aria-hidden>
      <circle cx="40" cy="96" r="34" fill="var(--color-brand-50)" />
      <circle cx="120" cy="92" r="26" fill="var(--color-gold-100)" />

      {/* burbujas de conversación */}
      <rect x="14" y="10" width="40" height="26" rx="10" fill="var(--color-navy-100)" />
      <path d="M22 36 L22 46 L34 36 Z" fill="var(--color-navy-100)" />
      <rect x="96" y="4" width="46" height="28" rx="10" fill="var(--color-brand-100)" />
      <path d="M106 32 L106 42 L120 32 Z" fill="var(--color-brand-100)" />

      {/* personas: cabeza + cuerpo simplificado */}
      <g>
        <circle cx="46" cy="70" r="14" fill="var(--color-navy-700)" />
        <path d="M20 116 C20 96 32 84 46 84 C60 84 72 96 72 116 Z" fill="var(--color-navy-700)" />
      </g>
      <g>
        <circle cx="92" cy="64" r="16" fill="var(--color-brand-500)" />
        <path d="M60 118 C60 94 74 80 92 80 C110 80 124 94 124 118 Z" fill="var(--color-brand-500)" />
      </g>
      <g>
        <circle cx="128" cy="74" r="12" fill="var(--color-gold-400)" />
        <path d="M106 118 C106 100 116 90 128 90 C140 90 150 100 150 118 Z" fill="var(--color-gold-400)" />
      </g>
    </svg>
  );
}
