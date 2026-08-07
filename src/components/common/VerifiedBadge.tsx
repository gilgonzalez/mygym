import { cn } from '@/lib/utils'

interface VerifiedBadgeProps {
  className?: string
  size?: 'sm' | 'md'
}

export function VerifiedBadge({ className, size = 'sm' }: VerifiedBadgeProps) {
  const sizeClass = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={cn(sizeClass, 'text-sky-500 shrink-0', className)}
    >
      <path
        d="M8 0l2.04 2.604 3.308.168 1.702 2.907-.014 3.363L13.1 11.249l-2.951 1.574L8 16l-2.149-3.177-2.95-1.574L.964 8.975.978 5.612 2.68 2.705l3.308-.168L8 0zm1.124 5.59L7.165 8.909l-1.377-1.407a.5.5 0 00-.707 0l-.587.6a.5.5 0 000 .707l2.25 2.3a.5.5 0 00.707 0l3.54-3.62a.5.5 0 000-.706l-.586-.6a.5.5 0 00-.707 0l-.377.386z"
        fill="currentColor"
      />
    </svg>
  )
}
