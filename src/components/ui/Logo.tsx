/** Officielt Simon's Padel Club-logo (transparent PNG). */
export function Logo({ className = 'w-48' }: { className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="Simon's Padel Club Intranet"
      className={`object-contain ${className}`}
    />
  )
}
