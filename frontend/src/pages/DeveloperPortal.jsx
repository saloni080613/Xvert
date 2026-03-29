import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Copy, Check, Trash2, Key, Activity, BookOpenText } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { supabase } from '../services/supabase'
import authService from '../services/AuthService'
import AntiGravityBackground from '../components/AntiGravityBackground'
import Navbar from '../components/Navbar'
import UserAvatar from '../components/UserAvatar'
import { useToast } from '../components/ToastContext'
import axios from 'axios'

const springBounce = { type: 'spring', stiffness: 400, damping: 20 }

export default function DeveloperPortal() {
    const navigate = useNavigate()
    const { addToast } = useToast()
    const [session, setSession] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('keys')

    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'

    const [keys, setKeys] = useState([])
    const [showKeyModal, setShowKeyModal] = useState(false)
    const [newKey, setNewKey] = useState('')
    const [copied, setCopied] = useState(false)

    const [usageData, setUsageData] = useState(null)

    useEffect(() => {
        authService.getSession().then(({ data: { session: currentSession } }) => {
            if (!currentSession) {
                navigate('/login')
            } else {
                setSession(currentSession)
                fetchData()
            }
        })
    }, [navigate])

    // ── Polling: re-fetch usage every 10 seconds when Usage tab is active ──
    useEffect(() => {
        if (!session || activeTab !== 'usage') return

        const interval = setInterval(() => fetchUsage(), 10000)
        return () => clearInterval(interval)
    }, [session, activeTab])

    const getAuthHeaders = async () => {
        const { data: { session: freshSession } } = await authService.getSession()
        if (freshSession) setSession(freshSession)
        return { 'Authorization': `Bearer ${freshSession?.access_token}` }
    }

    // Fetches both keys and usage on first load
    const fetchData = async () => {
        setLoading(true)
        try {
            const h = await getAuthHeaders()
            const [keysRes, usageRes] = await Promise.all([
                axios.get(`${apiBaseUrl}/api/keys/list`, { headers: h }),
                axios.get(`${apiBaseUrl}/api/keys/usage`, { headers: h })
            ])
            setKeys(keysRes.data.keys)
            setUsageData(usageRes.data)
        } catch (err) {
            addToast('Failed to load portal data', 'error')
        } finally {
            setLoading(false)
        }
    }

    // Fetches only usage — called by polling interval
    const fetchUsage = async () => {
        try {
            const h = await getAuthHeaders()
            const res = await axios.get(`${apiBaseUrl}/api/keys/usage`, { headers: h })
            setUsageData(res.data)
        } catch (err) {
            // Silent fail for background polls — don't spam toasts
        }
    }

    const handleGenerateKey = async () => {
        try {
            const h = await getAuthHeaders()
            const res = await axios.post(
                `${apiBaseUrl}/api/keys/generate`,
                { name: 'New Key' },
                { headers: h }
            )
            setNewKey(res.data.key)
            setShowKeyModal(true)
            setCopied(false)
        } catch (err) {
            addToast('Failed to generate key', 'error')
        }
    }

    const handleRenameKey = async (id, newName) => {
        try {
            const h = await getAuthHeaders()
            await axios.patch(
                `${apiBaseUrl}/api/keys/${id}/rename`,
                { name: newName },
                { headers: h }
            )
            setKeys(prev => prev.map(k => k.id === id ? { ...k, name: newName } : k))
            addToast('Key renamed', 'success')
        } catch (err) {
            addToast('Failed to rename key', 'error')
        }
    }

    const handleRevokeKey = async (id) => {
        if (!window.confirm('Revoke this key? This cannot be undone.')) return
        try {
            const h = await getAuthHeaders()
            await axios.delete(
                `${apiBaseUrl}/api/keys/${id}/revoke`,
                { headers: h }
            )
            setKeys(prev => prev.filter(k => k.id !== id))
            addToast('Key revoked', 'success')
        } catch (err) {
            addToast('Failed to revoke key', 'error')
        }
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(newKey)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const closeKeyModal = () => {
        setShowKeyModal(false)
        setNewKey('')
        fetchData()
    }

    const handleLogout = async () => {
        await authService.logout()
        navigate('/login')
        addToast('Logged out successfully', 'info')
    }

    if (loading) {
        return (
            <AntiGravityBackground>
                <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--ag-text)' }}>
                    Loading portal...
                </div>
            </AntiGravityBackground>
        )
    }

    return (
        <AntiGravityBackground>
            <Navbar
                tools={[]}
                onToolSelect={() => navigate('/')}
                onReset={() => navigate('/')}
                session={session}
                UserAvatarComponent={<UserAvatar session={session} onLogout={handleLogout} />}
            />

            <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '3rem 2rem' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontFamily: '"Outfit", sans-serif', fontSize: '2rem', color: 'var(--ag-text)', margin: '0 0 0.5rem 0' }}>
                        API Access
                    </h1>
                    <p style={{ fontSize: '1rem', color: 'var(--ag-text-secondary)', margin: 0 }}>
                        Integrate Xvert conversions directly into your apps.
                    </p>
                </div>

                {/* Tab bar */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--ag-glass-border)' }}>
                    {[
                        { id: 'keys', label: 'API Keys', icon: Key },
                        { id: 'usage', label: 'Usage', icon: Activity },
                        { id: 'docs', label: 'Docs', icon: BookOpenText },
                    ].map(tab => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    padding: '0.75rem 1.5rem',
                                    background: 'none', border: 'none',
                                    borderBottom: isActive ? '2px solid var(--ag-accent)' : '2px solid transparent',
                                    color: isActive ? 'var(--ag-accent)' : 'var(--ag-text-secondary)',
                                    fontWeight: 700, fontSize: '0.95rem',
                                    cursor: 'pointer', transition: 'color 0.2s',
                                }}
                            >
                                <Icon size={16} />
                                {tab.label}
                                {/* Live pulse dot — only on Usage tab */}
                                {tab.id === 'usage' && (
                                    <span style={{
                                        width: '7px', height: '7px',
                                        borderRadius: '50%',
                                        backgroundColor: 'var(--ag-success)',
                                        animation: 'ag-pulse 2s ease-in-out infinite',
                                        display: 'inline-block',
                                    }} />
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* Pulse keyframe — injected inline once */}
                <style>{`@keyframes ag-pulse { 0%,100%{opacity:1} 50%{opacity:0.25} }`}</style>

                <AnimatePresence mode="wait">

                    {/* ── API Keys tab ── */}
                    {activeTab === 'keys' && (
                        <motion.div
                            key="keys"
                            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                                <motion.button
                                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                    className="ag-btn-primary" onClick={handleGenerateKey}
                                >
                                    Generate new key
                                </motion.button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {keys.length === 0 ? (
                                    <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--ag-text-secondary)' }}>
                                        No API keys generated yet.
                                    </div>
                                ) : keys.map(k => (
                                    <motion.div key={k.id} layout className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                            <input
                                                type="text"
                                                defaultValue={k.name}
                                                onBlur={(e) => { if (e.target.value !== k.name) handleRenameKey(k.id, e.target.value) }}
                                                style={{
                                                    background: 'transparent', border: 'none',
                                                    color: 'var(--ag-text)', fontWeight: 700,
                                                    fontSize: '1.1rem', outline: 'none',
                                                    borderBottom: '1px dashed var(--ag-glass-border)',
                                                }}
                                            />
                                            <div style={{
                                                fontFamily: 'monospace', color: 'var(--ag-text)',
                                                background: 'var(--ag-input-bg)', padding: '0.3rem 0.6rem',
                                                borderRadius: '4px', display: 'inline-block', width: 'fit-content',
                                            }}>
                                                {k.key_prefix}••••••••••••••••••••
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--ag-text-secondary)', display: 'flex', gap: '1.5rem', marginTop: '0.3rem' }}>
                                                <span>Created: {new Date(k.created_at).toLocaleDateString()}</span>
                                                <span>Last used: {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'Never used'}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRevokeKey(k.id)}
                                            style={{
                                                background: 'rgba(255, 82, 82, 0.1)', color: 'var(--ag-error)',
                                                border: '1px solid rgba(255, 82, 82, 0.3)',
                                                padding: '0.4rem 0.8rem', borderRadius: '6px',
                                                cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                                            }}
                                        >
                                            Revoke
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ── Usage tab ── */}
                    {activeTab === 'usage' && usageData && (
                        <motion.div
                            key="usage"
                            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
                        >
                            {/* Stat cards */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                                    <div style={{ color: 'var(--ag-text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Total Calls (30d)</div>
                                    <div style={{ fontFamily: '"Outfit", sans-serif', color: 'var(--ag-accent)', fontSize: '2.5rem', fontWeight: 700 }}>
                                        {usageData.total_calls}
                                    </div>
                                </div>
                                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                                    <div style={{ color: 'var(--ag-text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Most Used Tool</div>
                                    <div style={{ color: 'var(--ag-text)', fontSize: '1.2rem', fontWeight: 600, marginTop: '0.6rem' }}>
                                        {Object.entries(usageData.by_tool).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None'}
                                    </div>
                                </div>
                                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                                    <div style={{ color: 'var(--ag-text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Last API Call</div>
                                    <div style={{ color: 'var(--ag-text)', fontSize: '1.2rem', fontWeight: 600, marginTop: '0.6rem' }}>
                                        {usageData.recent.length > 0
                                            ? new Date(usageData.recent[0].called_at).toLocaleDateString()
                                            : 'Never'}
                                    </div>
                                </div>
                            </div>

                            {/* Chart + by-tool */}
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                                    <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--ag-text)' }}>Calls over time</h3>
                                    <div style={{ height: '250px', width: '100%' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={usageData.by_date}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="var(--ag-glass-border)" vertical={false} />
                                                <XAxis dataKey="date" stroke="var(--ag-text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis stroke="var(--ag-text-secondary)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                                <Tooltip
                                                    contentStyle={{ background: 'var(--ag-card-bg)', border: '1px solid var(--ag-card-border)', borderRadius: '8px', color: 'var(--ag-text)' }}
                                                    itemStyle={{ color: 'var(--ag-accent)' }}
                                                />
                                                <Bar dataKey="count" fill="var(--ag-accent)" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                                    <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--ag-text)' }}>By Tool</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {Object.entries(usageData.by_tool).sort((a, b) => b[1] - a[1]).map(([tool, count]) => (
                                            <div key={tool} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: 'var(--ag-text)', fontSize: '0.9rem' }}>{tool}</span>
                                                <span style={{
                                                    background: 'var(--ag-accent)', color: '#fff',
                                                    padding: '0.2rem 0.6rem', borderRadius: '12px',
                                                    fontSize: '0.8rem', fontWeight: 700,
                                                }}>{count}</span>
                                            </div>
                                        ))}
                                        {Object.keys(usageData.by_tool).length === 0 && (
                                            <span style={{ color: 'var(--ag-text-secondary)', fontSize: '0.9rem' }}>No calls yet.</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Recent calls table */}
                            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                    <h3 style={{ margin: 0, color: 'var(--ag-text)' }}>Recent Calls</h3>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--ag-text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--ag-success)', display: 'inline-block', animation: 'ag-pulse 2s ease-in-out infinite' }} />
                                        Updates every 10s
                                    </span>
                                </div>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: 'var(--ag-text)', fontSize: '0.9rem' }}>
                                        <thead>
                                            <tr style={{ color: 'var(--ag-text-secondary)', borderBottom: '1px solid var(--ag-glass-border)' }}>
                                                <th style={{ padding: '1rem 0', fontWeight: 600 }}>Tool</th>
                                                <th style={{ padding: '1rem 0', fontWeight: 600 }}>Status</th>
                                                <th style={{ padding: '1rem 0', fontWeight: 600 }}>File Size</th>
                                                <th style={{ padding: '1rem 0', fontWeight: 600 }}>Duration</th>
                                                <th style={{ padding: '1rem 0', fontWeight: 600 }}>Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {usageData.recent.map(r => (
                                                <tr key={r.id} style={{ borderBottom: '1px solid var(--ag-glass-border)' }}>
                                                    <td style={{ padding: '1rem 0', fontWeight: 500 }}>{r.tool_id}</td>
                                                    <td style={{ padding: '1rem 0' }}>
                                                        <span style={{
                                                            background: r.status === 'success' ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 82, 82, 0.15)',
                                                            color: r.status === 'success' ? 'var(--ag-success)' : 'var(--ag-error)',
                                                            padding: '0.2rem 0.5rem', borderRadius: '4px',
                                                            fontSize: '0.8rem', fontWeight: 700,
                                                        }}>
                                                            {r.status}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '1rem 0', color: 'var(--ag-text-secondary)' }}>
                                                        {r.file_size_kb != null ? `${Number(r.file_size_kb).toFixed(1)} KB` : '—'}
                                                    </td>
                                                    <td style={{ padding: '1rem 0', color: 'var(--ag-text-secondary)' }}>
                                                        {r.duration_ms != null ? `${r.duration_ms} ms` : '—'}
                                                    </td>
                                                    <td style={{ padding: '1rem 0', color: 'var(--ag-text-secondary)' }}>
                                                        {new Date(r.called_at).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {usageData.recent.length === 0 && (
                                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--ag-text-secondary)' }}>
                                            No recent API calls found.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ── Docs tab ── */}
                    {activeTab === 'docs' && <DocsContent />}

                </AnimatePresence>

                {/* Show-once key modal */}
                {showKeyModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 9999, backdropFilter: 'blur(4px)',
                    }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="glass-panel"
                            style={{ padding: '2.5rem', maxWidth: '480px', width: '100%', margin: '0 1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
                        >
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                <AlertTriangle color="var(--ag-accent)" size={32} style={{ flexShrink: 0 }} />
                                <div>
                                    <h2 style={{ fontFamily: '"Outfit", sans-serif', margin: '0 0 0.5rem 0', color: 'var(--ag-text)' }}>
                                        Save your API key
                                    </h2>
                                    <p style={{ margin: 0, color: 'var(--ag-text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                                        This key will only be shown once. Copy it now — you cannot retrieve it later.
                                    </p>
                                </div>
                            </div>

                            <div style={{
                                background: 'var(--ag-input-bg)',
                                border: '1px solid var(--ag-glass-border)',
                                borderRadius: '8px', padding: '1rem',
                            }}>
                                <code style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--ag-text)', wordBreak: 'break-all', userSelect: 'all' }}>
                                    {newKey}
                                </code>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                                <motion.button
                                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                    onClick={copyToClipboard}
                                    className="ag-btn-primary"
                                    style={{ padding: '0.6rem 1.2rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
                                >
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                    {copied ? 'Copied!' : 'Copy key'}
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                    onClick={closeKeyModal}
                                    style={{
                                        background: 'transparent', border: '1px solid var(--ag-glass-border)',
                                        color: 'var(--ag-text)', borderRadius: '30px',
                                        padding: '0.6rem 1.2rem', fontWeight: 700, cursor: 'pointer',
                                    }}
                                >
                                    I've saved my key
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </main>
        </AntiGravityBackground>
    )
}

function DocsContent() {
    const [codeTab, setCodeTab] = useState('python')
    const [copiedContent, setCopiedContent] = useState(false)

    const codeExamples = {
        python: `import requests\n\n# Step 1 — convert\nres = requests.post(\n    "http://localhost:8000/v1/convert/document",\n    headers={"X-API-Key": "xvt_your_key_here"},\n    files={"file": open("document.pdf", "rb")},\n    data={"target_format": "docx"}\n)\ndata = res.json()\n\n# Step 2 — download\nfile_res = requests.get(\n    "http://localhost:8000" + data["download_url"]\n)\nopen(data["filename"], "wb").write(file_res.content)`,
        javascript: `const formData = new FormData()\nformData.append("file", fileInput.files[0])\nformData.append("target_format", "docx")\n\n// Step 1 — convert\nconst res = await fetch("http://localhost:8000/v1/convert/document", {\n  method: "POST",\n  headers: { "X-API-Key": "xvt_your_key_here" },\n  body: formData\n})\n\n// Check for errors first\nif (!res.ok) {\n  const err = await res.json()\n  console.error(err.code, err.error)\n  return\n}\n\nconst data = await res.json()\n\n// Step 2 — download\nconst fileRes = await fetch("http://localhost:8000" + data.download_url)\nconst blob    = await fileRes.blob()\nconst a       = Object.assign(document.createElement("a"),\n                  { href: URL.createObjectURL(blob),\n                    download: data.filename })\na.click()`,
        curl: `# Step 1 — convert, get download URL\ncurl -X POST http://localhost:8000/v1/convert/document \\\n  -H "X-API-Key: xvt_your_key_here" \\\n  -F "file=@document.pdf" \\\n  -F "target_format=docx"\n\n# Response:\n# {\n#   "success": true,\n#   "download_url": "/v1/download/abc123",\n#   "filename": "converted.docx",\n#   "expires_in_seconds": 300\n# }\n\n# Step 2 — download the file\ncurl http://localhost:8000/v1/download/abc123 \\\n  --output converted.docx`,
        'merge-pdf': `import requests\n\n# merge-pdf accepts multiple files under the same "files" key\nfiles = [\n    ("files", open("doc1.pdf", "rb")),\n    ("files", open("doc2.pdf", "rb")),\n]\nres = requests.post(\n    "http://localhost:8000/v1/convert/merge-pdf",\n    headers={"X-API-Key": "xvt_your_key_here"},\n    files=files\n)\ndata = res.json()\n\nfile_res = requests.get(\n    "http://localhost:8000" + data["download_url"]\n)\nopen(data["filename"], "wb").write(file_res.content)`,
    }

    const copyCode = () => {
        navigator.clipboard.writeText(codeExamples[codeTab])
        setCopiedContent(true)
        setTimeout(() => setCopiedContent(false), 2000)
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
            className="glass-panel" style={{ padding: '2rem' }}
        >
            <div style={{ color: 'var(--ag-text)', lineHeight: 1.6 }}>

                {/* 1. Authentication */}
                <h2 style={{ fontFamily: '"Outfit", sans-serif', marginTop: 0 }}>1. Authentication</h2>
                <p style={{ color: 'var(--ag-text-secondary)' }}>
                    All API requests require an <code>X-API-Key</code> header. Generate your key in the API Keys tab above.
                </p>
                <div style={{ background: 'var(--ag-input-bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--ag-glass-border)', fontFamily: 'monospace', marginBottom: '2rem' }}>
                    X-API-Key: xvt_your_key_here
                </div>

                {/* 2. Base URL */}
                <h2 style={{ fontFamily: '"Outfit", sans-serif' }}>2. Base URL</h2>
                <div style={{ background: 'var(--ag-input-bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--ag-glass-border)', fontFamily: 'monospace', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div><span style={{ color: 'var(--ag-text-secondary)' }}>Development: </span>http://localhost:8000</div>
                    <div><span style={{ color: 'var(--ag-text-secondary)' }}>Production:&nbsp;&nbsp;</span>https://your-deployed-url.com</div>
                </div>

                {/* 3. Endpoints */}
                <h2 style={{ fontFamily: '"Outfit", sans-serif' }}>3. Endpoints</h2>
                <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'var(--ag-input-bg)', borderBottom: '2px solid var(--ag-glass-border)' }}>
                                <th style={{ padding: '0.8rem' }}>Method</th>
                                <th style={{ padding: '0.8rem' }}>Endpoint</th>
                                <th style={{ padding: '0.8rem' }}>Input formats</th>
                                <th style={{ padding: '0.8rem' }}>target_format values</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { method: 'POST', endpoint: '/v1/convert/document', input: 'PDF, DOCX, DOC', params: '"docx" | "pdf" | "jpg" | "png"' },
                                { method: 'POST', endpoint: '/v1/convert/image', input: 'JPG, PNG, GIF, BMP', params: '"jpg" | "png" | "gif" | "pdf"' },
                                { method: 'POST', endpoint: '/v1/convert/data', input: 'CSV, JSON, XLSX, XML', params: '"csv" | "json" | "xlsx" | "xml"' },
                                { method: 'POST', endpoint: '/v1/convert/ocr', input: 'PDF, JPG, PNG', params: 'format: "docx" | "txt"' },
                                { method: 'POST', endpoint: '/v1/convert/merge-pdf', input: 'PDF (2+ files)', params: 'none — no extra param needed' },
                            ].map(row => (
                                <tr key={row.endpoint} style={{ borderBottom: '1px solid var(--ag-glass-border)' }}>
                                    <td style={{ padding: '0.8rem' }}>{row.method}</td>
                                    <td style={{ padding: '0.8rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>{row.endpoint}</td>
                                    <td style={{ padding: '0.8rem', color: 'var(--ag-text-secondary)' }}>{row.input}</td>
                                    <td style={{ padding: '0.8rem', fontFamily: 'monospace', fontSize: '0.82rem' }}>{row.params}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* 4. Response format */}
                <h2 style={{ fontFamily: '"Outfit", sans-serif' }}>4. Response format</h2>
                <p style={{ color: 'var(--ag-text-secondary)' }}>
                    All successful conversions return a temporary download URL valid for <strong>5 minutes</strong>, usable once. Fetch it immediately after conversion.
                </p>
                <div style={{ background: 'var(--ag-input-bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--ag-glass-border)', fontFamily: 'monospace', marginBottom: '2rem' }}>
                    <pre style={{ margin: 0, color: 'var(--ag-text)', fontSize: '0.85rem' }}>{`{
  "success": true,
  "download_url": "/v1/download/abc123xyz",
  "filename": "converted.docx",
  "expires_in_seconds": 300
}`}</pre>
                </div>

                {/* 5. Code examples */}
                <h2 style={{ fontFamily: '"Outfit", sans-serif' }}>5. Code examples</h2>
                <div style={{ background: 'var(--ag-input-bg)', borderRadius: '8px', border: '1px solid var(--ag-glass-border)', overflow: 'hidden', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--ag-glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                        {['python', 'javascript', 'curl', 'merge-pdf'].map(t => (
                            <button
                                key={t}
                                onClick={() => setCodeTab(t)}
                                style={{
                                    background: 'none', border: 'none', padding: '0.8rem 1.2rem',
                                    color: codeTab === t ? 'var(--ag-accent)' : 'var(--ag-text-secondary)',
                                    borderBottom: codeTab === t ? '2px solid var(--ag-accent)' : '2px solid transparent',
                                    cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                                    textTransform: 'capitalize',
                                }}
                            >
                                {t}
                            </button>
                        ))}
                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', paddingRight: '1rem' }}>
                            <button onClick={copyCode} style={{ background: 'none', border: 'none', color: 'var(--ag-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', fontSize: '0.8rem' }}>
                                {copiedContent ? <Check size={14} /> : <Copy size={14} />}
                                {copiedContent ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                    </div>
                    <pre style={{ margin: 0, padding: '1.5rem', overflowX: 'auto', fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--ag-text)' }}>
                        <code>{codeExamples[codeTab]}</code>
                    </pre>
                </div>

                {/* 6. Rate limit headers */}
                <h2 style={{ fontFamily: '"Outfit", sans-serif' }}>6. Rate limit headers</h2>
                <p style={{ color: 'var(--ag-text-secondary)' }}>Every successful response includes these headers:</p>
                <div style={{ background: 'var(--ag-input-bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--ag-glass-border)', fontFamily: 'monospace', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
                    <div>X-RateLimit-Limit: 200</div>
                    <div>X-RateLimit-Remaining: 187</div>
                </div>

                {/* 7. Error handling */}
                <h2 style={{ fontFamily: '"Outfit", sans-serif' }}>7. Error handling</h2>
                <p style={{ color: 'var(--ag-text-secondary)' }}>All errors return a consistent JSON shape. Check <code>res.ok</code> before consuming the download URL:</p>
                <div style={{ background: 'var(--ag-input-bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--ag-glass-border)', fontFamily: 'monospace', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                    <pre style={{ margin: 0, color: 'var(--ag-text)' }}>{`// Error response shape
{
  "error": "Human readable message",
  "code":  "INVALID_KEY"
}

// Always check before downloading
if (!res.ok) {
  const err = await res.json()
  console.error(err.code, err.error)
  return
}`}</pre>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'var(--ag-input-bg)', borderBottom: '2px solid var(--ag-glass-border)' }}>
                                <th style={{ padding: '0.8rem' }}>Code</th>
                                <th style={{ padding: '0.8rem' }}>HTTP</th>
                                <th style={{ padding: '0.8rem' }}>Meaning</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { code: 'INVALID_KEY', http: 401, msg: 'Key missing or revoked' },
                                { code: 'RATE_LIMIT_EXCEEDED', http: 429, msg: '200 calls/month limit reached' },
                                { code: 'UNSUPPORTED_FORMAT', http: 400, msg: 'Wrong file type for endpoint' },
                                { code: 'FILE_EXPIRED', http: 404, msg: 'Download link not found or expired' },
                                { code: 'CONVERSION_FAILED', http: 500, msg: 'Internal conversion error' },
                            ].map(row => (
                                <tr key={row.code} style={{ borderBottom: '1px solid var(--ag-glass-border)' }}>
                                    <td style={{ padding: '0.8rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>{row.code}</td>
                                    <td style={{ padding: '0.8rem' }}>{row.http}</td>
                                    <td style={{ padding: '0.8rem', color: 'var(--ag-text-secondary)' }}>{row.msg}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    )
}
