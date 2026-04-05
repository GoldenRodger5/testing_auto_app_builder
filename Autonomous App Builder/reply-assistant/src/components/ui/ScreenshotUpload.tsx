import { useRef, useState, useCallback } from 'react'
import { ImagePlus, X, AlertCircle, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ScreenshotSet {
  main: string | null        // base64, no prefix
  context: string[]          // base64, no prefix, up to 3
  mimeType: string
}

interface ScreenshotUploadProps {
  onChange: (screenshots: ScreenshotSet) => void
  maxContext?: number        // default 3
  isPremium?: boolean        // if false, show lock + call onPaywall
  onPaywall?: () => void
  className?: string
}

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

function stripPrefix(base64: string): string {
  return base64.replace(/^data:[^;]+;base64,/, '')
}

function detectMime(file: File): string {
  if (file.type && ACCEPTED.includes(file.type)) return file.type
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
  if (ext === 'png') return 'image/png'
  if (ext === 'webp') return 'image/webp'
  if (ext === 'heic' || ext === 'heif') return 'image/jpeg' // Claude treats HEIC as JPEG
  return 'image/jpeg'
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(stripPrefix(reader.result as string))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

interface PreviewImage {
  dataUrl: string   // full data URL for <img> preview
  base64: string    // stripped base64 for API
  mimeType: string
  name: string
}

export function ScreenshotUpload({
  onChange,
  maxContext = 3,
  isPremium = true,
  onPaywall,
  className,
}: ScreenshotUploadProps) {
  const [main, setMain] = useState<PreviewImage | null>(null)
  const [context, setContext] = useState<PreviewImage[]>([])
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const mainInputRef = useRef<HTMLInputElement>(null)
  const contextInputRef = useRef<HTMLInputElement>(null)

  const notify = useCallback((newMain: PreviewImage | null, newContext: PreviewImage[]) => {
    onChange({
      main: newMain?.base64 ?? null,
      context: newContext.map(c => c.base64),
      mimeType: newMain?.mimeType ?? newContext[0]?.mimeType ?? 'image/jpeg',
    })
  }, [onChange])

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED.includes(file.type) && !['heic', 'heif'].includes(file.name.split('.').pop()?.toLowerCase() || '')) {
      return 'Unsupported file type. Use JPEG, PNG, WEBP, or HEIC.'
    }
    if (file.size > MAX_SIZE) {
      return `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max is 10 MB.`
    }
    return null
  }

  const processMainFile = async (file: File) => {
    const err = validateFile(file)
    if (err) { setError(err); return }
    setError(null)
    setLoading(true)
    try {
      const base64 = await fileToBase64(file)
      const mimeType = detectMime(file)
      const preview: PreviewImage = { dataUrl: `data:${mimeType};base64,${base64}`, base64, mimeType, name: file.name }
      setMain(preview)
      notify(preview, context)
    } catch {
      setError('Failed to read file. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const processContextFile = async (file: File) => {
    if (context.length >= maxContext) {
      setError(`You can only add up to ${maxContext} context screenshots.`)
      return
    }
    const err = validateFile(file)
    if (err) { setError(err); return }
    setError(null)
    setLoading(true)
    try {
      const base64 = await fileToBase64(file)
      const mimeType = detectMime(file)
      const preview: PreviewImage = { dataUrl: `data:${mimeType};base64,${base64}`, base64, mimeType, name: file.name }
      const newContext = [...context, preview]
      setContext(newContext)
      notify(main, newContext)
    } catch {
      setError('Failed to read file. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const removeMain = () => {
    setMain(null)
    notify(null, context)
    if (mainInputRef.current) mainInputRef.current.value = ''
  }

  const removeContext = (index: number) => {
    const newContext = context.filter((_, i) => i !== index)
    setContext(newContext)
    notify(main, newContext)
  }

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (!isPremium) { onPaywall?.(); return }
    const file = e.dataTransfer.files[0]
    if (file) await processMainFile(file)
  }, [isPremium, onPaywall, context])

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true) }
  const handleDragLeave = () => setDragging(false)

  const handleZoneClick = () => {
    if (!isPremium) { onPaywall?.(); return }
    mainInputRef.current?.click()
  }

  if (!isPremium) {
    return (
      <div
        className={cn(
          'relative rounded-xl border-2 border-dashed border-border p-8 text-center cursor-pointer transition-colors hover:border-border-focus',
          className
        )}
        onClick={() => onPaywall?.()}
      >
        <div className="flex flex-col items-center gap-2 opacity-50 pointer-events-none">
          <ImagePlus className="w-8 h-8 text-text-muted" />
          <p className="text-sm font-medium text-text-secondary">Upload a screenshot</p>
          <p className="text-xs text-text-muted">Drag and drop or tap to select</p>
        </div>
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-bg-primary/60 backdrop-blur-[2px]">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-elevated border border-border">
            <Lock className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs font-semibold text-accent">Premium</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Main drop zone */}
      {!main ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleZoneClick}
          className={cn(
            'rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all select-none',
            dragging
              ? 'border-accent bg-accent-soft scale-[1.01]'
              : 'border-border hover:border-accent/50 hover:bg-bg-hover',
            loading && 'pointer-events-none opacity-60'
          )}
        >
          <input
            ref={mainInputRef}
            type="file"
            accept={ACCEPTED.join(',')}
            className="hidden"
            onChange={async e => {
              const f = e.target.files?.[0]
              if (f) await processMainFile(f)
            }}
          />
          <div className="flex flex-col items-center gap-2">
            {loading ? (
              <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-accent-soft flex items-center justify-center">
                <ImagePlus className="w-6 h-6 text-accent" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-text-primary">
                {loading ? 'Processing...' : 'Drop a screenshot or tap to upload'}
              </p>
              <p className="text-xs text-text-muted mt-0.5">JPEG, PNG, WEBP, HEIC · Max 10 MB</p>
            </div>
          </div>
        </div>
      ) : (
        /* Main image preview */
        <div className="relative rounded-xl overflow-hidden border border-border bg-bg-card">
          <img
            src={main.dataUrl}
            alt="Screenshot preview"
            className="w-full max-h-48 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/80 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between">
            <span className="text-xs text-text-secondary truncate max-w-[200px]">{main.name}</span>
            <button
              onClick={removeMain}
              className="w-7 h-7 rounded-full bg-bg-elevated flex items-center justify-center hover:bg-bg-hover transition-colors"
            >
              <X className="w-3.5 h-3.5 text-text-primary" />
            </button>
          </div>
        </div>
      )}

      {/* Context screenshots */}
      {main && context.length < maxContext && (
        <button
          onClick={() => contextInputRef.current?.click()}
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-border text-sm text-text-muted hover:border-border-focus hover:text-text-secondary transition-colors cursor-pointer"
        >
          <input
            ref={contextInputRef}
            type="file"
            accept={ACCEPTED.join(',')}
            className="hidden"
            onChange={async e => {
              const f = e.target.files?.[0]
              if (f) await processContextFile(f)
              if (contextInputRef.current) contextInputRef.current.value = ''
            }}
          />
          <ImagePlus className="w-4 h-4" />
          Add context screenshot ({context.length}/{maxContext})
        </button>
      )}

      {/* Context previews */}
      {context.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {context.map((img, i) => (
            <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border group">
              <img src={img.dataUrl} alt={`Context ${i + 1}`} className="w-full h-full object-cover" />
              <button
                onClick={() => removeContext(i)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-bg-primary/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3 text-text-primary" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-error">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}
