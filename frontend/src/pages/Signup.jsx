import { useState } from 'react'
import { motion } from 'framer-motion'
import authService from '../services/AuthService'
import { Link, useNavigate } from 'react-router-dom'
import AntiGravityBackground from '../components/AntiGravityBackground'
import { useToast } from '../components/ToastContext'
import { Eye, EyeOff } from 'lucide-react'

const springBounce = { type: 'spring', stiffness: 400, damping: 20 }

const inputStyle = {
    width: '100%',
    padding: '0.9rem 1rem',
    borderRadius: '12px',
    border: '1px solid var(--ag-glass-border)',
    backgroundColor: 'var(--ag-input-bg)',
    color: 'var(--ag-text)',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box',
    backdropFilter: 'blur(8px)',
    fontFamily: '"Nunito", sans-serif',
    transition: 'border-color 0.3s, box-shadow 0.3s',
}

function GlassInput({ type = 'text', value, onChange, placeholder, required = true, children }) {
    return (
        <div style={{ position: 'relative' }}>
            <input
                type={type}
                value={value}
                onChange={onChange}
                required={required}
                placeholder={placeholder}
                style={children ? { ...inputStyle, paddingRight: '3rem' } : inputStyle}
                onFocus={(e) => {
                    e.target.style.borderColor = 'var(--ag-accent)'
                    e.target.style.boxShadow = '0 0 15px var(--ag-accent-glow)'
                }}
                onBlur={(e) => {
                    e.target.style.borderColor = 'var(--ag-glass-border)'
                    e.target.style.boxShadow = 'none'
                }}
            />
            {children}
        </div>
    )
}

