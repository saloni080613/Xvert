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
            width: '100%',
            backgroundImage: "url('/reset_password_bg.png')",
            backgroundSize: 'cover',
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
                    maxWidth: '350px', // Enlarged from 260px
                    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Glass effect
                    backdropFilter: 'blur(20px)',
                    borderRadius: '24px',
                    padding: '2.5rem',
                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'white'
                }}>
                    <h2 style={{
                        textAlign: 'center',
                        marginBottom: '1.5rem',
                        fontSize: '1.8rem', // Larger heading
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
                            backgroundColor: 'rgba(30, 200, 30, 0.4)', // Slightly stronger green
                            border: '1px solid rgba(130, 255, 130, 0.6)',
                            color: '#ffffff', // Pure white for max visibility
                            padding: '0.75rem',
                            borderRadius: '4px',
                            marginBottom: '1rem',
                            fontSize: '0.9rem', // Slightly larger font
                            fontWeight: '600', // Semia-bold
                            textAlign: 'center',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            textShadow: '0 1px 2px rgba(0,0,0,0.5)' // Text shadow for legibility
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
                                padding: '1rem',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                color: 'white',
                                fontSize: '1rem',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                marginTop: '1rem',
                                width: '100%',
                                padding: '1rem',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: '#F0E6D2', // Beige
                                color: '#1a1a1a',
                                fontSize: '1rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                transition: 'all 0.2s',
                                opacity: loading ? 0.8 : 1
                            }}
                        >
                            {loading ? 'SENDING...' : 'SEND RESET LINK'}
                        </button>
                    </form>

                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginTop: '1.8rem',
                        fontSize: '1.1rem',
                        color: '#ffffff',
                        fontWeight: '800', // Bolder
                        textShadow: '0 2px 4px rgba(0,0,0,0.6)'
                    }}>
                        <Link to="/login" style={{ color: '#ffffff', textDecoration: 'none', fontWeight: 'bold' }}>Back to Login</Link>
                    </div>
                </div>
            </div>


        </div>
    )
}
