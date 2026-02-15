import { motion } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from './ThemeContext'

export default function DarkModeToggle() {
    const { theme, toggleTheme } = useTheme()
    const isDark = theme === 'dark'

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
        }}>
            <Sun
                size={18}
                style={{
                    color: isDark ? 'var(--ag-text-secondary)' : 'var(--ag-accent)',
                    transition: 'color 0.3s',
                    filter: isDark ? 'none' : 'drop-shadow(0 0 4px var(--ag-icon-glow))',
                }}
            />

            {/* Toggle track */}
            <div
                onClick={toggleTheme}
                style={{
                    width: '52px',
                    height: '28px',
                    borderRadius: '14px',
                    background: isDark
                        ? 'linear-gradient(135deg, #1a1a3e, #2d1b69)'
                        : 'linear-gradient(135deg, #ffd54f, #ffb300)',
                    cursor: 'pointer',
                    position: 'relative',
                    border: '1px solid',
                    borderColor: isDark ? 'rgba(179,136,255,0.3)' : 'rgba(255,179,0,0.4)',
                    boxShadow: isDark
                        ? '0 0 15px rgba(179,136,255,0.2), inset 0 0 10px rgba(0,0,0,0.3)'
                        : '0 0 15px rgba(255,179,0,0.2), inset 0 0 10px rgba(255,255,255,0.3)',
                    transition: 'background 0.3s, border-color 0.3s, box-shadow 0.3s',
                }}
            >
                {/* Thumb */}
                <motion.div
                    layout
                    style={{
                        position: 'absolute',
                        top: '2px',
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: isDark
                            ? 'linear-gradient(135deg, #b388ff, #7c4dff)'
                            : 'linear-gradient(135deg, #fff, #ffecd2)',
                        boxShadow: isDark
                            ? '0 0 10px rgba(179,136,255,0.5)'
                            : '0 0 10px rgba(255,179,0,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    animate={{
                        left: isDark ? '26px' : '2px',
                        rotate: isDark ? 360 : 0,
                    }}
                    transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 30,
                    }}
                >
                    {/* Star dots in dark mode thumb */}
                    {isDark && (
                        <>
                            <div style={{
                                position: 'absolute',
                                width: '3px',
                                height: '3px',
                                borderRadius: '50%',
                                background: '#fff',
                                top: '5px',
                                left: '5px',
                                opacity: 0.8,
                            }} />
                            <div style={{
                                position: 'absolute',
                                width: '2px',
                                height: '2px',
                                borderRadius: '50%',
                                background: '#fff',
                                bottom: '6px',
                                right: '4px',
                                opacity: 0.6,
                            }} />
                        </>
                    )}
                </motion.div>
            </div>

            <Moon
                size={18}
                style={{
                    color: isDark ? 'var(--ag-accent)' : 'var(--ag-text-secondary)',
                    transition: 'color 0.3s',
                    filter: isDark ? 'drop-shadow(0 0 4px var(--ag-icon-glow))' : 'none',
                }}
            />
        </div>
    )
}
