import { useState } from 'react'
import authService from '../services/AuthService'
import { Link } from 'react-router-dom'

export default function ForgotPassword() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [message, setMessage] = useState(null)

    const handleResetPassword = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setMessage(null)

        const { error } = await authService.resetPasswordForEmail(email)

        if (error) {
            setError(error.message)
        } else {
            setMessage('Check your email for the password reset link.')
        }
        setLoading(false)
    }

    return (
        <div style={{
            height: '100vh',
            width: '100vw',
            backgroundImage: "url('/reset_bg.png')",
            backgroundSize: '100% 100%',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: '"Nunito", sans-serif',
            overflow: 'hidden',
            margin: 0,
            padding: 0
        }}>

            <div style={{
                flex: 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '1rem'
            }}>
                <div style={{
                    width: '100%',
                    maxWidth: '260px', // Small square size matching Login
                    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Glass effect
                    backdropFilter: 'blur(20px)',
                    borderRadius: '20px', // Round edges
                    padding: '1.5rem',
                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    color: 'white'
                }}>
                    <h2 style={{
                        textAlign: 'center',
                        marginBottom: '1rem',
                        fontSize: '1.3rem',
                        fontWeight: '600',
                        color: '#fff',
                        fontFamily: '"Outfit", sans-serif'
                    }}>Reset Password</h2>

                    {error && (
                        <div style={{
                            backgroundColor: 'rgba(255, 20, 20, 0.25)',
                            border: '1px solid rgba(255, 80, 80, 0.5)',
                            color: '#FFCDD2',
                            padding: '0.75rem',
                            borderRadius: '4px',
                            marginBottom: '1rem',
                            fontSize: '0.85rem',
                            fontWeight: '500',
                            textAlign: 'center',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                            {error}
                        </div>
                    )}

                    {message && (
                        <div style={{
                            backgroundColor: 'rgba(20, 160, 20, 0.25)',
                            border: '1px solid rgba(100, 200, 100, 0.5)',
                            color: '#E8F5E9',
                            padding: '0.75rem',
                            borderRadius: '4px',
                            marginBottom: '1rem',
                            fontSize: '0.85rem',
                            fontWeight: '500',
                            textAlign: 'center',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="Enter your email"
                            style={{
                                width: '100%',
                                padding: '0.8rem',
                                borderRadius: '4px',
                                border: 'none',
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                color: 'white',
                                fontSize: '0.9rem',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                marginTop: '0.5rem',
                                width: '100%',
                                padding: '0.8rem',
                                borderRadius: '4px',
                                border: 'none',
                                backgroundColor: '#B0D8F5', // Soft Sky Blue
                                color: '#1a1a1a', // Dark text
                                fontSize: '0.85rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                transition: 'transform 0.2s',
                                opacity: loading ? 0.8 : 1
                            }}
                        >
                            {loading ? 'SENDING...' : 'SEND RESET LINK'}
                        </button>
                    </form>

                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginTop: '1rem',
                        fontSize: '0.75rem',
                        color: '#ffffff',
                        textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                    }}>
                        <Link to="/login" style={{ color: '#ffffff', textDecoration: 'none', fontWeight: 'bold' }}>Back to Login</Link>
                    </div>
                </div>
            </div>

            <div style={{
                width: '100vw',
                padding: '0.8rem 2rem',
                backgroundColor: '#f5f5f5',
                borderTop: '1px solid #e0e0e0',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '2rem',
                fontSize: '0.7rem',
                color: '#666',
                fontFamily: '"Nunito", sans-serif',
                boxSizing: 'border-box',
                whiteSpace: 'nowrap',
                overflowX: 'auto'
            }}>
                <span>Copyright © 2025 Xvert. All rights reserved.</span>
                <span style={{ cursor: 'pointer' }}>Terms of Use</span>
                <span style={{ cursor: 'pointer' }}>Cookie preferences</span>
                <span style={{ cursor: 'pointer' }}>Privacy</span>
                <span style={{ cursor: 'pointer' }}>Do not sell or share my personal information</span>
            </div>
        </div>
    )
}
