import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../services/supabase'
import authService from '../services/AuthService'
import conversionService from '../services/ConversionService'
import UserAvatar from '../components/UserAvatar'
import ToolIcon from '../components/ToolIcon'
import Navbar from '../components/Navbar'
import AntiGravityBackground from '../components/AntiGravityBackground'
import DropboxPicker from '../components/DropboxPicker'
import GoogleDrivePicker from '../components/GoogleDrivePicker'
import OneDrivePicker from '../components/OneDrivePicker'
import GoogleDriveSaver from '../components/GoogleDriveSaver'
import { useToast } from '../components/ToastContext'
import { Search, X, FileImage, FileText, Database, Layers, Command, Upload, Sparkles, ArrowRight } from 'lucide-react'

// Spring config
const springBounce = { type: 'spring', stiffness: 400, damping: 20 }
const springGentle = { type: 'spring', stiffness: 300, damping: 25 }

// Stagger children
const gridContainer = {
    hidden: {},
    show: { transition: { staggerChildren: 0.04 } }
}
const gridItem = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: springGentle }
}

// Category definitions
const CATEGORIES = [
    { id: 'all', label: 'All Tools', icon: Layers },
    { id: 'document', label: 'Documents', icon: FileText },
    { id: 'image', label: 'Images', icon: FileImage },
    { id: 'data', label: 'Data', icon: Database },
]

function getCategoryForTool(tool) {
    if (['pdf', 'docx', 'merge', 'image'].includes(tool.type)) return 'document'
    if (['jpg', 'png', 'gif'].includes(tool.type)) return 'image'
    if (tool.type === 'data') return 'data'
    return 'other'
}

// ---- File Preview Component ----
function FilePreview({ file }) {
    const [preview, setPreview] = useState(null)
    useEffect(() => {
        if (!file) { setPreview(null); return }
        const ext = file.name.split('.').pop().toLowerCase()
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) {
            if (file.isCloudUrl) {
                setPreview(file.url)
            } else {
                const reader = new FileReader()
                reader.onload = (e) => setPreview(e.target.result)
                reader.readAsDataURL(file)
            }
        } else {
            setPreview(null)
        }
        return () => setPreview(null)
    }, [file])

    if (!file) return null
    const ext = file.name.split('.').pop().toLowerCase()

    return (
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={springBounce}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}
        >
            {preview ? (
                <img src={preview} alt="Preview" style={{
                    maxHeight: '80px',
                    maxWidth: '140px',
                    borderRadius: '8px',
                    border: '1px solid var(--ag-glass-border)',
                    objectFit: 'cover',
                }} />
            ) : (
                <div style={{
                    width: '60px', height: '60px', borderRadius: '12px',
                    background: 'var(--ag-input-bg)', border: '1px solid var(--ag-glass-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.5rem',
                }}>
                    {ext === 'pdf' ? '📄' : ext === 'docx' || ext === 'doc' ? '📝' : '📋'}
                </div>
            )}
            <p style={{ fontWeight: 700, color: 'var(--ag-text)', fontSize: '0.9rem', margin: 0, textAlign: 'center', wordBreak: 'break-all' }}>{file.name}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--ag-text-secondary)', margin: 0 }}>
                {file.size ? `${(file.size / 1024).toFixed(1)} KB · ` : 'Cloud File · '}Click to change file
            </p>
        </motion.div>
    )
}

// ---- Orbital Progress Ring ----
function OrbitalProgress({ progress }) {
    const r = 40, cx = 50, cy = 50
    const circumference = 2 * Math.PI * r
    const offset = circumference - (progress / 100) * circumference

    return (
        <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 1rem' }}>
            <svg width="120" height="120" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--ag-glass-border)" strokeWidth="4" opacity="0.3" />
                <motion.circle
                    cx={cx} cy={cy} r={r} fill="none"
                    stroke="var(--ag-accent)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                    style={{ filter: 'drop-shadow(0 0 6px var(--ag-accent-glow))' }}
                />
                {/* Orbiting dot */}
                {progress < 100 && (
                    <motion.circle
                        cx={cx + r} cy={cy} r="4"
                        fill="var(--ag-accent)"
                        style={{ filter: 'drop-shadow(0 0 8px var(--ag-accent))' }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        transformOrigin={`${cx}px ${cy}px`}
                    />
                )}
            </svg>
            <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                fontWeight: 700, fontSize: '1.3rem', color: 'var(--ag-text)',
                fontFamily: '"Outfit", sans-serif',
            }}>
                {progress}%
            </div>
        </div>
    )
}

