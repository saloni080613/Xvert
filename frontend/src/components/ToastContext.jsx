import { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

const ToastContext = createContext()

const TOAST_ICONS = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
}

const TOAST_COLORS = {
    success: { bg: 'rgba(0, 230, 118, 0.15)', border: 'rgba(0, 230, 118, 0.3)', icon: '#00e676' },
    error: { bg: 'rgba(255, 82, 82, 0.15)', border: 'rgba(255, 82, 82, 0.3)', icon: '#ff5252' },
    info: { bg: 'var(--ag-card-bg)', border: 'var(--ag-card-border)', icon: 'var(--ag-accent)' },
}

let toastId = 0

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])

    const addToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = ++toastId
        setToasts(prev => [...prev, { id, message, type }])
        if (duration > 0) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id))
            }, duration)
        }
    }, [])

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}

            {/* Toast Container */}
            <div style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                zIndex: 99999,
                display: 'flex',
                flexDirection: 'column-reverse',
                gap: '0.75rem',
                pointerEvents: 'none',
            }}>
                <AnimatePresence>
                    {toasts.map(toast => {
                        const Icon = TOAST_ICONS[toast.type] || Info
                        const colors = TOAST_COLORS[toast.type] || TOAST_COLORS.info
                        return (
                            <motion.div
                                key={toast.id}
                                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 100, scale: 0.9 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                style={{
                                    pointerEvents: 'auto',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.85rem 1.2rem',
                                    borderRadius: '14px',
                                    background: colors.bg,
                                    backdropFilter: 'blur(20px)',
                                    WebkitBackdropFilter: 'blur(20px)',
                                    border: `1px solid ${colors.border}`,
                                    boxShadow: '0 8px 30px var(--ag-glass-shadow)',
                                    color: 'var(--ag-text)',
                                    fontSize: '0.9rem',
                                    fontWeight: 500,
                                    fontFamily: '"Nunito", sans-serif',
                                    minWidth: '280px',
                                    maxWidth: '400px',
                                }}
                            >
                                <Icon size={20} color={colors.icon} style={{ flexShrink: 0 }} />
                                <span style={{ flex: 1 }}>{toast.message}</span>
                                <button
                                    onClick={() => removeToast(toast.id)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'var(--ag-text-secondary)',
                                        padding: '2px',
                                        display: 'flex',
                                        flexShrink: 0,
                                    }}
                                >
                                    <X size={16} />
                                </button>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    )
}

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) throw new Error('useToast must be used within a ToastProvider')
    return context
}
