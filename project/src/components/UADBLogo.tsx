export function UADBLogo({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <img
      src="/cropped-logo-uadb.webp"
      alt="Université Alioune Diop de Bambey"
      width={size}
      height={size}
      className={`object-contain ${className}`}
    />
  );
}
