import { cn } from '@/lib/utils'

/** The double-tick brand mark (WhatsApp "message read" style). */
export function LogoMark({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="100" height="100" rx="24" fill="#1F2937" />
      <path d="M20 52 L36 70 L64 32" stroke="#A3E635" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M44 66 L48 70 L78 32" stroke="#FFFFFF" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const SIZES = {
  sm: { mark: 24, text: 'text-base' },
  md: { mark: 30, text: 'text-lg' },
  lg: { mark: 44, text: 'text-3xl' },
} as const

/** Full lockup: mark + "HRReply.in" wordmark. Use theme="dark" on dark backgrounds. */
export function Logo({
  size = 'md',
  theme = 'light',
  showDomain = true,
  className,
}: {
  size?: keyof typeof SIZES
  theme?: 'light' | 'dark'
  showDomain?: boolean
  className?: string
}) {
  const s = SIZES[size]
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark size={s.mark} />
      <span className={cn('font-extrabold tracking-tight leading-none', s.text)}>
        <span className={theme === 'dark' ? 'text-white' : 'text-ink'}>HR</span>
        <span className={cn('font-normal', theme === 'dark' ? 'text-gray-300' : 'text-ink-secondary')}>Reply</span>
        {showDomain && (
          <span className={cn('font-semibold', theme === 'dark' ? 'text-accent' : 'text-accent-icon')}>.in</span>
        )}
      </span>
    </div>
  )
}
