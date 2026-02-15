import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import authService from '../services/AuthService'
import historyService from '../services/HistoryService'
import ToolIcon from '../components/ToolIcon'
import AntiGravityBackground from '../components/AntiGravityBackground'
import SkeletonLoader from '../components/SkeletonLoader'
import { ArrowLeft, Download } from 'lucide-react'

const springBounce = { type: 'spring', stiffness: 400, damping: 20 }

export default function History() {
    const [session, setSession] = useState(null)
    const [loading, setLoading] = useState(true)
    const [historyFiles, setHistoryFiles] = useState([])

    useEffect(() => {
        authService.getSession().then(({ data: { session } }) => {
            setSession(session)
            if (session) {
                fetchHistory()
            } else {
                setLoading(false)
            }
        })
    }, [])

    const fetchHistory = async () => {
        try {
            const data = await historyService.getHistory()
            setHistoryFiles(data.files || [])
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const getDownloadUrl = (filename) => {
        return `http://localhost:8000/api/convert/history/${filename}`
    }

    const formatDate = (timestamp) => {
        return new Date(timestamp * 1000).toLocaleString()
    }

    const getMockTool = (filename) => {
        const ext = filename.split('.').pop().toLowerCase()
        return { id: 'history-file', type: 'file', target: ext }
    }

    // Loading skeleton
    if (loading) {
        return (
            <AntiGravityBackground>
                <div style={{ minHeight: '100vh', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '100%', maxWidth: '700px' }}>
                        <SkeletonLoader width="150px" height="1.2rem" style={{ marginBottom: '2rem' }} />
                        <div className="glass-panel" style={{ padding: '2rem' }}>
                            <SkeletonLoader width="250px" height="1.8rem" style={{ marginBottom: '2rem' }} />
                            {[1, 2, 3].map(i => (
                                <SkeletonLoader key={i} width="100%" height="4rem" borderRadius="12px" style={{ marginBottom: '1rem' }} />
                            ))}
                        </div>
                    </div>
                </div>
            </AntiGravityBackground>
        )
    }

    // Not logged in
    if (!session) {
        return (
            <AntiGravityBackground>
                <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-panel"
                        style={{ padding: '3rem', textAlign: 'center', maxWidth: '400px' }}
                    >
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
                        <h2 style={{ color: 'var(--ag-text)', fontFamily: '"Outfit", sans-serif', marginBottom: '1rem' }}>
                            Login Required
                        </h2>
                        <p style={{ color: 'var(--ag-text-secondary)', marginBottom: '1.5rem' }}>
                            Please sign in to view your conversion history
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

    return (
        <AntiGravityBackground>
            <div style={{
                minHeight: '100vh',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
            }}>
                <div style={{ width: '100%', maxWidth: '700px' }}>
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

                    {/* History Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className="glass-panel"
                        style={{ padding: '2.5rem' }}
                    >
                        <h1 style={{
                            fontFamily: '"Outfit", sans-serif',
                            color: 'var(--ag-text)',
                            marginBottom: '2rem',
                            fontSize: '1.6rem',
                        }}>Conversion History</h1>

                        {historyFiles.length === 0 ? (
                            /* Empty State with Astronaut */
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    textAlign: 'center',
                                    padding: '3rem 2rem',
                                    borderRadius: '16px',
                                    background: 'var(--ag-input-bg)',
                                    border: '2px dashed var(--ag-glass-border)',
                                }}
                            >
                                <motion.div
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                                    style={{
                                        width: '160px', height: '160px', margin: '0 auto',
                                        borderRadius: '22px',
                                        background: 'linear-gradient(135deg, #1e1040, #2d1b69)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        overflow: 'hidden',
                                        boxShadow: '0 8px 25px rgba(124,58,237,0.2)',
                                    }}
                                >
                                    <img
                                        src="/illustrations/emty_history.png"
                                        alt="No history yet"
                                        style={{ width: '85%', height: 'auto', mixBlendMode: 'screen' }}
                                    />
                                </motion.div>
                                <h3 style={{
                                    color: 'var(--ag-text)',
                                    marginTop: '1rem',
                                    marginBottom: '0.5rem',
                                    fontFamily: '"Outfit", sans-serif',
                                }}>No history yet</h3>
                                <p style={{ color: 'var(--ag-text-secondary)', fontSize: '0.9rem' }}>
                                    Your recent file conversions will appear here
                                </p>
                            </motion.div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <AnimatePresence>
                                    {historyFiles.map((file, index) => (
                                        <motion.div
                                            key={file.name + index}
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            whileHover={{
                                                y: -2,
                                                boxShadow: '0 8px 25px var(--ag-glass-shadow)',
                                            }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '1rem 1.2rem',
                                                backgroundColor: 'var(--ag-card-bg)',
                                                border: '1px solid var(--ag-card-border)',
                                                borderRadius: '14px',
                                                backdropFilter: 'blur(8px)',
                                                transition: 'box-shadow 0.3s',
                                                gap: '1rem',
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
                                                <div style={{ transform: 'scale(0.75)', flexShrink: 0 }}>
                                                    <ToolIcon tool={getMockTool(file.name)} />
                                                </div>
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{
                                                        fontWeight: 700,
                                                        color: 'var(--ag-text)',
                                                        marginBottom: '0.2rem',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                    }}>{file.name}</div>
                                                    <div style={{
                                                        fontSize: '0.8rem',
                                                        color: 'var(--ag-text-secondary)',
                                                    }}>
                                                        {(file.size / 1024).toFixed(1)} KB • {formatDate(file.created_at)}
                                                    </div>
                                                </div>
                                            </div>
                                            <motion.a
                                                href={getDownloadUrl(file.name)}
                                                download
                                                whileHover={{ scale: 1.08 }}
                                                whileTap={{ scale: 0.95 }}
                                                transition={springBounce}
                                                style={{
                                                    background: 'var(--ag-btn-primary)',
                                                    color: '#fff',
                                                    padding: '0.5rem 1.2rem',
                                                    borderRadius: '10px',
                                                    textDecoration: 'none',
                                                    fontWeight: 700,
                                                    fontSize: '0.85rem',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.4rem',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <Download size={14} /> Download
                                            </motion.a>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </AntiGravityBackground>
    )
}
