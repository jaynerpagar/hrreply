import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'green' | 'blue' | 'orange' | 'red' | 'yellow' | 'muted'
  className?: string
}

export function Badge({ children, variant = 'muted', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-mono text-[10px] px-2 py-0.5 rounded border tracking-wide',
        {
          'bg-green-500/10 text-green-400 border-green-500/25': variant === 'green',
          'bg-blue-500/10 text-blue-400 border-blue-500/25': variant === 'blue',
          'bg-orange-500/10 text-orange-400 border-orange-500/25': variant === 'orange',
          'bg-red-500/10 text-red-400 border-red-500/25': variant === 'red',
          'bg-yellow-500/10 text-yellow-400 border-yellow-500/25': variant === 'yellow',
          'bg-gray-800 text-gray-500 border-gray-700': variant === 'muted',
        },
        className
      )}
    >
      {children}
    </span>
  )
}
