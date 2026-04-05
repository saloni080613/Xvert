import { Sun, Moon, Palette } from 'lucide-react'
import { useTheme } from './ThemeContext'

export default function DarkModeToggle() {
    const { theme, setTheme } = useTheme()
    
    // Warm Sand theme addition
    const isLight = theme === 'light'
    const isDark = theme === 'dark'
    const isWarm = theme === 'warm-sand'

    const handleKeyboard = (e, newTheme) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setTheme(newTheme)
        }
    }

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--ag-input-bg)',
            padding: '4px',
            borderRadius: '24px',
            border: '1px solid var(--ag-glass-border)',
            position: 'relative',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
        }}>
            {/* Sliding Highlight Background */}
            <div
                style={{
                    position: 'absolute',
                    top: '4px',
                    left: '4px',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    zIndex: 0,
                    transform: `translateX(${isLight ? 0 : isDark ? 32 : 64}px)`,
                    background: isLight 
                        ? 'linear-gradient(135deg, #ffd54f, #ffb300)'
                        : isDark
                        ? 'linear-gradient(135deg, #b388ff, #7c4dff)'
                        : 'linear-gradient(135deg, #e4ddd2, #d8a080)',
                    transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), background 0.4s ease'
                }}
            />

            {/* Light Mode Button */}
            <div
                role="button"
                tabIndex={0}
                onClick={() => setTheme('light')}
                onKeyDown={(e) => handleKeyboard(e, 'light')}
                title="Light Theme"
                style={{
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                    zIndex: 1,
                    color: isLight ? '#fff' : 'var(--ag-text-secondary)',
                    transition: 'color 0.3s'
                }}
            >
                <Sun size={16} />
            </div>

            {/* Dark Mode Button */}
            <div
                role="button"
                tabIndex={0}
                onClick={() => setTheme('dark')}
                onKeyDown={(e) => handleKeyboard(e, 'dark')}
                title="Dark Theme"
                style={{
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                    zIndex: 1,
                    color: isDark ? '#fff' : 'var(--ag-text-secondary)',
                    transition: 'color 0.3s'
                }}
            >
                <Moon size={16} />
            </div>

            {/* Warm Sand Mode Button */}
            <div
                role="button"
                tabIndex={0}
                onClick={() => setTheme('warm-sand')}
                onKeyDown={(e) => handleKeyboard(e, 'warm-sand')}
                title="Warm Sand Theme"
                style={{
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                    zIndex: 1,
                    transition: 'all 0.3s'
                }}
            >
                <Palette
                    size={16}
                    style={{
                        color: isWarm ? '#fff' : 'var(--ag-text-secondary)',
                        transition: 'color 0.3s'
                    }}
                />
            </div>
        </div>
    )
}