export default function Signup() {
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const { addToast } = useToast()

    const handleSignup = async (e) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            addToast('Passwords do not match', 'error')
            return
        }

        setLoading(true)

        const { error } = await authService.signup(email, password, fullName)

        if (error) {
            addToast(error.message, 'error')
        } else {
            addToast('Registration successful! Check your email.', 'success', 6000)
        }
        setLoading(false)
    }

    const eyeToggleStyle = {
        position: 'absolute',
        right: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: 'var(--ag-text-secondary)',
        display: 'flex',
        padding: '4px',
    }

    return (
        <AntiGravityBackground>
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '2rem',
            }}>
                <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="glass-panel"
                    style={{
                        width: '100%',
                        maxWidth: '860px',
                        display: 'flex',
                        overflow: 'hidden',
                        padding: 0,
                    }}
                >
                    {/* Left Panel — Illustration + Tagline */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 25 }}
                        style={{
                            flex: '0 0 42%',
                            background: 'linear-gradient(135deg, #7c3aed 0%, var(--ag-accent) 50%, #06b6d4 100%)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '2.5rem 2rem',
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Subtle pattern overlay */}
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.12) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 50%)',
                        }} />

                        <motion.img
                            src="/illustrations/login.png"
                            alt="Space astronaut"
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                            style={{
                                width: '180px',
                                height: 'auto',
                                marginBottom: '1.5rem',
                                filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.3))',
                                mixBlendMode: 'screen',
                                position: 'relative',
                                zIndex: 1,
                            }}
                        />

                        <h3 style={{
                            fontFamily: '"Outfit", sans-serif',
                            color: '#fff',
                            fontSize: '1.3rem',
                            fontWeight: 700,
                            marginBottom: '0.5rem',
                            textAlign: 'center',
                            position: 'relative',
                            zIndex: 1,
                        }}>
                            Join the Anti-Gravity Experience
                        </h3>
                        <p style={{
                            color: 'rgba(255,255,255,0.8)',
                            fontSize: '0.85rem',
                            textAlign: 'center',
                            lineHeight: 1.6,
                            maxWidth: '250px',
                            position: 'relative',
                            zIndex: 1,
                        }}>
                            Free, fast file conversion — no limits, no watermarks.
                        </p>

                        {/* Checkmarks */}
                        <div style={{
                            display: 'flex', flexDirection: 'column', gap: '0.5rem',
                            marginTop: '1.2rem', position: 'relative', zIndex: 1,
                        }}>
                            {['24+ conversion formats', 'Instant processing', 'Secure & private'].map((item, i) => (
                                <motion.div
                                    key={item}
                                    initial={{ opacity: 0, x: -15 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + i * 0.1 }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                                        color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem',
                                    }}
                                >
                                    <span style={{ color: '#4ade80', fontWeight: 'bold' }}>✓</span> {item}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Right Panel — Form */}
                    <div style={{
                        flex: 1,
                        padding: '2.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                    }}>
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{
                                fontFamily: '"Outfit", sans-serif',
                                fontSize: '1.8rem',
                                fontWeight: 700,
                                color: 'var(--ag-text)',
                                marginBottom: '0.5rem',
                            }}>Create Account</h2>
                            <p style={{
                                color: 'var(--ag-text-secondary)',
                                fontSize: '0.9rem',
                            }}>Get started in seconds</p>
                        </div>

                        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                            <GlassInput
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Full Name"
                            />

                            <GlassInput
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email"
                            />

                            <GlassInput
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                            >
                                <motion.button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    style={eyeToggleStyle}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </motion.button>
                            </GlassInput>

                            <GlassInput
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm Password"
                            >
                                <motion.button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    style={eyeToggleStyle}
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </motion.button>
                            </GlassInput>

                            <motion.button
                                type="submit"
                                disabled={loading}
                                className="ag-btn-primary"
                                whileHover={!loading ? { scale: 1.04 } : {}}
                                whileTap={!loading ? { scale: 0.96 } : {}}
                                transition={springBounce}
                                style={{ width: '100%', marginTop: '0.3rem' }}
                            >
                                {loading ? 'Creating Account...' : 'Sign Up'}
                            </motion.button>
                        </form>

                        <div style={{
                            marginTop: '1rem',
                            fontSize: '0.85rem',
                            color: 'var(--ag-text-secondary)',
                            textAlign: 'center',
                        }}>
                            Already have an account?{' '}
                            <Link to="/login" style={{ color: 'var(--ag-accent)', textDecoration: 'none', fontWeight: 700 }}>Sign In</Link>
                        </div>

                        {/* Divider */}
                        <div style={{
                            display: 'flex', alignItems: 'center', margin: '1.2rem 0',
                            color: 'var(--ag-text-secondary)', fontSize: '0.75rem',
                        }}>
                            <div style={{ flex: 1, height: '1px', background: 'var(--ag-glass-border)' }} />
                            <span style={{ padding: '0 12px', textTransform: 'uppercase', fontWeight: 600 }}>or</span>
                            <div style={{ flex: 1, height: '1px', background: 'var(--ag-glass-border)' }} />
                        </div>

                        {/* Social */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
                            <motion.button
                                whileHover={{ scale: 1.1, boxShadow: '0 0 20px var(--ag-accent-glow)' }}
                                whileTap={{ scale: 0.9 }}
                                transition={springBounce}
                                onClick={async () => {
                                    const { error } = await authService.loginWithGoogle()
                                    if (error) addToast(error.message, 'error')
                                }}
                                style={{
                                    width: '48px', height: '48px', borderRadius: '50%',
                                    background: 'var(--ag-card-bg)', backdropFilter: 'blur(8px)',
                                    border: '1px solid var(--ag-card-border)', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                                }}
                            >
                                <svg width="22" height="22" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.1, boxShadow: '0 0 20px var(--ag-accent-glow)' }}
                                whileTap={{ scale: 0.9 }}
                                transition={springBounce}
                                style={{
                                    width: '48px', height: '48px', borderRadius: '50%',
                                    background: 'var(--ag-card-bg)', backdropFilter: 'blur(8px)',
                                    border: '1px solid var(--ag-card-border)', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                                }}
                            >
                                <svg width="22" height="22" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.791-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2" />
                                </svg>
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AntiGravityBackground>
    )
}
