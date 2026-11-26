/**
 * Lucía: ilustración propia de la asistente, con casco y en su moto, saludando con la mano.
 * SVG en línea (sin imágenes externas) para que cargue al instante y se vea nítida en cualquier tamaño.
 */
export function AvatarLucia({ className = 'h-14 w-14', saludando = false }: { className?: string; saludando?: boolean }) {
  return (
    <svg viewBox="0 0 96 96" className={className} role="img" aria-label="Lucía, asistente virtual">
      <defs>
        <linearGradient id="lucia-cielo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3B6EF0" />
          <stop offset="1" stopColor="#0B2A6F" />
        </linearGradient>
        <clipPath id="lucia-circulo">
          <circle cx="48" cy="48" r="46" />
        </clipPath>
      </defs>
      <circle cx="48" cy="48" r="46" fill="url(#lucia-cielo)" />
      <g clipPath="url(#lucia-circulo)">
        {/* cerros de Huamanga */}
        <path d="M0 70 Q18 56 34 66 T66 62 T96 66 V96 H0Z" fill="#16409F" />
        <path d="M0 78 Q24 70 48 76 T96 74 V96 H0Z" fill="#0B2A6F" />
        {/* moto */}
        <circle cx="30" cy="78" r="9" fill="#0F172A" />
        <circle cx="30" cy="78" r="4" fill="#CBD5E1" />
        <circle cx="70" cy="78" r="9" fill="#0F172A" />
        <circle cx="70" cy="78" r="4" fill="#CBD5E1" />
        <path d="M24 70 Q34 60 50 64 L62 64 Q70 64 74 72 L60 74 Q48 76 36 74Z" fill="#FF7A00" />
        <path d="M62 64 L68 52" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
        <path d="M64 52 L72 50" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
        <circle cx="74" cy="70" r="2.5" fill="#FDE68A" />
        {/* Lucía */}
        <path d="M40 64 Q40 46 50 44 Q60 46 60 64Z" fill="#FFFFFF" />
        <path d="M44 50 L58 50 L57 56 L45 56Z" fill="#E8EFFF" />
        <path d="M58 50 Q64 54 66 54" stroke="#F2C9A0" strokeWidth="4" strokeLinecap="round" fill="none" />
        <g className={saludando ? 'lucia-saludo' : undefined} style={{ transformOrigin: '42px 50px' }}>
          <path d="M42 50 Q34 44 32 34" stroke="#F2C9A0" strokeWidth="4" strokeLinecap="round" fill="none" />
          <circle cx="32" cy="32" r="3.2" fill="#F2C9A0" />
        </g>
        <circle cx="50" cy="34" r="9" fill="#F2C9A0" />
        <path d="M40.5 33 Q41 21 50 21 Q59 21 59.5 33 Q55 28 50 28 Q45 28 40.5 33Z" fill="#FF7A00" />
        <path d="M41 33 Q50 30 59 33" stroke="#CC4E00" strokeWidth="2" fill="none" />
        <path d="M41 33 Q38 42 42 46" stroke="#3F2A1D" strokeWidth="3" strokeLinecap="round" fill="none" />
        <circle cx="46.5" cy="35" r="1.3" fill="#1E293B" />
        <circle cx="53.5" cy="35" r="1.3" fill="#1E293B" />
        <path d="M46.5 39 Q50 41.5 53.5 39" stroke="#B4533A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <circle cx="44.5" cy="38" r="1.4" fill="#FCA5A5" opacity="0.7" />
        <circle cx="55.5" cy="38" r="1.4" fill="#FCA5A5" opacity="0.7" />
      </g>
      <circle cx="48" cy="48" r="46" fill="none" stroke="#FFFFFF" strokeWidth="3" />
    </svg>
  );
}
