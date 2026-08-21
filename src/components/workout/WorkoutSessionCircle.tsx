import { Dumbbell } from 'lucide-react'

// Extraído de WorkoutExecutionView.tsx — el círculo de progreso (SVG stroke
// animado) con la miniatura del ejercicio (o el ícono default) en el medio,
// y el overlay "REST" cuando corresponde. Puramente presentacional.
interface WorkoutSessionCircleProps {
  circleSize: number
  radius: number
  strokeWidth: number
  circumference: number
  dashOffset: number
  strokeColor: string
  innerInset: string
  mediaUrl?: string
  alt: string
  showRest: boolean
}

export function WorkoutSessionCircle({
  circleSize,
  radius,
  strokeWidth,
  circumference,
  dashOffset,
  strokeColor,
  innerInset,
  mediaUrl,
  alt,
  showRest,
}: WorkoutSessionCircleProps) {
  return (
    <div className="grid h-full w-full min-h-0 min-w-0 place-items-center overflow-hidden [container-type:size]">
      <div
        className="relative [container-type:inline-size]"
        style={{ width: 'min(100cqw, 100cqh)', aspectRatio: '1 / 1' }}
      >
        <div className="pointer-events-none absolute inset-0 rounded-full blur-3xl" style={{ backgroundColor: `${strokeColor}22` }} />
        <svg
          viewBox={`0 0 ${circleSize} ${circleSize}`}
          className="h-full w-full"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
          aria-hidden
        >
          <circle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={radius}
            fill="transparent"
            stroke="rgba(255,255,255,0.10)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={radius}
            fill="transparent"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-[stroke-dashoffset] duration-1000 ease-linear"
          />
        </svg>

        <div
          className="absolute overflow-hidden rounded-full border border-white/10 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
          style={{ inset: innerInset }}
        >
          {mediaUrl ? (
            <div className="flex h-full w-full items-center justify-center">
              <img
                src={mediaUrl}
                alt={alt}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-white">
              <Dumbbell className="h-[28%] w-[28%] max-h-20 max-w-20 text-slate-300" />
            </div>
          )}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.22),transparent_52%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(15,23,42,0.08))]" />
          {showRest ? (
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.28),rgba(251,191,36,0.42)_58%,rgba(180,83,9,0.56))] px-[6%]">
              <div className="animate-pulse text-center text-[clamp(1rem,15cqw,3.25rem)] font-black uppercase leading-none tracking-[0.12em] text-amber-600 drop-shadow-[0_2px_12px_rgba(251,191,36,0.35)]">
                REST
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
