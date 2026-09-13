'use client'

import { MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WhatsAppButtonProps {
  message: string
  phone?: string | null
  className?: string
  size?: 'sm' | 'xs'
}

export function WhatsAppButton({ message, phone, className, size = 'xs' }: WhatsAppButtonProps) {
  const encoded = encodeURIComponent(message)
  const digits = phone?.replace(/\D/g, '') ?? ''
  const number = digits.length === 10 ? `91${digits}` : digits
  const url = number
    ? `https://wa.me/${number}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center rounded-lg border font-semibold transition-all',
        'border-[#25D366]/40 bg-[#25D366]/10 text-[#128C44] hover:bg-[#25D366]/20',
        size === 'sm' ? 'gap-2 px-3.5 py-2 text-sm' : 'gap-1.5 px-3 py-1.5 text-xs',
        className
      )}
    >
      <MessageCircle className="w-3.5 h-3.5" />
      Send on WhatsApp
    </a>
  )
}
