import { cn } from '@/lib/utils'

type BadgeVariant = 'placed' | 'process' | 'dropped' | 'newLead' | 'default'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const DOT_COLORS: Record<BadgeVariant, string> = {
  placed: 'bg-status-placed',
  process: 'bg-status-process',
  dropped: 'bg-status-dropped',
  newLead: 'bg-status-newLead',
  default: 'bg-ink-muted',
}

const PILL_STYLES: Record<BadgeVariant, string> = {
  placed: 'bg-status-placedBg text-status-placedText',
  process: 'bg-status-processBg text-status-processText',
  dropped: 'bg-status-droppedBg text-status-droppedText',
  newLead: 'bg-status-newLeadBg text-status-newLeadText',
  default: 'bg-surface-sunken text-ink-secondary',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        PILL_STYLES[variant],
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', DOT_COLORS[variant])} />
      {children}
    </span>
  )
}

export function InfoChip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-primary-soft text-primary-deep', className)}>
      {children}
    </span>
  )
}
