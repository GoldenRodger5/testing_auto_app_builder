import { forwardRef, type TextareaHTMLAttributes, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  charCount?: { current: number; max: number }
  autoResize?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, charCount, autoResize = false, className, id, onChange, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    const internalRef = useRef<HTMLTextAreaElement | null>(null)

    const setRef = (el: HTMLTextAreaElement | null) => {
      internalRef.current = el
      if (typeof ref === 'function') ref(el)
      else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = el
    }

    useEffect(() => {
      if (autoResize && internalRef.current) {
        internalRef.current.style.height = 'auto'
        internalRef.current.style.height = internalRef.current.scrollHeight + 'px'
      }
    }, [autoResize, props.value])

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (autoResize && internalRef.current) {
        internalRef.current.style.height = 'auto'
        internalRef.current.style.height = internalRef.current.scrollHeight + 'px'
      }
      onChange?.(e)
    }

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
        <textarea
          ref={setRef}
          id={inputId}
          onChange={handleChange}
          className={cn(
            'w-full px-4 py-3 rounded-xl bg-bg-card border text-text-primary placeholder:text-text-muted',
            'transition-colors duration-200 outline-none resize-none',
            'focus:border-border-focus focus:ring-1 focus:ring-border-focus/30',
            error ? 'border-error' : 'border-border',
            autoResize ? 'overflow-hidden' : 'min-h-[120px]',
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-error">{error}</p>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
