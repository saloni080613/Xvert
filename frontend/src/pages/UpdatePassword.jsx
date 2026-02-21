import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import authService from '../services/AuthService'
import { Link, useNavigate } from 'react-router-dom'
import AntiGravityBackground from '../components/AntiGravityBackground'
import { useToast } from '../components/ToastContext'
import { ShieldCheck, Eye, EyeOff } from 'lucide-react'

const springBounce = { type: 'spring', stiffness: 400, damping: 20 }

const inputStyle = {
    width: '100%',
    padding: '0.9rem 3rem 0.9rem 1rem',
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

export default function UpdatePassword() {
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showNew, setShowNew] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [loading, setLoading] = useState(false)
    const [ready, setReady] = useState(false)
    const navigate = useNavigate()
    const { addToast } = useToast()

    useEffect(() => {
        const hash = window.location.hash
        if (hash && hash.includes('access_token')) {
            setReady(true)
        } else {
            authService.getSession().then(({ data: { session } }) => {
                if (session) setReady(true)
            })
        }
    }, [])

    const handleUpdatePassword = async (e) => {
        e.preventDefault()

        if (newPassword !== confirmPassword) {
            addToast('Passwords do not match', 'error')
            return
        }

        if (newPassword.length < 6) {
            addToast('Password must be at least 6 characters', 'error')
            return
        }

        setLoading(true)
        const { error } = await authService.updatePassword(newPassword)

        if (error) {
            addToast(error.message, 'error')
        } else {
            addToast('Password updated successfully!', 'success')
            setTimeout(() => navigate('/'), 2000)
        }
        setLoading(false)
    }

    const focusHandler = {
        onFocus: (e) => {
            e.target.style.borderColor = 'var(--ag-accent)'
            e.target.style.boxShadow = '0 0 15px var(--ag-accent-glow)'
        },
        onBlur: (e) => {
            e.target.style.borderColor = 'var(--ag-glass-border)'
            e.target.style.boxShadow = 'none'
        },
    }

    const eyeStyle = {
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
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        <img
                            src="/illustrations/login.png"
                            alt="Space astronaut"
                            style={{ width: '100%', height: 'auto' }}
                        />
                    </motion.div>

                    <h2 style={{
                        fontFamily: '"Outfit", sans-serif',
                        fontSize: '1.8rem',
                        fontWeight: 700,
                        color: 'var(--ag-text)',
                        marginBottom: '0.5rem',
                    }}>Update Password</h2>
                    <p style={{
                        color: 'var(--ag-text-secondary)',
                        marginBottom: '2rem',
                        fontSize: '0.9rem',
                    }}>Choose a strong new password</p>

                    {!ready ? (
                        <div style={{
                            padding: '2rem',
                            color: 'var(--ag-text-secondary)',
                            fontSize: '0.9rem'
                        }}>
                            Verifying reset link...
                        </div>
                    ) : (
                        <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showNew ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    placeholder="New Password"
                                    style={inputStyle}
                                    {...focusHandler}
                                />
                                <motion.button
                                    type="button"
                                    onClick={() => setShowNew(!showNew)}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    style={eyeStyle}
                                >
                                    {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                                </motion.button>
                            </div>

                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    placeholder="Confirm New Password"
                                    style={inputStyle}
                                    {...focusHandler}
                                />
                                <motion.button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    style={eyeStyle}
                                >
                                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                </motion.button>
                            </div>

                            <motion.button
                                type="submit"
                                disabled={loading}
                                className="ag-btn-primary"
                                whileHover={!loading ? { scale: 1.04 } : {}}
                                whileTap={!loading ? { scale: 0.96 } : {}}
                                transition={springBounce}
                                style={{ width: '100%', marginTop: '0.5rem' }}
                            >
                                {loading ? 'Updating...' : 'Update Password'}
                            </motion.button>
                        </form>
                    )}

                    <div style={{ marginTop: '1.5rem', fontSize: '0.85rem' }}>
                        <Link to="/login" style={{
                            color: 'var(--ag-accent)',
                            textDecoration: 'none',
                            fontWeight: 700,
                        }}>← Back to Login</Link>
                    </div>
                </motion.div>
            </div>
        </AntiGravityBackground>
    )
}
