import { Link } from 'react-router-dom'

export default function Navbar() {
    return (
        <nav style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.6rem 2rem',
            backgroundColor: '#FAF9F6', // Feather White
            borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
            color: '#4A3B3B', // Dark Rose/Brown text for contrast
            // backdropFilter: 'blur(10px)', // Removed blur since it's solid now
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000
        }}>
            <Link to="/" style={{
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <span style={{
                    fontSize: '1.5rem',
                    fontWeight: '400', // Removed bold
                    fontStyle: 'italic', // Added italic
                    fontFamily: '"Inter", sans-serif',
                    letterSpacing: '-1px',
                    lineHeight: '1'
                }}>
                    Xvert
                </span>
                <span style={{
                    fontSize: '0.7rem',
                    fontWeight: '500',
                    letterSpacing: '0px',
                    fontFamily: '"Inter", sans-serif'
                }}>
                    Convert anything with Xvert
                </span>
            </Link>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <Link to="/login" style={{
                    textDecoration: 'none',
                    backgroundColor: '#CBB9A4', // Soft Sandstone
                    color: '#333',
                    padding: '0.5rem 1.5rem',
                    borderRadius: '30px', // Pill shape
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    fontFamily: '"Nunito", sans-serif'
                }}>Login</Link>
                <Link to="/signup" style={{
                    textDecoration: 'none',
                    backgroundColor: '#CBB9A4', // Soft Sandstone
                    color: '#333',
                    padding: '0.5rem 1.5rem',
                    borderRadius: '30px', // Pill shape
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    fontFamily: '"Nunito", sans-serif'
                }}>Sign Up</Link>
            </div>
        </nav>
    )
}
