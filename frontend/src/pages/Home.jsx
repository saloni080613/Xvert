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
import RemoteFetch from '../components/RemoteFetch'
import { useToast } from '../components/ToastContext'
import { useBatchUpload } from '../hooks/useBatchUpload'
import DropboxSaver from '../components/DropboxSaver'
import GoogleDriveSaver from '../components/GoogleDriveSaver'
import ProgressCard from '../components/ProgressCard'
import OcrResultPanel from '../components/OcrResultPanel'
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
    if (['pdf', 'docx', 'merge', 'image', 'ocr'].includes(tool.type)) return 'document'
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
            if (file.isCloudUrl || file.isRemote) {
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
        <div style={{
            position: 'relative',
            width: '140px',
            height: '140px',
            margin: '0 auto 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <svg width="140" height="140" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--ag-glass-border)" strokeWidth="6" opacity="0.2" />
                <motion.circle
                    cx={cx} cy={cy} r={r} fill="none"
                    stroke="var(--ag-accent)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 0.6, ease: 'easeInOut' }}
                    style={{ filter: 'drop-shadow(0 0 8px var(--ag-accent-glow))' }}
                />
                {/* Orbiting dot */}
                {progress > 0 && progress < 100 && (
                    <motion.circle
                        cx={cx + r} cy={cy} r="5"
                        fill="var(--ag-accent)"
                        style={{ filter: 'drop-shadow(0 0 10px var(--ag-accent))', zIndex: 5 }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                        transformOrigin={`${cx}px ${cy}px`}
                    />
                )}
            </svg>
            <div style={{
                position: 'absolute',
                fontWeight: 800,
                fontSize: '1.8rem',
                color: 'var(--ag-text)',
                fontFamily: '"Outfit", sans-serif',
                textAlign: 'center',
                letterSpacing: '-1px',
            }}>
                {progress}%
            </div>
        </div>
    )
}

// ---- Conversion Success Header (Overlapping Icons + Text) ----
function ConversionHeader({ tool }) {
    if (!tool) return null;
    return (
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            {/* Overlapping Icons section */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: '2.5rem',
                position: 'relative',
                height: '110px',
            }}>
                <div style={{ position: 'relative', width: '160px', height: '100px' }}>
                    {/* Background Icon (Source) */}
                    <div style={{
                        position: 'absolute',
                        left: '0',
                        top: '0',
                        zIndex: 1,
                        opacity: 0.85,
                    }}>
                        <ToolIcon
                            tool={{ ...tool, id: 'src' }}
                            simple={true}
                            iconSize={72}
                        />
                    </div>

                    {/* Foreground Icon (Target) */}
                    <div style={{
                        position: 'absolute',
                        right: '0',
                        bottom: '0',
                        zIndex: 3,
                        backgroundColor: '#fff',
                        borderRadius: '12px',
                        padding: '4px',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                        border: '1px solid var(--ag-glass-border)',
                    }}>
                        <ToolIcon
                            tool={{ ...tool, id: 'tgt', type: tool.target }}
                            simple={true}
                            iconSize={68}
                        />
                    </div>

                    {/* Arrow Circle - Subtle and clean */}
                    <div style={{
                        position: 'absolute',
                        top: '40%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: '#fff',
                        borderRadius: '50%',
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 6px 15px rgba(0,0,0,0.12)',
                        zIndex: 4,
                        border: '1.5px solid var(--ag-glass-border)',
                    }}>
                        <ArrowRight size={20} color="var(--ag-accent)" />
                    </div>
                </div>
            </div>

            {/* Title & Description section */}
            <h2 style={{
                fontFamily: '"Outfit", sans-serif',
                fontSize: '2.8rem',
                fontWeight: 800,
                color: 'var(--ag-text)',
                marginBottom: '1rem',
                letterSpacing: '-1.2px',
                lineHeight: 1,
            }}>{tool.name}</h2>
            <p style={{
                color: 'var(--ag-text-secondary)',
                fontSize: '1.15rem',
                fontWeight: 500,
                maxWidth: '550px',
                margin: '0 auto',
                lineHeight: 1.6,
                opacity: 0.8,
            }}>{tool.desc}</p>
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

export default function Home() {
    const navigate = useNavigate()
    const [selectedTool, setSelectedTool] = useState(null)
    const [message, setMessage] = useState('')
    const [session, setSession] = useState(null)
    const [isDraggingOver, setIsDraggingOver] = useState(false)
    const [mascotState, setMascotState] = useState('idle')
    const { fileStates, batchStatus, startBatch, reset: resetBatch } = useBatchUpload()
    const [pendingFiles, setPendingFiles] = useState([])
    const [remoteUrl, setRemoteUrl] = useState('')
    const [downloadUrl, setDownloadUrl] = useState(null)
    const file = pendingFiles[0] || null
    const files = pendingFiles
    const setFile = (f) => setPendingFiles(f ? [f] : [])
    const setFiles = (f) => setPendingFiles(f)
    const [resultBlob, setResultBlob] = useState(null)
    const resultUrl = useMemo(() => resultBlob ? URL.createObjectURL(resultBlob) : null, [resultBlob])
    const [extractedText, setExtractedText] = useState(null)
    const [ocrDone, setOcrDone] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [processingProgress, setProcessingProgress] = useState(0)

    // Advanced Settings States
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [privacyMode, setPrivacyMode] = useState(false)
    const [targetWidth, setTargetWidth] = useState('')
    const [targetHeight, setTargetHeight] = useState('')
    const [quality, setQuality] = useState(95)
    const [compressPdf, setCompressPdf] = useState(false)
    const [pageRange, setPageRange] = useState('')

    const isTweaking = useMemo(() => {
        return privacyMode || targetWidth !== '' || targetHeight !== '' || quality !== 95 || compressPdf || pageRange !== ''
    }, [privacyMode, targetWidth, targetHeight, quality, compressPdf, pageRange])

    const isConverting = ['uploading', 'processing'].includes(batchStatus) || isProcessing
    const isDone = batchStatus === 'done' || (resultBlob && !isProcessing && !['uploading', 'processing'].includes(batchStatus))
    const fileStatesValues = Object.values(fileStates)
    const overallProgress = isProcessing
        ? processingProgress
        : ((resultBlob && !isProcessing)
            ? 100
            : (fileStatesValues.length > 0
                ? Math.round(fileStatesValues.reduce((s, f) => s + (f.progress ?? 0), 0) / fileStatesValues.length)
                : 0))

    const isSameFormat = useMemo(() => {
        if (!selectedTool || !file) return false
        const sourceExt = file.name?.split('.').pop()?.toLowerCase() || ''
        const targetExt = selectedTool.target?.toLowerCase() || ''
        return sourceExt === targetExt || (sourceExt === 'jpg' && targetExt === 'jpeg') || (sourceExt === 'jpeg' && targetExt === 'jpg')
    }, [selectedTool, file])

    const canConvert = (pendingFiles.length > 0 || (remoteUrl && remoteUrl.trim() !== '')) &&
        (selectedTool?.id !== 'merge-pdf' || (pendingFiles.length >= 2 || (remoteUrl && remoteUrl.trim() !== '' && pendingFiles.length >= 1))) &&
        (!isSameFormat || isTweaking)
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
            'pdf': ['pdf-to-word', 'pdf-to-jpg', 'pdf-to-png'],
            'docx': ['docx-to-pdf'],
            'doc': ['docx-to-pdf'],
            'jpg': ['jpg-to-png', 'jpg-to-gif', 'image-to-pdf'],
            'jpeg': ['jpg-to-png', 'jpg-to-gif', 'image-to-pdf'],
            'png': ['png-to-jpg', 'png-to-gif', 'image-to-pdf'],
            'gif': ['gif-to-jpg', 'gif-to-png'],
            'csv': ['csv-to-json', 'csv-to-xml', 'csv-to-excel'],
            'json': ['json-to-csv', 'json-to-xml', 'json-to-excel'],
            'xlsx': ['excel-to-csv', 'excel-to-json', 'excel-to-xml'],
            'xls': ['excel-to-csv', 'excel-to-json', 'excel-to-xml'],
            'xml': ['xml-to-json', 'xml-to-csv', 'xml-to-excel'],
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
            if (e.key === 'Enter' && selectedTool && canConvert && !isConverting && !isDone) {
                if (document.activeElement.tagName !== 'INPUT') {
                    e.preventDefault()
                    handleConvert()
                }
            }
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [selectedTool, canConvert, isConverting, isDone, searchQuery])



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
        if (tool.type === 'ocr') return '.pdf,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.webp'
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
        resetBatch()
        const selectedFiles = Array.from(e.target.files)

        const isValidFileType = (file, tool) => {
            if (!file) return false
            const ext = '.' + file.name.split('.').pop().toLowerCase()
            const accept = getAcceptTypes(tool)
            return accept === '*' || accept.includes(ext)
        }

        const validFiles = selectedFiles.filter(f => isValidFileType(f, selectedTool))
        if (validFiles.length < selectedFiles.length) {
            addToast(
                `${selectedFiles.length - validFiles.length} file(s) skipped — wrong type`,
                'error'
            )
        }

        if (validFiles.length > 0) {
            setPendingFiles(prev =>
                selectedTool?.id === 'merge-pdf'
                    ? [...prev, ...validFiles]   // accumulate for merge
                    : validFiles                 // replace for all other tools
            )
            setMascotState('fileUploaded')
            setTimeout(() => setMascotState('idle'), 2000)
        }
        e.target.value = ''
    }

    const handleRemoveFile = (index) => {
        setPendingFiles(prev => prev.filter((_, i) => i !== index))
    }

    const handleDropboxSelect = (filesInfo) => {
        setDownloadUrl(null)
        // Cloud pickers might pass a single object instead of an array when multiselect is disabled
        const fileArray = Array.isArray(filesInfo) ? filesInfo : [filesInfo]

        if (selectedTool?.id === 'merge-pdf') {
            const newFiles = fileArray.map((f) => ({
                name: f.name,
                url: f.url,
                isRemote: true
            }))
            setPendingFiles(prev => [...prev, ...newFiles])
            setMessage('')
        } else {
            const fileInfo = fileArray[0]
            if (fileInfo) {
                setFile({
                    name: fileInfo.name,
                    url: fileInfo.link || fileInfo.url, // Dropbox uses .link
                    isRemote: true
                })
                setMessage('')
                setMascotState('fileUploaded')
                setTimeout(() => setMascotState('idle'), 2000)
            }
        }
    }

    const handleRemoteUrlSelected = (remoteFileInfo) => {
        setDownloadUrl(null)
        if (selectedTool?.id === 'merge-pdf') {
            setFiles(prev => [...prev, remoteFileInfo])
            setFile(null)
        } else {
            setFile(remoteFileInfo)
            setFiles([])
            setMessage('')
            setMascotState('fileUploaded')
            setTimeout(() => setMascotState('idle'), 2000)
        }
    }

    const handleToolSelect = (tool) => {
        setSelectedTool(tool)
        setPendingFiles([])
        setRemoteUrl('')
        resetBatch()
        setMessage('')
        setResultBlob(null)
        setExtractedText(null)
        setOcrDone(false)
        setIsOcrConverting?.(false)
        setMascotState('idle')
        // Reset advanced settings
        setShowAdvanced(false)
        setPrivacyMode(false)
        setTargetWidth('')
        setTargetHeight('')
        setQuality(95)
        setCompressPdf(false)
        setPageRange('')
    }

    const handleBackToGrid = () => {
        setSelectedTool(null)
        setPendingFiles([])
        setRemoteUrl('')
        resetBatch()
        setMessage('')
        setResultBlob(null)
        setExtractedText(null)
        setOcrDone(false)
        setIsOcrConverting?.(false)
        setMascotState('idle')
        // Reset advanced settings
        setShowAdvanced(false)
        setPrivacyMode(false)
        setTargetWidth('')
        setTargetHeight('')
        setQuality(95)
        setCompressPdf(false)
        setPageRange('')
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
        console.log("handleConvert CLICKED! canConvert:", canConvert, "remoteUrl:", remoteUrl, "selectedTool:", selectedTool)
        if (!canConvert) {
            addToast(
                selectedTool?.id === 'merge-pdf'
                    ? 'Select at least 2 PDFs to merge.'
                    : 'Please select a file first.',
                'error'
            )
            return
        }
        if (!selectedTool?.target) {
            addToast('Pick a conversion tool first.', 'error')
            return
        }
        setMascotState('converting')
        setIsProcessing(true)
        setProcessingProgress(0)

        const simulatedProgressInterval = setInterval(() => {
            setProcessingProgress(prev => {
                if (prev >= 95) return prev
                return prev + Math.floor(Math.random() * 5) + 2
            })
        }, 800)

        try {
            let resultBlob
            const trimmedUrl = remoteUrl?.trim()
            console.log("trimmedUrl:", trimmedUrl)

            const options = {
                privacyMode,
                width: targetWidth ? parseInt(targetWidth) : null,
                height: targetHeight ? parseInt(targetHeight) : null,
                quality: parseInt(quality),
                compress: compressPdf,
                pageRange: pageRange?.trim() || null
            }

            if (trimmedUrl) {
                console.log("Calling remoteConvert for:", trimmedUrl, "target:", selectedTool?.target)
                resultBlob = await conversionService.remoteConvert(trimmedUrl, selectedTool?.target, options)
                console.log("remoteConvert returned:", resultBlob)
            } else if (file && (file.isRemote || file.isCloudUrl)) {
                const cUrl = file.url
                if (selectedTool.type === 'pdf' && selectedTool.id !== 'merge-pdf') {
                    resultBlob = await conversionService.convertDocument(null, 'pdf', selectedTool.target, cUrl, options)
                } else if (selectedTool.type === 'image') {
                    resultBlob = await conversionService.convertImage(null, selectedTool.target, cUrl, options)
                } else if (selectedTool.type === 'docx') {
                    resultBlob = await conversionService.convertDocument(null, 'docx', 'pdf', cUrl, options)
                } else if (selectedTool.type === 'data') {
                    resultBlob = await conversionService.convertData(null, selectedTool.target, cUrl)
                } else {
                    resultBlob = await conversionService.remoteConvert(cUrl, selectedTool.target, options)
                }
            } else if (selectedTool.id === 'merge-pdf') {
                resultBlob = await conversionService.mergeDocuments(files)
            } else if (selectedTool.id === 'image-to-pdf') {
                resultBlob = await conversionService.convertDocument(file, 'image', 'pdf', null, options)
            } else if (selectedTool.type === 'pdf') {
                resultBlob = await conversionService.convertDocument(file, 'pdf', selectedTool.target, null, options)
            } else if (selectedTool.type === 'image' || selectedTool.type === 'jpg' || selectedTool.type === 'png' || selectedTool.type === 'gif') {
                resultBlob = await conversionService.convertImage(file, selectedTool.target, null, options)
            } else if (selectedTool.type === 'docx') {
                resultBlob = await conversionService.convertDocument(file, 'docx', 'pdf', null, options)
            } else if (selectedTool.type === 'data') {
                resultBlob = await conversionService.convertData(file, selectedTool.target)
            } else {
                clearInterval(simulatedProgressInterval); // batch handles its own
                setIsProcessing(false);
                await startBatch(pendingFiles, selectedTool.target)
                setMascotState('success')
                addToast('Conversion successful! 🎉', 'success')
                saveRecent(selectedTool.name, selectedTool.target)
                setTimeout(() => setMascotState('idle'), 3000)
                return
            }

            if (resultBlob) {
                clearInterval(simulatedProgressInterval)
                setProcessingProgress(100)
                setResultBlob(resultBlob)
                setMascotState('success')
                addToast('Conversion successful! 🎉', 'success')
                saveRecent(selectedTool.name, selectedTool.target)
                setTimeout(() => {
                    setMascotState('idle')
                    setIsProcessing(false)
                }, 3000)
            } else {
                throw new Error('Conversion returned an empty result.')
            }

        } catch (error) {
            clearInterval(simulatedProgressInterval)
            setIsProcessing(false)
            console.error(error)
            let errMsg = 'Conversion failed. Please try again.'
            if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                errMsg = 'Conversion timed out. File may be too large.'
            } else if (error.response?.data instanceof Blob) {
                try {
                    const text = await error.response.data.text()
                    const parsed = JSON.parse(text)
                    const d = parsed.detail
                    errMsg = typeof d === 'string' ? d : (d != null ? JSON.stringify(d) : text)
                } catch {
                    errMsg = error.message || errMsg
                }
            } else if (error.message) {
                errMsg = error.message
            }
            addToast(errMsg, 'error')
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
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                            >
                                <img
                                    src="/illustrations/home_hero.png"
                                    alt="Astronaut juggling file types"
                                    style={{ width: '100%', height: 'auto', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}
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
                                                        setPendingFiles([smartFile])
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
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <img src="/illustrations/404.png" alt="Not found" style={{ width: '100%', height: 'auto' }} />
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
                                    Home
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
                                {/* Floating decoration mascot - hidden during conversion */}
                                {!isConverting && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1, y: [0, -8, 0], rotate: [0, 3, -3, 0] }}
                                        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                                        style={{
                                            position: 'absolute',
                                            top: '-40px',
                                            right: '20px',
                                            width: '110px', height: '110px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            zIndex: 2,
                                        }}
                                    >
                                        <img
                                            src="/illustrations/conversion.png"
                                            alt="Astronaut decoration"
                                            style={{ width: '100%', height: 'auto' }}
                                        />
                                    </motion.div>
                                )}

                                {/* Tool Header - hidden during conversion and result phases */}
                                {!isConverting && !isDone && (
                                    <>
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
                                    </>
                                )}

                                {/* Orbital Progress + Mascot Centerpiece */}
                                {(isConverting || isDone) && (
                                    <div style={{ position: 'relative', minHeight: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem 0' }}>
                                        
                                        {/* New Success Header (Icons + Text) */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={springGentle}
                                        >
                                            <ConversionHeader tool={selectedTool} />
                                        </motion.div>

                                        {/* Re-styled centered progress circle */}
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.2, ...springBounce }}
                                            style={{ margin: '0.5rem 0' }}
                                        >
                                            <OrbitalProgress progress={overallProgress} />
                                        </motion.div>

                                        <div style={{ width: '100%', maxWidth: '600px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: '0.75rem', marginTop: '2rem', textAlign: 'left' }}>
                                            {Object.entries(fileStates).map(([id, state]) => (
                                                <ProgressCard key={id} filename={state.filename} progress={state.progress} status={state.status} downloadUrl={state.downloadUrl} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Source Selection (Drag & Drop + URL) */}
                                {!isConverting && !isDone && !ocrDone && (
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
                                            maxWidth: '760px',
                                            margin: '0 auto 1.5rem',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <input
                                            type="file"
                                            accept={getAcceptTypes(selectedTool)}
                                            onChange={handleFileChange}
                                            multiple={true}
                                            style={{
                                                position: 'absolute',
                                                top: 0, left: 0, width: '100%', height: '100%',
                                                opacity: 0, cursor: 'pointer', zIndex: 5,
                                            }}
                                        />
                                        {selectedTool.id === 'merge-pdf' && pendingFiles.length > 0 ? (
                                            <div style={{
                                                maxHeight: '200px', overflowY: 'auto', width: '100%',
                                                textAlign: 'left', position: 'relative', zIndex: 10,
                                                pointerEvents: 'none',
                                            }}>
                                                <p style={{ fontWeight: 700, color: 'var(--ag-text)', textAlign: 'center', marginBottom: '0.8rem' }}>
                                                    {pendingFiles.length} files selected
                                                </p>
                                                {pendingFiles.map((f, index) => (
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
                                                <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--ag-text-secondary)' }}>
                                                    Click box or use cloud pickers below to add more files
                                                </div>

                                                {/* Cloud Storage Icons */}
                                                {!resultBlob && (
                                                    <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10, marginTop: '1rem', pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()}>
                                                        <div style={{ width: '40px', height: '1px', background: 'linear-gradient(90deg, transparent, var(--ag-glass-border))', opacity: 0.4 }} />
                                                        <DropboxPicker onFileSelected={handleDropboxSelect} acceptTypes={getAcceptTypes(selectedTool)} multiselect={true} />
                                                        <GoogleDrivePicker onFileSelected={handleFileChange} acceptTypes={getAcceptTypes(selectedTool)} multiselect={true} />
                                                        <div style={{ width: '40px', height: '1px', background: 'linear-gradient(90deg, var(--ag-glass-border), transparent)', opacity: 0.4 }} />
                                                    </div>
                                                )}
                                            </div>
                                        ) : pendingFiles.length > 0 ? (
                                            <FilePreview file={pendingFiles[0]} />
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', paddingTop: '0.5rem' }}>
                                                {/* Select File Button */}
                                                <motion.div
                                                    whileHover={{ scale: 1.06, boxShadow: '0 8px 30px var(--ag-accent-glow)' }}
                                                    whileTap={{ scale: 0.98 }}
                                                    transition={springBounce}
                                                    style={{
                                                        background: 'var(--ag-btn-primary)',
                                                        color: 'var(--ag-btn-primary-text)',
                                                        padding: '0.9rem 2.8rem',
                                                        borderRadius: '60px',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontWeight: 700,
                                                        boxShadow: '0 6px 25px var(--ag-accent-glow)',
                                                        fontSize: '1rem',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    Select {selectedTool.type === 'image' ? 'Image' : selectedTool.id === 'merge-pdf' ? 'PDFs' : 'File'}
                                                </motion.div>

                                                {/* Cloud Storage Icons */}
                                                {!resultBlob && (
                                                    <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10 }} onClick={(e) => e.stopPropagation()}>
                                                        <DropboxPicker onFileSelected={handleDropboxSelect} acceptTypes={getAcceptTypes(selectedTool)} multiselect={selectedTool.id === 'merge-pdf'} />
                                                        <GoogleDrivePicker onFileSelected={handleFileChange} acceptTypes={getAcceptTypes(selectedTool)} multiselect={selectedTool.id === 'merge-pdf'} />
                                                    </div>
                                                )}

                                                <p style={{ color: 'var(--ag-text-secondary)', fontSize: '0.8rem', margin: 0 }}>or drag & drop file here</p>

                                                {/* OR Divider */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', margin: '0.5rem 0', opacity: 0.4 }}>
                                                    <div style={{ flex: 1, height: '1px', background: 'var(--ag-glass-border)' }} />
                                                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--ag-text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>OR</span>
                                                    <div style={{ flex: 1, height: '1px', background: 'var(--ag-glass-border)' }} />
                                                </div>

                                                {/* URL Input Integrated */}
                                                <div
                                                    style={{ width: '100%', position: 'relative', zIndex: 10, pointerEvents: 'auto' }}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <RemoteFetch
                                                        variant="flat"
                                                        hideTitle={true}
                                                        targetFormat={selectedTool?.target || tools.find(t => t.id === selectedTool?.id)?.target}
                                                        allowedSourceFormats={(() => {
                                                            const tool = selectedTool;
                                                            if (!tool) return null;
                                                            if (tool.id === 'merge-pdf' || tool.type === 'pdf') return ['pdf'];
                                                            if (tool.type === 'docx') return ['docx'];
                                                            if (tool.type === 'image') return ['png', 'jpg', 'jpeg', 'gif'];
                                                            if (tool.type === 'jpg') return ['jpg', 'jpeg'];
                                                            if (tool.type === 'png') return ['png'];
                                                            if (tool.type === 'gif') return ['gif'];
                                                            if (tool.type === 'data') return ['json', 'csv', 'xlsx', 'xml'];
                                                            return null;
                                                        })()}
                                                        url={remoteUrl}
                                                        onUrlChange={setRemoteUrl}
                                                        onSubmit={handleConvert}
                                                        isConverting={isConverting}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {/* Advanced Settings Toggle — only for image and PDF tools, not merge-pdf */}
                                {!isConverting && !isDone && (pendingFiles.length > 0 || (remoteUrl && remoteUrl.trim() !== '')) &&
                                 selectedTool?.id !== 'merge-pdf' &&
                                 (selectedTool?.type === 'pdf' || selectedTool?.type === 'image' || selectedTool?.type === 'jpg' || selectedTool?.type === 'png' || selectedTool?.type === 'gif') && (
                                    <div style={{ margin: '0.5rem 0 1.5rem' }}>
                                        <motion.button
                                            onClick={() => setShowAdvanced(!showAdvanced)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: 'var(--ag-accent)',
                                                fontSize: '0.85rem',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.4rem',
                                                margin: '0 auto',
                                                padding: '0.5rem 1rem',
                                                borderRadius: '8px',
                                            }}
                                            whileHover={{ background: 'rgba(var(--ag-accent-rgb), 0.1)' }}
                                        >
                                            <motion.span
                                                animate={{ rotate: showAdvanced ? 180 : 0 }}
                                                transition={{ duration: 0.3 }}
                                                style={{ display: 'inline-block' }}
                                            >
                                                ⚙️
                                            </motion.span>
                                            {showAdvanced ? 'Hide Advanced Settings' : 'Advanced Settings'}
                                        </motion.button>

                                        <AnimatePresence>
                                            {showAdvanced && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={springGentle}
                                                    style={{ overflow: 'hidden' }}
                                                >
                                                    <div style={{
                                                        padding: '1.5rem',
                                                        marginTop: '1rem',
                                                        borderRadius: '12px',
                                                        background: 'rgba(255, 255, 255, 0.03)',
                                                        border: '1px solid var(--ag-glass-border)',
                                                        textAlign: 'left',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '1.2rem'
                                                    }}>
                                                        
                                                        {/* Image Specific Settings */}
                                                        {(selectedTool.type === 'image' || selectedTool.type === 'jpg' || selectedTool.type === 'png' || selectedTool.type === 'gif') && (
                                                            <>
                                                                <label
                                                                    onClick={() => setPrivacyMode(!privacyMode)}
                                                                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--ag-text)', userSelect: 'none' }}
                                                                >
                                                                    {/* Custom checkbox matching input box style */}
                                                                    <div style={{
                                                                        width: '18px',
                                                                        height: '18px',
                                                                        borderRadius: '5px',
                                                                        border: '1px solid var(--ag-glass-border)',
                                                                        background: privacyMode ? 'var(--ag-accent)' : 'var(--ag-input-bg)',
                                                                        flexShrink: 0,
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        transition: 'background 0.2s ease',
                                                                    }}>
                                                                        {privacyMode && (
                                                                            <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                                                                                <path d="M1 4L4 7.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                                            </svg>
                                                                        )}
                                                                    </div>
                                                                    Scrub Privacy Data (EXIF)
                                                                </label>
                                                                
                                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                                                    <div>
                                                                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--ag-text-secondary)', marginBottom: '0.4rem' }}>Target Width (px)</label>
                                                                        <input type="number" placeholder="Original" value={targetWidth} onChange={(e) => setTargetWidth(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: 'var(--ag-input-bg)', border: '1px solid var(--ag-glass-border)', color: 'var(--ag-text)', fontSize: '0.9rem' }} />
                                                                    </div>
                                                                    <div>
                                                                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--ag-text-secondary)', marginBottom: '0.4rem' }}>Target Height (px)</label>
                                                                        <input type="number" placeholder="Original" value={targetHeight} onChange={(e) => setTargetHeight(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: 'var(--ag-input-bg)', border: '1px solid var(--ag-glass-border)', color: 'var(--ag-text)', fontSize: '0.9rem' }} />
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                                                        <label style={{ fontSize: '0.8rem', color: 'var(--ag-text-secondary)' }}>Compression Quality</label>
                                                                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ag-accent)' }}>{quality}%</span>
                                                                    </div>
                                                                    <input type="range" min="1" max="100" value={quality} onChange={(e) => setQuality(e.target.value)} style={{ width: '100%', accentColor: 'var(--ag-accent)', cursor: 'pointer' }} />
                                                                </div>
                                                            </>
                                                        )}

                                                        {/* PDF Specific Settings */}
                                                        {selectedTool.type === 'pdf' && (
                                                            <>
                                                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--ag-text)' }}>
                                                                    <input type="checkbox" checked={compressPdf} onChange={(e) => setCompressPdf(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--ag-accent)' }} />
                                                                    Compress PDF File Size
                                                                </label>
                                                                
                                                                <div>
                                                                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--ag-text-secondary)', marginBottom: '0.4rem' }}>Specific Pages</label>
                                                                    <input type="text" placeholder="e.g. 1-5, 8" value={pageRange} onChange={(e) => setPageRange(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: 'var(--ag-input-bg)', border: '1px solid var(--ag-glass-border)', color: 'var(--ag-text)', fontSize: '0.9rem' }} />
                                                                    <p style={{ fontSize: '0.7rem', color: 'var(--ag-text-secondary)', marginTop: '0.3rem' }}>Leave blank to include all pages</p>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}



                                {/* Action Buttons */}
                                {resultBlob ? (
                                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                                        <motion.button
                                            onClick={() => {
                                                const link = document.createElement('a')
                                                link.href = resultUrl
                                                const baseName = selectedTool?.target === 'pdf' ? 'document' : (files.length > 0 ? 'merged' : (file?.name?.split('.')[0] || 'remote_result'))
                                                link.setAttribute('download', `converted_${baseName}.${selectedTool?.target || 'file'}`)
                                                document.body.appendChild(link)
                                                link.click()
                                                link.remove()
                                            }}
                                            className="ag-btn-primary"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            transition={springBounce}
                                            initial={{ scale: 0.9, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            style={{ minWidth: '160px' }}
                                        >
                                            Download
                                        </motion.button>

                                        <GoogleDriveSaver 
                                            downloadUrl={resultUrl} 
                                            filename={`converted_${selectedTool?.target === 'pdf' ? 'document' : (files.length > 0 ? 'merged' : (file?.name?.split('.')[0] || 'remote_result'))}.${selectedTool?.target || 'file'}`} 
                                        />

                                        <DropboxSaver 
                                            downloadUrl={resultUrl} 
                                            filename={`converted_${selectedTool?.target === 'pdf' ? 'document' : (files.length > 0 ? 'merged' : (file?.name?.split('.')[0] || 'remote_result'))}.${selectedTool?.target || 'file'}`} 
                                        />
                                    </div>
                                ) : (
                                    <motion.button
                                        type="button"
                                        onClick={handleConvert}
                                        disabled={!canConvert}
                                        className="ag-btn-primary"
                                        whileHover={canConvert ? { scale: 1.06 } : {}}
                                        whileTap={canConvert ? { scale: 0.95 } : {}}
                                        transition={springBounce}
                                        style={{
                                            display: 'block',
                                            margin: '0 auto',
                                            minWidth: '200px',
                                        }}
                                    >
                                        <span style={{ position: 'relative', zIndex: 1 }}>
                                            Convert
                                        </span>

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
                                                    Retry
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
