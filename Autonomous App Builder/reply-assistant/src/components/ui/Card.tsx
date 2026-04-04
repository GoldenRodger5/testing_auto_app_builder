import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
}

export function Card({ hoverable = false, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl bg-bg-card border border-border p-4 shadow-subtle',
        hoverable && 'transition-all duration-150 hover:bg-bg-hover hover:border-border-focus/20 cursor-pointer hover:shadow-medium',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
