'use client'

import { createContext, useCallback, useContext, useState, useEffect } from 'react'

type ToastVariant = 'info' | 'success' | 'warn' | 'error'

interface Toast {
  id:      string
  message: string
  variant: ToastVariant
}

interface ToastCtx {
  notify: (message: string, variant?: ToastVariant) => void
}

const ToastContext = createContext<ToastCtx | null>(null)

/** Hook à utiliser dans n'importe quelle page de l'app. */
export function useToast(): ToastCtx {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    // Fallback gracieux si jamais utilisé hors provider — évite de crasher en dev
    return {
      notify: (m: string) => {
        if (typeof window !== 'undefined') console.warn('[Toast hors provider]', m)
      },
    }
  }
  return ctx
}

const VARIANT_ICONS: Record<ToastVariant, string> = {
  info:    'ℹ',
  success: '✓',
  warn:    '⚠',
  error:   '✕',
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const notify = useCallback<ToastCtx['notify']>(
    (message, variant = 'info') => {
      const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      setToasts((prev) => [...prev, { id, message, variant }])
      // Auto-dismiss après 4s (3-5s par convention)
      setTimeout(() => remove(id), 4000)
    },
    [remove]
  )

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      {/* Région aria-live pour les lecteurs d'écran — annonce les toasts sans voler le focus */}
      <div
        className="toast-region"
        role="status"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const [enter, setEnter] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setEnter(true), 10)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className={`toast toast-${toast.variant} ${enter ? 'enter' : ''}`}>
      <span className="toast-ico" aria-hidden="true">{VARIANT_ICONS[toast.variant]}</span>
      <span className="toast-msg">{toast.message}</span>
      <button
        type="button"
        className="toast-close"
        onClick={onClose}
        aria-label="Fermer la notification"
      >
        ×
      </button>
    </div>
  )
}
