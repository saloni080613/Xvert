import { motion, AnimatePresence } from 'framer-motion'
import { Settings, X } from 'lucide-react'
import DarkModeToggle from './DarkModeToggle'

export default function SettingsPanel({ isOpen, onToggle }) {
    return (
        <>
            {/* Gear Icon Button */}
            <motion.button
                onClick={onToggle}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                style={{
                    background: 'var(--ag-glass-bg)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid var(--ag-glass-border)',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--ag-text)',
                    padding: 0,
                }}
                className="ag-icon"
            >
                <Settings size={20} />
            </motion.button>

            {/* Panel */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onToggle}
                            style={{
                                position: 'fixed',
                                inset: 0,
                                zIndex: 999,
                                background: 'rgba(0,0,0,0.2)',
                            }}
                        />

                        {/* Settings Panel */}
                        <motion.div
                            initial={{ opacity: 0, x: 300, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 300, scale: 0.95 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                            style={{
                                position: 'fixed',
                                top: '80px',
                                right: '20px',
                                width: '300px',
                                zIndex: 1000,
                                background: 'var(--ag-glass-bg)',
                                backdropFilter: 'blur(30px)',
                                WebkitBackdropFilter: 'blur(30px)',
                                border: '1px solid var(--ag-glass-border)',
                                borderRadius: '20px',
                                padding: '1.5rem',
                                boxShadow: '0 20px 60px var(--ag-glass-shadow)',
                            }}
                        >
                            {/* Header */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '1.5rem',
                            }}>
                                <h3 style={{
                                    fontFamily: '"Outfit", sans-serif',
                                    fontSize: '1.1rem',
                                    fontWeight: 600,
                                    color: 'var(--ag-text)',
                                    margin: 0,
                                }}>
                                    Settings
                                </h3>
                                <motion.button
                                    onClick={onToggle}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'var(--ag-text-secondary)',
                                        padding: '4px',
                                        display: 'flex',
                                    }}
                                >
                                    <X size={18} />
                                </motion.button>
                            </div>

                            {/* Theme Section */}
                            <div style={{
                                background: 'var(--ag-card-bg)',
                                backdropFilter: 'blur(8px)',
                                borderRadius: '12px',
                                padding: '1rem',
                                border: '1px solid var(--ag-card-border)',
                            }}>
                                <div style={{
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    color: 'var(--ag-text-secondary)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    marginBottom: '0.75rem',
                                }}>
                                    Appearance
                                </div>
                                <DarkModeToggle />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}
