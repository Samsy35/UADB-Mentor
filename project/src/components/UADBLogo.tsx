export function UADBLogo({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <img
      src="/logo-uadb.jpg"
      alt="Université Alioune Diop de Bambey"
      width={size}
      height={size}
      className={`object-contain ${className}`}
    />
  );
}
