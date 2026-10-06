import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { gsap, prefersReducedMotion } from '@/animations/gsap'
import '@/components/common/Toast.css'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const toastRefs = useRef(new Map())

  const removeToast = useCallback((id) => {
    const el = toastRefs.current.get(id)
    if (el && !prefersReducedMotion()) {
      gsap.to(el, {
        opacity: 0,
        y: 12,
        scale: 0.96,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: () => {
          toastRefs.current.delete(id)
          setToasts((prev) => prev.filter((t) => t.id !== id))
        },
      })
    } else {
      toastRefs.current.delete(id)
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }
  }, [])

  const addToast = useCallback(
    ({ type = 'info', title = null, message = '', duration = 4000 }) => {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
      setToasts((prev) => [...prev, { id, type, title, message }])

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id)
        }, duration)
      }
      return id
    },
    [removeToast]
  )

  const toast = {
    success: (message, title = 'Success') => addToast({ type: 'success', title, message }),
    error: (message, title = 'Error') => addToast({ type: 'error', title, message }),
    info: (message, title = 'Notification') => addToast({ type: 'info', title, message }),
    remove: removeToast,
  }

  const setItemRef = (id, el) => {
    if (el && !toastRefs.current.has(id)) {
      toastRefs.current.set(id, el)
      if (!prefersReducedMotion()) {
        gsap.fromTo(
          el,
          { opacity: 0, y: 16, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.28, ease: 'power2.out' }
        )
      }
    }
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toast-container" aria-live="polite" role="region">
        {toasts.map((t) => (
          <div
            key={t.id}
            ref={(el) => setItemRef(t.id, el)}
            className={`toast-item ${t.type}`}
            role="status"
          >
            <div className="toast-icon-wrap">
              {t.type === 'success' && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {t.type === 'error' && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              )}
              {t.type === 'info' && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              )}
            </div>
            <div className="toast-content">
              {t.title && <span className="toast-title">{t.title}</span>}
              <span className="toast-message">{t.message}</span>
            </div>
            <button
              type="button"
              className="toast-close-btn"
              onClick={() => removeToast(t.id)}
              title="Dismiss"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    return {
      toast: {
        success: (m) => console.log('Toast success:', m),
        error: (m) => console.error('Toast error:', m),
        info: (m) => console.log('Toast info:', m),
      },
    }
  }
  return ctx
}