// ---- Recent Conversions Widget ----
function RecentConversions() {
    const [recents, setRecents] = useState([])

    useEffect(() => {
        try {
            const stored = JSON.parse(localStorage.getItem('xvert-recent') || '[]')
            setRecents(stored.slice(0, 3))
        } catch { setRecents([]) }
    }, [])

    if (recents.length === 0) return null

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-panel"
            style={{
                padding: '1rem 1.5rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                overflowX: 'auto',
            }}
        >
            <span style={{
                fontSize: '0.8rem', fontWeight: 700,
                color: 'var(--ag-text-secondary)', whiteSpace: 'nowrap',
                textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>Recent:</span>
            {recents.map((r, i) => (
                <motion.div
                    key={i}
                    whileHover={{ scale: 1.05 }}
                    transition={springBounce}
                    style={{
                        padding: '0.4rem 0.9rem',
                        borderRadius: '8px',
                        background: 'var(--ag-input-bg)',
                        border: '1px solid var(--ag-glass-border)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: 'var(--ag-text)',
                        whiteSpace: 'nowrap',
                        cursor: 'default',
                    }}
                >
                    {r.name} → .{r.target}
                </motion.div>
            ))}
        </motion.div>
    )
}

// ============================================
// Main Home Component
// ============================================
export default function Home() {
    const navigate = useNavigate()
    const [file, setFile] = useState(null)
    const [selectedTool, setSelectedTool] = useState(null)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [session, setSession] = useState(null)
    const [files, setFiles] = useState([])
    const [progress, setProgress] = useState(0)
    const [downloadUrl, setDownloadUrl] = useState(null)
    const [isDraggingOver, setIsDraggingOver] = useState(false)
    const [mascotState, setMascotState] = useState('idle')
    // UX enhancement states
    const [searchQuery, setSearchQuery] = useState('')
    const [activeCategory, setActiveCategory] = useState('all')
    const searchRef = useRef(null)
    const smartFileRef = useRef(null)
    const { addToast } = useToast()
    // Smart-Router state
    const [smartFile, setSmartFile] = useState(null)
    const [smartMatches, setSmartMatches] = useState([])

    // Extension-to-tools mapping for Smart Router
    const getSmartMatches = useCallback((fileName) => {
        const ext = fileName.split('.').pop().toLowerCase()
        const extMap = {
            'pdf':  ['pdf-to-word', 'pdf-to-jpg', 'pdf-to-png'],
            'docx': ['docx-to-pdf'],
            'doc':  ['docx-to-pdf'],
            'jpg':  ['jpg-to-png', 'jpg-to-gif', 'image-to-pdf'],
            'jpeg': ['jpg-to-png', 'jpg-to-gif', 'image-to-pdf'],
            'png':  ['png-to-jpg', 'png-to-gif', 'image-to-pdf'],
            'gif':  ['gif-to-jpg', 'gif-to-png'],
            'csv':  ['csv-to-json', 'csv-to-xml', 'csv-to-excel'],
            'json': ['json-to-csv', 'json-to-xml', 'json-to-excel'],
            'xlsx': ['excel-to-csv', 'excel-to-json', 'excel-to-xml'],
            'xls':  ['excel-to-csv', 'excel-to-json', 'excel-to-xml'],
            'xml':  ['xml-to-json', 'xml-to-csv', 'xml-to-excel'],
        }
        const matchIds = extMap[ext] || []
        return tools.filter(t => matchIds.includes(t.id))
    }, [])

    useEffect(() => {
        authService.getSession().then(({ data: { session } }) => setSession(session))
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
        return () => subscription.unsubscribe()
    }, [])

    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e) => {
            // Ctrl+K / Cmd+K → focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault()
                searchRef.current?.focus()
            }
            // Escape → back to grid
            if (e.key === 'Escape') {
                if (selectedTool) handleBackToGrid()
                if (searchQuery) setSearchQuery('')
            }
            // Enter → convert (when tool selected and file ready)
            if (e.key === 'Enter' && selectedTool && (file || files.length >= 2) && !loading && !downloadUrl) {
                if (document.activeElement.tagName !== 'INPUT') {
                    e.preventDefault()
                    handleConvert()
                }
            }
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [selectedTool, file, files, loading, downloadUrl, searchQuery])

    const tools = [
        // Document Tools
        { id: 'pdf-to-word', name: 'PDF to Word', desc: 'Convert your PDF files to editable DOCX documents.', icon: '📄', type: 'pdf', target: 'docx' },
        { id: 'docx-to-pdf', name: 'Word to PDF', desc: 'Convert DOCX files to PDF documents.', icon: '📝', type: 'docx', target: 'pdf' },
        { id: 'image-to-pdf', name: 'Image to PDF', desc: 'Convert JPG, PNG, or GIF images into PDF documents.', icon: '🖼️', type: 'image', target: 'pdf' },
        { id: 'merge-pdf', name: 'Merge PDF', desc: 'Combine multiple PDFs into one unified document.', icon: '🔗', type: 'merge', target: 'pdf' },
        { id: 'pdf-to-jpg', name: 'PDF to JPG', desc: 'Convert PDF pages to JPG images.', icon: 'fz', type: 'pdf', target: 'jpg' },
        { id: 'pdf-to-png', name: 'PDF to PNG', desc: 'Convert PDF pages to PNG images.', icon: 'fz', type: 'pdf', target: 'png' },
        // Image Tools
        { id: 'jpg-to-png', name: 'JPG to PNG', desc: 'Convert JPG images to PNG format.', icon: '📷', type: 'jpg', target: 'png' },
        { id: 'png-to-jpg', name: 'PNG to JPG', desc: 'Convert PNG images to JPG format.', icon: '📸', type: 'png', target: 'jpg' },
        { id: 'jpg-to-gif', name: 'JPG to GIF', desc: 'Convert JPG images to GIF format.', icon: '👾', type: 'jpg', target: 'gif' },
        { id: 'png-to-gif', name: 'PNG to GIF', desc: 'Convert PNG images to GIF format.', icon: '👾', type: 'png', target: 'gif' },
        { id: 'gif-to-jpg', name: 'GIF to JPG', desc: 'Convert GIF images to JPG format.', icon: '📷', type: 'gif', target: 'jpg' },
        { id: 'gif-to-png', name: 'GIF to PNG', desc: 'Convert GIF images to PNG format.', icon: '📸', type: 'gif', target: 'png' },
        // Data Tools
        { id: 'json-to-csv', name: 'JSON to CSV', desc: 'Convert JSON data to CSV.', icon: '📊', type: 'data', target: 'csv' },
        { id: 'csv-to-json', name: 'CSV to JSON', desc: 'Convert CSV rows to JSON.', icon: '📋', type: 'data', target: 'json' },
        { id: 'excel-to-csv', name: 'Excel to CSV', desc: 'Convert XLSX sheets to CSV.', icon: 'x', type: 'data', target: 'csv' },
        { id: 'csv-to-excel', name: 'CSV to Excel', desc: 'Convert CSV to Excel XLSX.', icon: 'x', type: 'data', target: 'xlsx' },
        { id: 'excel-to-json', name: 'Excel to JSON', desc: 'Convert Excel to JSON data.', icon: 'x', type: 'data', target: 'json' },
        { id: 'json-to-excel', name: 'JSON to Excel', desc: 'Convert JSON to Excel XLSX.', icon: 'x', type: 'data', target: 'xlsx' },
        { id: 'xml-to-json', name: 'XML to JSON', desc: 'Convert XML to JSON format.', icon: '📋', type: 'data', target: 'json' },
        { id: 'json-to-xml', name: 'JSON to XML', desc: 'Convert JSON to XML format.', icon: '🧩', type: 'data', target: 'xml' },
        { id: 'xml-to-csv', name: 'XML to CSV', desc: 'Convert XML to CSV format.', icon: '📊', type: 'data', target: 'csv' },
        { id: 'csv-to-xml', name: 'CSV to XML', desc: 'Convert CSV to XML format.', icon: '🧩', type: 'data', target: 'xml' },
        { id: 'xml-to-excel', name: 'XML to Excel', desc: 'Convert XML to Excel XLSX.', icon: 'x', type: 'data', target: 'xlsx' },
        { id: 'excel-to-xml', name: 'Excel to XML', desc: 'Convert Excel to XML format.', icon: '🧩', type: 'data', target: 'xml' },
    ]

    // Filtered tools
    const filteredTools = useMemo(() => {
        let result = tools
        if (activeCategory !== 'all') {
            result = result.filter(t => getCategoryForTool(t) === activeCategory)
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase()
            result = result.filter(t =>
                t.name.toLowerCase().includes(q) ||
                t.desc.toLowerCase().includes(q) ||
                t.type.toLowerCase().includes(q) ||
                t.target.toLowerCase().includes(q)
            )
        }
        return result
    }, [activeCategory, searchQuery])

    const getAcceptTypes = (tool) => {
        if (!tool) return '*'
        if (tool.id === 'merge-pdf') return '.pdf'
        if (tool.type === 'pdf') return '.pdf'
        if (tool.type === 'image') return '.jpg,.jpeg,.png,.gif'
        if (tool.type === 'jpg') return '.jpg,.jpeg'
        if (tool.type === 'png') return '.png'
        if (tool.type === 'gif') return '.gif'
        if (tool.type === 'docx') return '.docx,.doc'
        if (tool.type === 'data') return '.json,.csv,.xlsx,.xls,.xml'
        return '*'
    }

    const handleLogout = async () => {
        await authService.logout()
        addToast('Logged out successfully', 'info')
    }

    const handleFileChange = (e) => {
        setDownloadUrl(null)
        const selectedFile = e.target.files[0]

        const isValidFileType = (file, tool) => {
            if (!file) return false
            const ext = '.' + file.name.split('.').pop().toLowerCase()
            const accept = getAcceptTypes(tool)
            return accept === '*' || accept.includes(ext)
        }

        if (selectedTool?.id === 'merge-pdf') {
            const newFiles = Array.from(e.target.files).filter(f => isValidFileType(f, selectedTool))
            if (newFiles.length < e.target.files.length) {
                addToast('Some files were skipped (not PDF)', 'error')
            }
            setFiles(prev => [...prev, ...newFiles])
            setFile(null)
        } else {
            if (isValidFileType(selectedFile, selectedTool)) {
                setFile(selectedFile)
                setMessage('')
                setMascotState('fileUploaded')
                setTimeout(() => setMascotState('idle'), 2000)
            } else {
                setFile(null)
                addToast(`Invalid file type. Expected a ${selectedTool.type.toUpperCase()} file.`, 'error')
            }
            setFiles([])
        }
        e.target.value = ''
    }

    const handleRemoveFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
    }

    const handleDropboxSelect = (filesInfo) => {
        setDownloadUrl(null)
        // Cloud pickers might pass a single object instead of an array when multiselect is disabled
        const fileArray = Array.isArray(filesInfo) ? filesInfo : [filesInfo]

        if (selectedTool?.id === 'merge-pdf') {
            const newFiles = fileArray.map((f) => ({
                name: f.name,
                url: f.url,
                isCloudUrl: true
            }))
            setFiles(prev => [...prev, ...newFiles])
            setFile(null)
            setMessage('')
        } else {
            const fileInfo = fileArray[0]
            if (fileInfo) {
                setFile({
                    name: fileInfo.name,
                    url: fileInfo.url,
                    isCloudUrl: true
                })
                setMessage('')
                setMascotState('fileUploaded')
                setTimeout(() => setMascotState('idle'), 2000)
            }
            setFiles([])
        }
    }

    const handleToolSelect = (tool) => {
        setSelectedTool(tool)
        setFile(null)
        setMessage('')
        setMascotState('idle')
    }

    const handleBackToGrid = () => {
        setSelectedTool(null)
        setFile(null)
        setFiles([])
        setMessage('')
        setDownloadUrl(null)
        setMascotState('idle')
    }

    // Save to recent conversions
    const saveRecent = useCallback((toolName, target) => {
        try {
            const stored = JSON.parse(localStorage.getItem('xvert-recent') || '[]')
            const updated = [{ name: toolName, target, ts: Date.now() }, ...stored].slice(0, 5)
            localStorage.setItem('xvert-recent', JSON.stringify(updated))
        } catch { /* ignore */ }
    }, [])

    const handleConvert = async () => {
        if (selectedTool.id === 'merge-pdf') {
            if (files.length < 2) {
                addToast('Please select at least 2 PDF files to merge.', 'error')
                return
            }
        } else if (!file) {
            addToast('Please select a file first.', 'error')
            return
        }

        setLoading(true)
        setProgress(0)
        setMessage('')
        setMascotState('converting')

        const progressInterval = setInterval(() => {
            setProgress(prev => prev >= 95 ? prev : prev + 5)
        }, 500)

        const timer = setTimeout(() => {
            addToast('Still processing... complex files need a moment.', 'info')
        }, 5000)

        try {
            let resultBlob

            if (selectedTool.id === 'merge-pdf') {
                resultBlob = await conversionService.mergeDocuments(files)
            } else if (selectedTool.id === 'image-to-pdf') {
                resultBlob = await conversionService.convertDocument(file, 'image', 'pdf')
            } else if (selectedTool.type === 'pdf') {
                resultBlob = await conversionService.convertDocument(file, 'pdf', selectedTool.target)
            } else if (selectedTool.type === 'image' || selectedTool.type === 'jpg' || selectedTool.type === 'png' || selectedTool.type === 'gif') {
                resultBlob = await conversionService.convertImage(file, selectedTool.target)
            } else if (selectedTool.type === 'docx') {
                resultBlob = await conversionService.convertDocument(file, 'docx', 'pdf')
            } else if (selectedTool.type === 'data') {
                resultBlob = await conversionService.convertData(file, selectedTool.target)
            } else {
                clearInterval(progressInterval)
                clearTimeout(timer)
                addToast('This tool is currently unavailable.', 'error')
                setLoading(false)
                setProgress(0)
                setMascotState('error')
                return
            }

            clearInterval(progressInterval)
            setProgress(100)

            setTimeout(() => {
                const url = window.URL.createObjectURL(new Blob([resultBlob]))
                clearTimeout(timer)
                setDownloadUrl(url)
                setLoading(false)
                setMascotState('success')
                addToast('Conversion successful! 🎉', 'success')
                saveRecent(selectedTool.name, selectedTool.target)
                setTimeout(() => {
                    setProgress(0)
                    setMascotState('idle')
                }, 3000)
            }, 800)

        } catch (error) {
            console.error(error)
            clearInterval(progressInterval)
            clearTimeout(timer)
            let errMsg = 'Conversion failed. Please try again.';
            if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                errMsg = 'Conversion timed out. File may be too large.';
            } else {
                const detail = await (error.response?.data instanceof Blob ? error.response.data.text() : null);
                if (detail) {
                    try { 
                        errMsg = JSON.parse(detail).detail || detail; 
                    } catch(e) { 
                        errMsg = detail; 
                    }
                } else if (error.message) {
                    errMsg = error.message;
                }
            }
            addToast(errMsg, 'error')
            setProgress(0)
            setLoading(false)
            setMascotState('error')
            setTimeout(() => setMascotState('idle'), 3000)
        }
    }

    return (
        <AntiGravityBackground>
            {/* Navbar */}
            <Navbar
                tools={tools}
                onToolSelect={handleToolSelect}
                onReset={handleBackToGrid}
                session={session}
                UserAvatarComponent={
                    <UserAvatar session={session} onLogout={handleLogout} />
                }
            />

            <main style={{ padding: '2rem 2rem 4rem', maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>

                {/* View: Tool Selection Grid */}
                {!selectedTool && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        style={{ textAlign: 'center' }}
                    >
                        {/* Hero section with astronaut */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '2rem',
                            marginBottom: '1rem',
                            flexWrap: 'wrap',
                        }}>
                            <motion.div
                                animate={{ y: [0, -12, 0] }}
                                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                                style={{
                                    width: '200px', height: '200px', flexShrink: 0,
                                    borderRadius: '24px',
                                    background: 'linear-gradient(135deg, #1e1040 0%, #2d1b69 60%, #3b1f8e 100%)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    overflow: 'hidden',
                                    boxShadow: '0 12px 40px rgba(124,58,237,0.25)',
                                }}
                            >
                                <img
                                    src="/illustrations/home_hero.png"
                                    alt="Astronaut juggling file types"
                                    style={{ width: '90%', height: 'auto', mixBlendMode: 'screen', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}
                                />
                            </motion.div>
                            <motion.div
                                animate={{ y: [0, -12, 0] }}
                                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                <h2 style={{
                                    fontFamily: '"Outfit", sans-serif',
                                    fontSize: '2.4rem',
                                    fontWeight: 700,
                                    color: 'var(--ag-text)',
                                    marginBottom: '0.5rem',
                                    letterSpacing: '-0.5px',
                                    lineHeight: 1.2,
                                }}>
                                    {session?.user?.user_metadata?.full_name
                                        ? `Hi ${session.user.user_metadata.full_name.split(' ')[0]}, let's convert`
                                        : 'Convert Any File'
                                    }
                                </h2>
                                <p style={{
                                    fontSize: '1.1rem',
                                    fontWeight: 500,
                                    color: 'var(--ag-text-secondary)',
                                    maxWidth: '500px',
                                    lineHeight: 1.6,
                                }}>
                                    The only toolkit you'll ever need — from documents to media — free and in a few clicks.
                                </p>
                            </motion.div>
                        </div>

                        {/* Recent Conversions Widget */}
                        <RecentConversions />

                        {/* ===== SMART ROUTER ===== */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                            className="glass-panel"
                            style={{
                                padding: '1.5rem 2rem',
                                marginBottom: '2rem',
                                position: 'relative',
                                overflow: 'hidden',
                            }}
                        >
                            {/* Gradient accent bar */}
                            <div style={{
                                position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                                background: 'linear-gradient(90deg, var(--ag-accent), #06b6d4, #a855f7)',
                            }} />

                            <AnimatePresence mode="wait">
                                {!smartFile ? (
                                    /* Drop Zone */
                                    <motion.div
                                        key="dropzone"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
                                            <Sparkles size={18} color="var(--ag-accent)" />
                                            <span style={{
                                                fontFamily: '"Outfit", sans-serif', fontWeight: 700,
                                                fontSize: '1rem', color: 'var(--ag-text)',
                                            }}>Smart Router</span>
                                            <span style={{
                                                fontSize: '0.75rem', color: 'var(--ag-text-secondary)',
                                                padding: '2px 8px', borderRadius: '6px',
                                                background: 'var(--ag-input-bg)', fontWeight: 600,
                                            }}>NEW</span>
                                        </div>
                                        <p style={{
                                            fontSize: '0.85rem', color: 'var(--ag-text-secondary)',
                                            marginBottom: '1rem', lineHeight: 1.5,
                                        }}>
                                            Drop any file — we'll detect its type and show you what it can become.
                                        </p>
                                        <motion.label
                                            whileHover={{ scale: 1.01, borderColor: 'var(--ag-accent)' }}
                                            whileTap={{ scale: 0.99 }}
                                            style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                gap: '0.75rem', padding: '1.2rem',
                                                borderRadius: '14px',
                                                border: '2px dashed var(--ag-glass-border)',
                                                background: 'var(--ag-input-bg)',
                                                cursor: 'pointer',
                                                transition: 'border-color 0.3s',
                                            }}
                                            onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--ag-accent)' }}
                                            onDragLeave={(e) => { e.currentTarget.style.borderColor = 'var(--ag-glass-border)' }}
                                            onDrop={(e) => {
                                                e.preventDefault()
                                                e.currentTarget.style.borderColor = 'var(--ag-glass-border)'
                                                const droppedFile = e.dataTransfer.files[0]
                                                if (droppedFile) {
                                                    const matches = getSmartMatches(droppedFile.name)
                                                    if (matches.length === 0) {
                                                        addToast('Unsupported file type', 'error')
                                                        return
                                                    }
                                                    setSmartFile(droppedFile)
                                                    setSmartMatches(matches)
                                                }
                                            }}
                                        >
                                            <Upload size={20} color="var(--ag-text-secondary)" />
                                            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--ag-text-secondary)' }}>
                                                Drop a file here or click to browse
                                            </span>
                                            <input
                                                ref={smartFileRef}
                                                type="file"
                                                style={{ display: 'none' }}
                                                onChange={(e) => {
                                                    const f = e.target.files[0]
                                                    if (f) {
                                                        const matches = getSmartMatches(f.name)
                                                        if (matches.length === 0) {
                                                            addToast('Unsupported file type', 'error')
                                                            return
                                                        }
                                                        setSmartFile(f)
                                                        setSmartMatches(matches)
                                                    }
                                                }}
                                            />
                                        </motion.label>
                                    </motion.div>
                                ) : (
                                    /* Format Suggestions */
                                    <motion.div
                                        key="suggestions"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                                                    <Sparkles size={16} color="var(--ag-accent)" />
                                                    <span style={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, fontSize: '0.95rem', color: 'var(--ag-text)' }}>
                                                        {smartFile.name}
                                                    </span>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--ag-text-secondary)' }}>
                                                        ({(smartFile.size / 1024).toFixed(1)} KB)
                                                    </span>
                                                </div>
                                                <p style={{ fontSize: '0.8rem', color: 'var(--ag-text-secondary)', margin: 0 }}>
                                                    {smartMatches.length} format{smartMatches.length !== 1 ? 's' : ''} available — pick one to convert
                                                </p>
                                            </div>
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => { setSmartFile(null); setSmartMatches([]); if (smartFileRef.current) smartFileRef.current.value = '' }}
                                                style={{
                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                    color: 'var(--ag-text-secondary)', display: 'flex', padding: '4px',
                                                }}
                                            >
                                                <X size={18} />
                                            </motion.button>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                            {smartMatches.map((tool, i) => (
                                                <motion.button
                                                    key={tool.id}
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: i * 0.05, ...springBounce }}
                                                    whileHover={{ scale: 1.05, boxShadow: '0 6px 20px var(--ag-accent-glow)' }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => {
                                                        setSelectedTool(tool)
                                                        setFile(smartFile)
                                                        setSmartFile(null)
                                                        setSmartMatches([])
                                                        if (smartFileRef.current) smartFileRef.current.value = ''
                                                    }}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '0.6rem',
                                                        padding: '0.7rem 1.2rem',
                                                        borderRadius: '12px',
                                                        background: 'var(--ag-card-bg)',
                                                        border: '1px solid var(--ag-card-border)',
                                                        cursor: 'pointer',
                                                        fontFamily: '"Nunito", sans-serif',
                                                        fontSize: '0.85rem',
                                                        fontWeight: 600,
                                                        color: 'var(--ag-text)',
                                                        backdropFilter: 'blur(8px)',
                                                        transition: 'border-color 0.2s',
                                                    }}
                                                >
                                                    <ToolIcon tool={tool} />
                                                    <span>.{tool.target.toUpperCase()}</span>
                                                    <ArrowRight size={14} color="var(--ag-accent)" />
                                                </motion.button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        {/* Search/Filter Bar */}
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="glass-panel"
                            style={{
                                padding: '0.6rem 1rem',
                                marginBottom: '1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                            }}
                        >
                            <Search size={18} color="var(--ag-text-secondary)" style={{ flexShrink: 0 }} />
                            <input
                                ref={searchRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search tools... (Ctrl+K)"
                                style={{
                                    flex: 1,
                                    background: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    color: 'var(--ag-text)',
                                    fontSize: '0.95rem',
                                    fontFamily: '"Nunito", sans-serif',
                                }}
                            />
                            {searchQuery && (
                                <motion.button
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    onClick={() => setSearchQuery('')}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'var(--ag-text-secondary)',
                                        display: 'flex', padding: '4px',
                                    }}
                                >
                                    <X size={16} />
                                </motion.button>
                            )}
                            {/* Keyboard shortcut hint */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '2px',
                                padding: '2px 6px', borderRadius: '4px',
                                border: '1px solid var(--ag-glass-border)',
                                fontSize: '0.65rem', color: 'var(--ag-text-secondary)',
                                fontWeight: 700, flexShrink: 0,
                            }}>
                                <Command size={10} /> K
                            </div>
                        </motion.div>

                        {/* Category Tab Pills */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                gap: '0.6rem',
                                marginBottom: '1.5rem',
                                flexWrap: 'wrap',
                            }}
                        >
                            {CATEGORIES.map(cat => {
                                const Icon = cat.icon
                                const isActive = activeCategory === cat.id
                                return (
                                    <motion.button
                                        key={cat.id}
                                        onClick={() => setActiveCategory(cat.id)}
                                        whileHover={{ scale: 1.06 }}
                                        whileTap={{ scale: 0.95 }}
                                        transition={springBounce}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            padding: '0.5rem 1.1rem',
                                            borderRadius: '50px',
                                            border: isActive ? '1.5px solid var(--ag-accent)' : '1px solid var(--ag-glass-border)',
                                            background: isActive ? 'var(--ag-btn-primary)' : 'var(--ag-card-bg)',
                                            backdropFilter: 'blur(8px)',
                                            color: isActive ? '#fff' : 'var(--ag-text)',
                                            fontSize: '0.85rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            fontFamily: '"Nunito", sans-serif',
                                            boxShadow: isActive ? '0 4px 15px var(--ag-accent-glow)' : 'none',
                                            transition: 'box-shadow 0.3s',
                                        }}
                                    >
                                        <Icon size={14} /> {cat.label}
                                    </motion.button>
                                )
                            })}
                        </motion.div>

                        {/* Tool Grid */}
                        <motion.div
                            variants={gridContainer}
                            initial="hidden"
                            animate="show"
                            key={activeCategory + searchQuery} // Re-animate on filter change
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                                gap: '1.2rem',
                                padding: '1rem 0',
                            }}
                        >
                            {filteredTools.length > 0 ? (
                                filteredTools.map(tool => (
                                    <motion.div
                                        key={tool.id}
                                        variants={gridItem}
                                        onClick={() => handleToolSelect(tool)}
                                        className="ag-card"
                                        whileHover={{
                                            scale: 1.04,
                                            y: -8,
                                            transition: springBounce
                                        }}
                                        whileTap={{ scale: 0.97 }}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'flex-start',
                                            textAlign: 'left',
                                        }}
                                    >
                                        <div style={{
                                            marginBottom: '0.8rem',
                                            height: '64px',
                                            display: 'flex',
                                            alignItems: 'center',
                                        }}>
                                            <ToolIcon tool={tool} />
                                        </div>
                                        <h3 style={{
                                            fontFamily: '"Outfit", sans-serif',
                                            color: 'var(--ag-text)',
                                            marginBottom: '0.4rem',
                                            fontSize: '1.15rem',
                                            fontWeight: 600,
                                        }}>{tool.name}</h3>
                                        <p style={{
                                            color: 'var(--ag-text-secondary)',
                                            fontSize: '0.88rem',
                                            lineHeight: 1.5,
                                            margin: 0,
                                        }}>{tool.desc}</p>
                                    </motion.div>
                                ))
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    style={{
                                        gridColumn: '1 / -1',
                                        textAlign: 'center',
                                        padding: '3rem 1rem',
                                        color: 'var(--ag-text-secondary)',
                                    }}
                                >
                                    <div style={{
                                        width: '150px', height: '150px', margin: '0 auto 0.75rem',
                                        borderRadius: '20px',
                                        background: 'linear-gradient(135deg, #1e1040, #2d1b69)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        overflow: 'hidden',
                                        boxShadow: '0 8px 25px rgba(124,58,237,0.2)',
                                    }}>
                                        <img src="/illustrations/404.png" alt="Not found" style={{ width: '85%', height: 'auto', mixBlendMode: 'screen' }} />
                                    </div>
                                    <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>No tools match "{searchQuery}"</p>
                                    <p style={{ fontSize: '0.85rem' }}>Try a different search term or category</p>
                                </motion.div>
                            )}
                        </motion.div>
                    </motion.div>
                )}

                {/* View: Selected Tool Interface */}
                <AnimatePresence>
                    {selectedTool && (
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={springGentle}
                            style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}
                        >
                            {/* Back button */}
                            <motion.div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                                <motion.span
                                    role="button"
                                    tabIndex={0}
                                    onClick={handleBackToGrid}
                                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleBackToGrid()}
                                    whileHover={{ x: -5 }}
                                    transition={springBounce}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '0.5rem 0',
                                        color: 'var(--ag-text)',
                                        cursor: 'pointer',
                                        fontSize: '1.1rem',
                                        fontWeight: 700,
                                        border: 'none',
                                        background: 'transparent',
                                        userSelect: 'none',
                                        fontFamily: '"Outfit", sans-serif',
                                    }}
                                >
                                    ← Home
                                    <span style={{
                                        fontSize: '0.7rem',
                                        color: 'var(--ag-text-secondary)',
                                        fontWeight: 500,
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        border: '1px solid var(--ag-glass-border)',
                                    }}>ESC</span>
                                </motion.span>
                            </motion.div>

                            {/* Floating conversion card */}
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                                className="glass-panel"
                                style={{ padding: '2.5rem', position: 'relative' }}
                            >
                                <motion.div
                                    animate={{ y: [0, -8, 0], rotate: [0, 3, -3, 0] }}
                                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                                    style={{
                                        position: 'absolute',
                                        top: '-40px',
                                        right: '20px',
                                        width: '110px', height: '110px',
                                        borderRadius: '20px',
                                        background: 'linear-gradient(135deg, #1e1040, #2d1b69)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        overflow: 'hidden',
                                        boxShadow: '0 8px 25px rgba(124,58,237,0.25)',
                                    }}
                                >
                                    <img
                                        src="/illustrations/conversion.png"
                                        alt="Astronaut converting"
                                        style={{ width: '90%', height: 'auto', mixBlendMode: 'screen' }}
                                    />
                                </motion.div>

                                {/* Tool Icon */}
                                <div style={{ marginBottom: '1.2rem', display: 'flex', justifyContent: 'center' }}>
                                    <motion.div
                                        style={{ transform: 'scale(1.5)' }}
                                        animate={{ rotate: [0, 2, -2, 0] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                                    >
                                        <ToolIcon tool={selectedTool} />
                                    </motion.div>
                                </div>

                                <h2 style={{
                                    fontFamily: '"Outfit", sans-serif',
                                    fontSize: '1.8rem',
                                    color: 'var(--ag-text)',
                                    marginBottom: '0.5rem',
                                    fontWeight: 700,
                                }}>{selectedTool.name}</h2>
                                <p style={{
                                    color: 'var(--ag-text-secondary)',
                                    marginBottom: '2rem',
                                    fontSize: '0.95rem',
                                }}>{selectedTool.desc}</p>

                                {/* Orbital Progress (when converting) */}
                                {loading && (
                                    <OrbitalProgress progress={progress} />
                                )}

                                {/* Drag & Drop Zone */}
                                {!loading && (
                                    <motion.div
                                        animate={isDraggingOver ? {
                                            scale: 1.05,
                                            borderColor: 'var(--ag-accent)',
                                            boxShadow: '0 0 40px var(--ag-accent-glow)',
                                        } : {
                                            scale: 1,
                                            borderColor: 'var(--ag-dropzone-border)',
                                            boxShadow: '0 0 0px transparent',
                                        }}
                                        transition={springBounce}
                                        onDragOver={(e) => {
                                            e.preventDefault()
                                            setIsDraggingOver(true)
                                        }}
                                        onDragLeave={() => setIsDraggingOver(false)}
                                        onDrop={(e) => {
                                            e.preventDefault()
                                            setIsDraggingOver(false)
                                            const dt = e.dataTransfer
                                            if (dt.files.length) {
                                                const fakeEvent = { target: { files: dt.files, value: '' } }
                                                handleFileChange(fakeEvent)
                                            }
                                        }}
                                        style={{
                                            border: '2px dashed var(--ag-dropzone-border)',
                                            borderRadius: '16px',
                                            padding: '2.5rem 2rem',
                                            backgroundColor: 'var(--ag-dropzone-bg)',
                                            position: 'relative',
                                            maxWidth: '500px',
                                            margin: '0 auto 2rem',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <input
                                            type="file"
                                            accept={getAcceptTypes(selectedTool)}
                                            onChange={handleFileChange}
                                            multiple={selectedTool.id === 'merge-pdf'}
                                            style={{
                                                position: 'absolute',
                                                top: 0, left: 0, width: '100%', height: '100%',
                                                opacity: 0, cursor: 'pointer', zIndex: 5,
                                            }}
                                        />
                                        {selectedTool.id === 'merge-pdf' && files.length > 0 ? (
                                            <div style={{
                                                maxHeight: '200px', overflowY: 'auto', width: '100%',
                                                textAlign: 'left', position: 'relative', zIndex: 10,
                                                pointerEvents: 'none',
                                            }}>
                                                <p style={{ fontWeight: 700, color: 'var(--ag-text)', textAlign: 'center', marginBottom: '0.8rem' }}>
                                                    {files.length} files selected
                                                </p>
                                                {files.map((f, index) => (
                                                    <div key={index} style={{
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                        background: 'var(--ag-card-bg)', backdropFilter: 'blur(8px)',
                                                        padding: '0.5rem 0.75rem', marginBottom: '0.4rem', borderRadius: '8px',
                                                        border: '1px solid var(--ag-card-border)', pointerEvents: 'auto',
                                                    }}>
                                                        <span style={{ fontSize: '0.85rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: '85%', color: 'var(--ag-text)' }}>{f.name}</span>
                                                        <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleRemoveFile(index) }}
                                                            style={{ background: 'none', border: 'none', color: 'var(--ag-error)', cursor: 'pointer', fontWeight: 'bold', padding: '0 0.5rem', fontSize: '1rem' }}>✕</button>
                                                    </div>
                                                ))}
                                                <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--ag-text-secondary)' }}>
                                                    Click box to add more files
                                                </div>
                                            </div>
                                        ) : file ? (
                                            <FilePreview file={file} />
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', paddingTop: '0.5rem' }}>
                                                {/* Select File Button - Large and Prominent */}
                                                <motion.div
                                                    whileHover={{ scale: 1.06, boxShadow: '0 8px 30px var(--ag-accent-glow)' }}
                                                    whileTap={{ scale: 0.98 }}
                                                    transition={springBounce}
                                                    style={{
                                                        background: 'var(--ag-btn-primary)',
                                                        color: 'var(--ag-btn-primary-text)',
                                                        padding: '1rem 3rem',
                                                        borderRadius: '60px',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontWeight: 700,
                                                        boxShadow: '0 6px 25px var(--ag-accent-glow)',
                                                        fontSize: '1.05rem',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease',
                                                    }}
                                                >
                                                    Select {selectedTool.type === 'image' ? 'Image' : selectedTool.id === 'merge-pdf' ? 'PDFs' : 'File'}
                                                </motion.div>

                                                {/* Cloud Storage Icons - Below Button */}
                                                <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10 }} onClick={(e) => e.stopPropagation()}>
                                                    {/* Divider Above Icons */}
                                                    <div style={{ width: '60px', height: '2px', background: 'linear-gradient(90deg, transparent, var(--ag-glass-border))', opacity: 0.4 }} />
                                                    
                                                    <DropboxPicker
                                                        onFileSelected={handleDropboxSelect}
                                                        acceptTypes={getAcceptTypes(selectedTool)}
                                                        multiselect={selectedTool.id === 'merge-pdf'}
                                                    />
                                                    <GoogleDrivePicker
                                                        onFileSelected={handleFileChange}
                                                        acceptTypes={getAcceptTypes(selectedTool)}
                                                        multiselect={selectedTool.id === 'merge-pdf'}
                                                    />
                                                    <OneDrivePicker
                                                        onFileSelected={handleDropboxSelect}
                                                        acceptTypes={getAcceptTypes(selectedTool)}
                                                        multiselect={selectedTool.id === 'merge-pdf'}
                                                    />
                                                    
                                                    <div style={{ width: '60px', height: '2px', background: 'linear-gradient(90deg, var(--ag-glass-border), transparent)', opacity: 0.4 }} />
                                                </div>

                                                <p style={{ color: 'var(--ag-text-secondary)', fontSize: '0.85rem', margin: 0 }}>or drag & drop file here</p>
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {/* Action Buttons */}
                                {downloadUrl ? (
                                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                                        <motion.button
                                            onClick={() => {
                                                const link = document.createElement('a')
                                                link.href = downloadUrl
                                                link.setAttribute('download', `converted_${selectedTool.target === 'pdf' ? 'document' : (files.length > 0 ? 'merged' : file.name?.split('.')[0])}.${selectedTool.target}`)
                                                document.body.appendChild(link)
                                                link.click()
                                                link.remove()
                                            }}
                                            className="ag-btn-primary"
                                            whileHover={{ scale: 1.06 }}
                                            whileTap={{ scale: 0.95 }}
                                            transition={springBounce}
                                            initial={{ scale: 0.9, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            style={{ display: 'block', minWidth: '180px' }}
                                        >
                                            ↓ Download Local
                                        </motion.button>
                                        <GoogleDriveSaver 
                                            downloadUrl={downloadUrl} 
                                            filename={`converted_${selectedTool.target === 'pdf' ? 'document' : (files.length > 0 ? 'merged' : file.name?.split('.')[0])}.${selectedTool.target}`} 
                                        />
                                    </div>
                                ) : (
                                    <motion.button
                                        onClick={handleConvert}
                                        disabled={loading || (!file && files.length < 2)}
                                        className="ag-btn-primary"
                                        whileHover={!(loading || (!file && files.length < 2)) ? { scale: 1.06 } : {}}
                                        whileTap={!(loading || (!file && files.length < 2)) ? { scale: 0.95 } : {}}
                                        transition={springBounce}
                                        style={{
                                            display: 'block',
                                            margin: '0 auto',
                                            minWidth: '200px',
                                            position: 'relative',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        {loading && (
                                            <motion.div
                                                initial={{ width: '0%' }}
                                                animate={{ width: `${progress}%` }}
                                                style={{
                                                    position: 'absolute', top: 0, left: 0, height: '100%',
                                                    background: 'rgba(255,255,255,0.2)', borderRadius: '50px', zIndex: 0,
                                                }}
                                                transition={{ ease: 'easeInOut', duration: 0.3 }}
                                            />
                                        )}
                                        <span style={{ position: 'relative', zIndex: 1 }}>
                                            {loading ? `Converting... ${progress}%` : 'Convert'}
                                        </span>
                                        {!loading && (file || files.length >= 2) && (
                                            <span style={{
                                                marginLeft: '0.5rem',
                                                fontSize: '0.7rem',
                                                opacity: 0.7,
                                                padding: '1px 5px',
                                                borderRadius: '3px',
                                                border: '1px solid rgba(255,255,255,0.3)',
                                            }}>↵</span>
                                        )}
                                    </motion.button>
                                )}

                                {/* Message */}
                                <AnimatePresence>
                                    {message && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={springGentle}
                                            style={{
                                                marginTop: '1.5rem',
                                                padding: '1rem',
                                                borderRadius: '12px',
                                                background: message.includes('failed') || message.includes('Invalid')
                                                    ? 'rgba(255, 82, 82, 0.12)'
                                                    : message.includes('successful')
                                                        ? 'rgba(0, 230, 118, 0.12)'
                                                        : 'var(--ag-card-bg)',
                                                border: '1px solid',
                                                borderColor: message.includes('failed') || message.includes('Invalid')
                                                    ? 'rgba(255, 82, 82, 0.3)'
                                                    : message.includes('successful')
                                                        ? 'rgba(0, 230, 118, 0.3)'
                                                        : 'var(--ag-card-border)',
                                                color: message.includes('failed') || message.includes('Invalid')
                                                    ? 'var(--ag-error)'
                                                    : message.includes('successful')
                                                        ? 'var(--ag-success)'
                                                        : 'var(--ag-text)',
                                                fontWeight: 500,
                                                backdropFilter: 'blur(8px)',
                                            }}
                                        >
                                            {message}
                                            {message.includes('failed') && (
                                                <motion.button
                                                    onClick={handleConvert}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    transition={springBounce}
                                                    style={{
                                                        marginTop: '0.5rem',
                                                        background: 'var(--ag-error)',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '0.5rem 1.5rem',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        fontWeight: 700,
                                                        fontSize: '0.85rem',
                                                        display: 'block',
                                                        marginLeft: 'auto',
                                                        marginRight: 'auto',
                                                    }}
                                                >
                                                    ↻ Retry
                                                </motion.button>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </AntiGravityBackground>
    )
}
