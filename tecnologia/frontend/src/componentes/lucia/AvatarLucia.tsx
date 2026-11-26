import lucia from '../../assets/lucia.webp';

/** Lucía, la asistente virtual de la MPH Huamanga: ilustración propia con auriculares y chaleco municipal. */
export function AvatarLucia({ className = 'h-14 w-14', saludando = false }: { className?: string; saludando?: boolean }) {
  return (
    <img
      src={lucia}
      alt="Lucía, asistente virtual"
      width={256}
      height={256}
      draggable={false}
      className={`shrink-0 select-none rounded-full object-cover ${saludando ? 'lucia-saludo-img' : ''} ${className}`}
    />
  );
}
