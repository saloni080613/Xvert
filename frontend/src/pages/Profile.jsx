import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import authService from '../services/AuthService'
import AntiGravityBackground from '../components/AntiGravityBackground'
import SkeletonLoader from '../components/SkeletonLoader'
import { ArrowLeft, User, Mail, Clock } from 'lucide-react'

const springBounce = { type: 'spring', stiffness: 400, damping: 20 }

export default function Profile() {
    const [session, setSession] = useState(null)
    const [loading, setLoading] = useState(true)
    const [imgError, setImgError] = useState(false)

    useEffect(() => {
        authService.getSession().then(({ data: { session } }) => {
            setSession(session)
            setLoading(false)
        })
    }, [])

    if (loading) {
        return (
            <AntiGravityBackground>
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '2rem',
                }}>
                    <div className="glass-panel" style={{
                        width: '100%',
                        maxWidth: '500px',
                        padding: '2.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1.5rem',
                    }}>
                        <SkeletonLoader width="120px" height="120px" borderRadius="50%" />
                        <SkeletonLoader width="200px" height="1.5rem" />
                        <SkeletonLoader width="100%" height="3.5rem" count={3} style={{ marginTop: '0.5rem' }} />
                    </div>
                </div>
            </AntiGravityBackground>
        )
    }

    if (!session) {
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
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-panel"
                        style={{
                            padding: '3rem',
                            textAlign: 'center',
                            maxWidth: '400px',
                        }}
                    >
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
                        <h2 style={{ color: 'var(--ag-text)', fontFamily: '"Outfit", sans-serif', marginBottom: '1rem' }}>
                            Login Required
                        </h2>
                        <p style={{ color: 'var(--ag-text-secondary)', marginBottom: '1.5rem' }}>
                            Please sign in to view your profile
                        </p>
                        <Link to="/login">
                            <motion.button
                                className="ag-btn-primary"
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                transition={springBounce}
                            >Sign In</motion.button>
                        </Link>
                    </motion.div>
                </div>
            </AntiGravityBackground>
        )
    }

    const { user } = session
    const avatarUrl = user.user_metadata.avatar_url
    const fullName = user.user_metadata.full_name || user.email.split('@')[0]

    const infoFields = [
        { icon: User, label: 'Full Name', value: fullName },
        { icon: Mail, label: 'Email Address', value: user.email },
        { icon: Clock, label: 'Last Sign In', value: new Date(user.last_sign_in_at).toLocaleString() },
    ]

    return (
        <AntiGravityBackground>
            <div style={{
                minHeight: '100vh',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
            }}>
                <div style={{ width: '100%', maxWidth: '600px' }}>
                    {/* Back link */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{ marginBottom: '2rem' }}
                    >
                        <Link to="/" style={{
                            color: 'var(--ag-accent)',
                            textDecoration: 'none',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.9rem',
                        }}>
                            <ArrowLeft size={18} /> Back to Home
                        </Link>
                    </motion.div>

                    {/* Profile Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className="glass-panel"
                        style={{
                            padding: '3rem',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '2rem',
                        }}
                    >
                        <h1 style={{
                            fontFamily: '"Outfit", sans-serif',
                            color: 'var(--ag-text)',
                            margin: 0,
                            fontSize: '1.6rem',
                        }}>My Profile</h1>

                        {/* Avatar */}
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            transition={springBounce}
                            style={{
                                width: '120px',
                                height: '120px',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                border: '3px solid var(--ag-accent)',
                                boxShadow: '0 0 30px var(--ag-accent-glow)',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                backgroundColor: 'var(--ag-input-bg)',
                                fontSize: '3rem',
                                color: 'var(--ag-text)',
                                fontWeight: 700,
                            }}
                        >
                            {avatarUrl && !imgError ? (
                                <img
                                    src={avatarUrl}
                                    alt="Profile"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={() => setImgError(true)}
                                />
                            ) : (
                                <span>{fullName.charAt(0).toUpperCase()}</span>
                            )}
                        </motion.div>

                        {/* Info Fields */}
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {infoFields.map((field, index) => (
                                <motion.div
                                    key={field.label}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 + index * 0.08 }}
                                >
                                    <label style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        color: 'var(--ag-text-secondary)',
                                        fontSize: '0.85rem',
                                        marginBottom: '0.4rem',
                                        fontWeight: 600,
                                    }}>
                                        <field.icon size={14} /> {field.label}
                                    </label>
                                    <div style={{
                                        padding: '0.9rem 1rem',
                                        backgroundColor: 'var(--ag-input-bg)',
                                        borderRadius: '12px',
                                        color: 'var(--ag-text)',
                                        fontWeight: 600,
                                        border: '1px solid var(--ag-glass-border)',
                                        backdropFilter: 'blur(8px)',
                                    }}>{field.value}</div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </AntiGravityBackground>
    )
}
