import React from 'react';
import { motion } from 'framer-motion';
import { useToast } from './ToastContext';

/**
 * RemoteFetch — single-step mode
 *
 * Props:
 *   targetFormat         (string)   — the conversion target, e.g. "png", "docx"  (required)
 *   allowedSourceFormats (string[]) — formats the current tool accepts, e.g. ['jpg','png']
 *   url                  (string)   — the current url value
 *   onUrlChange          (fn)       — called when the url input changes
 *   isConverting         (bool)     — disables the input while the parent is busy
 *   onSubmit             (fn)       — called when the user hits Enter so it can trigger the Convert button
 *   variant             (string)   — 'card' (default) or 'flat' (embed into parent card)
 *   hideTitle           (bool)     — hide the "Fetch from URL" heading when embedding
 */
const RemoteFetch = ({
    url,
    onUrlChange,
    onSubmit,
    isConverting,
    allowedSourceFormats = null,
    targetFormat = null,
    variant = 'card',
    hideTitle = false,
}) => {
    const { addToast } = useToast();

    const handleUrlSubmit = () => {
        if (!url || !url.trim()) {
            addToast('Please enter a URL', 'error');
            return;
        }
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            addToast('URL must start with http:// or https://', 'error');
            return;
        }
        if (onSubmit) {
            onSubmit();
        }
    };

    const isFlat = variant === 'flat';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                background: isFlat ? 'transparent' : 'var(--ag-card-bg, #fff)',
                backdropFilter: isFlat ? 'none' : 'blur(8px)',
                border: isFlat ? 'none' : '1px solid var(--ag-card-border, #e0e0e0)',
                borderRadius: isFlat ? '0px' : '12px',
                padding: isFlat ? '0px' : '1.25rem 1.5rem',
                marginBottom: isFlat ? '0px' : '1.5rem',
            }}
        >
            {!hideTitle && (
                <h3 style={{
                    color: 'var(--ag-text, #1D3557)',
                    marginBottom: '0.85rem',
                    fontSize: '1.05rem',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                }}>
                    🌐 Fetch from URL
                    {targetFormat && (
                        <span style={{
                            fontSize: '0.75rem',
                            background: 'rgba(168, 218, 220, 0.3)',
                            color: 'var(--ag-accent)',
                            borderRadius: '20px',
                            padding: '0.2rem 0.7rem',
                            fontWeight: '800',
                            border: '1px solid var(--ag-accent)',
                        }}>
                            → {targetFormat.toUpperCase()}
                        </span>
                    )}
                </h3>
            )}

            <div style={{ display: 'flex', gap: '0.8rem' }}>
                <input
                    type="url"
                    value={url || ''}
                    onChange={(e) => onUrlChange && onUrlChange(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !isConverting && handleUrlSubmit()}
                    placeholder="Paste file URL (Direct link, Drive, Dropbox…)"
                    disabled={isConverting}
                    style={{
                        flex: 1,
                        padding: '0.8rem 1.1rem',
                        borderRadius: '10px',
                        border: '2px solid var(--ag-glass-border, #eee)',
                        background: 'var(--ag-input-bg, #f5f5f5)',
                        color: 'var(--ag-text, #222)',
                        fontSize: '0.92rem',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--ag-accent)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--ag-glass-border)'}
                />
            </div>


        </motion.div>
    );
};

export default RemoteFetch;