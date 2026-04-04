import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  charCount?: { current: number; max: number }
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, charCount, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="space-y-1.5">
        {label && (
          <div className="flex items-center justify-between">
            <label htmlFor={inputId} className="text-sm font-medium text-text-secondary">
              {label}
            </label>
            {charCount && (
              <span className={cn('text-xs', charCount.current > charCount.max ? 'text-error' : 'text-text-muted')}>
                {charCount.current}/{charCount.max}
              </span>
            )}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-4 py-3 rounded-xl bg-bg-card border text-text-primary placeholder:text-text-muted',
            'transition-colors duration-200 outline-none',
            'focus:border-border-focus focus:ring-1 focus:ring-border-focus/30',
            error ? 'border-error' : 'border-border',
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-error">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
