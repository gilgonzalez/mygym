import { cn } from '@/lib/utils'

// Placeholder gris pulsante genérico — para mockups de carga "bespoke"
// (que reproducen colores/gradientes reales del contenido, ver p.ej.
// ProfilePageSkeleton en profile/page.tsx) seguí armando los divs a mano:
// forzarlos por acá los aplanaría a un gris uniforme, perdiendo el diseño
// a propósito. Este primitivo es para los casos simples de "barra gris".
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />
}
