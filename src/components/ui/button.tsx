'use client'

import { cn } from '@/lib/utils'
import { Sparkles } from 'lucide-react'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ai' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-1.5 font-medium rounded transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'bg-primary text-ink-inverse hover:bg-primary-hover': variant === 'primary',
            'bg-accent text-white hover:bg-accent-hover': variant === 'ai',
            'bg-surface-card border border-surface-borderStrong text-ink hover:bg-surface-sunken': variant === 'secondary',
            'text-primary hover:bg-primary-faint': variant === 'ghost',
            'bg-status-dropped text-white hover:opacity-90': variant === 'danger',
          },
          {
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-4 py-2 text-sm': size === 'md',
            'px-5 py-2.5 text-base': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {variant === 'ai' && <Sparkles className="w-3.5 h-3.5 shrink-0" />}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
export { Button }
