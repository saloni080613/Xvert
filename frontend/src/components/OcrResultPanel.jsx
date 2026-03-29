import React from 'react'
import { motion } from 'framer-motion'
import { Download, RefreshCw } from 'lucide-react'

export default function OcrResultPanel({ blob, filename, extractedText, onReset }) {
    // Stats computation
    const textData = extractedText || ''
    const pageCount = textData ? textData.split('\n\n').length : 0
    const charCount = textData ? textData.replace(/\s/g, '').length : 0

    const handleDownload = () => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename.replace(/\.[^.]+$/, '') + '_ocr.docx'
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="glass-panel"
            style={{ padding: '2rem', textAlign: 'left', marginTop: '1rem' }}
        >
            <div style={{ marginBottom: '1rem' }}>
                <h3 style={{
                    fontFamily: '"Outfit", sans-serif',
                    color: 'var(--ag-text)',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    margin: '0 0 0.25rem 0'
                }}>
                    OCR complete — "{filename}"
                </h3>
                <p style={{
                    color: 'var(--ag-text-secondary)',
                    fontSize: '0.85rem',
                    margin: 0
                }}>
                    {pageCount} pages · {charCount} characters extracted
                </p>
            </div>

            <div style={{
                background: 'var(--ag-input-bg)',
                border: '1px solid var(--ag-glass-border)',
                borderRadius: '12px',
                padding: '1rem',
                maxHeight: '220px',
                overflowY: 'auto',
                fontFamily: 'monospace',
                fontSize: '0.82rem',
                color: 'var(--ag-text)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                marginTop: '1rem',
                marginBottom: '1.5rem'
            }}>
                {extractedText ? extractedText : "Preview unavailable"}
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
                <button
                    className="ag-btn-primary"
                    onClick={handleDownload}
                    style={{ minWidth: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                    <Download size={16} /> ↓ Download .docx
                </button>
                <button
                    onClick={onReset}
                    style={{
                        color: 'var(--ag-text-secondary)',
                        fontSize: '0.9rem',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        marginLeft: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        transition: 'color 0.2s ease',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.color = 'var(--ag-text)'}
                    onMouseOut={(e) => e.currentTarget.style.color = 'var(--ag-text-secondary)'}
                >
                    <RefreshCw size={14} /> Convert another
                </button>
            </div>
        </motion.div>
    )
}
