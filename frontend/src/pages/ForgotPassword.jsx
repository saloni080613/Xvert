import { useState } from 'react'
import { motion } from 'framer-motion'
import authService from '../services/AuthService'
import { Link } from 'react-router-dom'
import AntiGravityBackground from '../components/AntiGravityBackground'
import { useToast } from '../components/ToastContext'
import { KeyRound } from 'lucide-react'

const springBounce = { type: 'spring', stiffness: 400, damping: 20 }

export default function ForgotPassword() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const { addToast } = useToast()

    const handleResetPassword = async (e) => {
        e.preventDefault()
        setLoading(true)

        const { error } = await authService.resetPasswordForEmail(email)

        if (error) {
            addToast(error.message, 'error')
        } else {
            addToast('Check your email for the password reset link.', 'success', 6000)
        }
        setLoading(false)
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
                        maxWidth: '400px',
                        padding: '2.5rem',
                        textAlign: 'center',
                    }}
                >
                    {/* Illustration */}
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
                        style={{
                            width: '140px', height: '140px', margin: '0 auto 1rem',
                            borderRadius: '22px',
                            background: 'linear-gradient(135deg, #1e1040, #2d1b69)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            overflow: 'hidden',
                            boxShadow: '0 8px 25px rgba(124,58,237,0.2)',
                        }}
                    >
                        <img
                            src="/illustrations/login.png"
                            alt="Space astronaut"
                            style={{ width: '85%', height: 'auto', mixBlendMode: 'screen' }}
                        />
                    </motion.div>

                    <h2 style={{
                        fontFamily: '"Outfit", sans-serif',
                        fontSize: '1.8rem',
                        fontWeight: 700,
                        color: 'var(--ag-text)',
                        marginBottom: '0.5rem',
                    }}>Reset Password</h2>
                    <p style={{
                        color: 'var(--ag-text-secondary)',
                        marginBottom: '2rem',
                        fontSize: '0.9rem',
                        lineHeight: 1.5,
                    }}>Enter your email and we'll send you a link to reset your password</p>

                    <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="Enter your email"
                            style={{
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
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = 'var(--ag-accent)'
                                e.target.style.boxShadow = '0 0 15px var(--ag-accent-glow)'
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = 'var(--ag-glass-border)'
                                e.target.style.boxShadow = 'none'
                            }}
                        />

                        <motion.button
                            type="submit"
                            disabled={loading}
                            className="ag-btn-primary"
                            whileHover={!loading ? { scale: 1.04 } : {}}
                            whileTap={!loading ? { scale: 0.96 } : {}}
                            transition={springBounce}
                            style={{ width: '100%', marginTop: '0.5rem' }}
                        >
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </motion.button>
                    </form>

                    <div style={{
                        marginTop: '1.5rem',
                        fontSize: '0.85rem',
                    }}>
                        <Link to="/login" style={{
                            color: 'var(--ag-accent)',
                            textDecoration: 'none',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                        }}>← Back to Login</Link>
                    </div>
                </motion.div>
            </div>
        </AntiGravityBackground>
    )
}
