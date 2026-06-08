'use client'

import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-950 disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'bg-green-500 text-gray-950 hover:bg-green-400 focus:ring-green-500': variant === 'primary',
            'bg-gray-800 text-gray-200 border border-gray-700 hover:bg-gray-700 focus:ring-gray-500': variant === 'secondary',
            'text-gray-400 hover:text-gray-200 hover:bg-gray-800 focus:ring-gray-500': variant === 'ghost',
            'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 focus:ring-red-500': variant === 'danger',
          },
          {
            'text-xs px-3 py-1.5 gap-1.5': size === 'sm',
            'text-sm px-4 py-2 gap-2': size === 'md',
            'text-base px-6 py-3 gap-2': size === 'lg',
          },
          className
        )}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'
export { Button }
