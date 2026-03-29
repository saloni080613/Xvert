/**
 * BatchUploader.jsx
 * =================
 * Drop zone + format selector + grid of ProgressCards.
 * Integrates with useBatchUpload hook.
 *
 * Usage: drop it anywhere a "tool view" is shown in Dashboard.jsx
 *   <BatchUploader tool={selectedTool} onBack={handleBackToGrid} />
 *
 * Props:
 *   tool      - the currently selected tool object from Dashboard.jsx tools[]
 *   onBack    - callback to go back to the tools grid
 */

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useBatchUpload } from '../hooks/useBatchUpload';
import ProgressCard from './ProgressCard';

const MAX_FILES = 20;

// Map tool to accepted MIME types for the dropzone
function getAcceptMap(tool) {
    if (!tool) return { '*/*': [] };
    const t = tool.type;
    if (tool.id === 'merge-pdf') return { 'application/pdf': ['.pdf'] };
    if (t === 'pdf') return { 'application/pdf': ['.pdf'] };
    if (t === 'image' || t === 'jpg' || t === 'png' || t === 'gif') return { 'image/*': ['.jpg', '.jpeg', '.png', '.gif'] };
    if (t === 'docx') return { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx', '.doc'] };
    if (t === 'data') return { 'application/json': ['.json'], 'text/csv': ['.csv'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'application/xml': ['.xml'], 'text/xml': ['.xml'] };
    return { '*/*': [] };
}

export default function BatchUploader({ tool, onBack }) {
    const { fileStates, batchStatus, batchError, summary, startBatch, reset } = useBatchUpload();
    const [localError, setLocalError] = useState('');

    const targetFormat = tool?.target ?? 'jpg';
    const cards = Object.entries(fileStates);
    const isActive = batchStatus === 'uploading' || batchStatus === 'processing';

    const onDrop = useCallback((accepted, rejected) => {
        setLocalError('');
        if (rejected.length > 0) {
            setLocalError(`${rejected.length} file(s) rejected (wrong type or > 50MB).`);
        }
        if (accepted.length === 0) return;

        const capped = accepted.slice(0, MAX_FILES);
        if (accepted.length > MAX_FILES) {
            setLocalError(prev => (prev ? prev + ' ' : '') + `Only first ${MAX_FILES} files were used.`);
        }
        startBatch(capped, targetFormat);
    }, [startBatch, targetFormat]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: true,
        maxSize: 50 * 1024 * 1024,
        disabled: isActive,
    });

    const handleReset = () => {
        reset();
        setLocalError('');
    };

    const allDone = summary.done + summary.error === summary.total && summary.total > 0;
    const anyError = summary.error > 0;

    return (
        <div className="batch-uploader">
            {/* Back link */}
            <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                <span
                    onClick={onBack}
                    style={{ cursor: 'pointer', color: '#1D3557', fontWeight: 'bold', fontSize: '0.95rem' }}
                >
                    ← Back to Dashboard
                </span>
            </div>

            {/* Tool header */}
            <div className="bu-header">
                <h2 className="bu-title">{tool?.name ?? 'Batch Convert'}</h2>
                <p className="bu-subtitle">
                    Drop up to <strong>{MAX_FILES} files</strong> — they process in parallel, each with its own progress bar.
                </p>
            </div>

            {/* Drop zone */}
            {!isActive && batchStatus !== 'done' && (
                <div
                    {...getRootProps()}
                    className={`bu-dropzone ${isDragActive ? 'drag-over' : ''}`}
                    id="batch-dropzone"
                >
                    <input {...getInputProps({ multiple: true })} />
                    <div className="bu-drop-icon">☁️</div>
                    <p className="bu-drop-text">
                        {isDragActive ? 'Release to upload!' : `Drag & drop up to ${MAX_FILES} files here`}
                    </p>
                    <p className="bu-drop-hint">or click to browse — Target: <strong>.{targetFormat.toUpperCase()}</strong></p>
                </div>
            )}

            {/* Status: uploading */}
            {batchStatus === 'uploading' && (
                <div className="bu-status-banner bu-status-uploading">
                    ⬆ Uploading files to server…
                </div>
            )}

            {/* Status: processing */}
            {batchStatus === 'processing' && (
                <div className="bu-status-banner bu-status-processing">
                    ⚡ Converting {summary.total} files in parallel…
                    ({summary.done} done{summary.error > 0 ? `, ${summary.error} failed` : ''})
                </div>
            )}

            {/* Status: done */}
            {batchStatus === 'done' && (
                <div className={`bu-status-banner ${anyError ? 'bu-status-partial' : 'bu-status-done'}`}>
                    {anyError
                        ? `⚠ Completed: ${summary.done} converted, ${summary.error} failed.`
                        : `✅ All ${summary.done} files converted successfully!`}
                    <button onClick={handleReset} className="bu-reset-btn">Convert More</button>
                </div>
            )}

            {/* Errors */}
            {(localError || batchError) && (
                <div className="bu-error-banner">
                    {localError && <div>{localError}</div>}
                    {batchError && <div>{batchError}</div>}
                </div>
            )}

            {/* Progress grid — 20 individual cards */}
            {cards.length > 0 && (
                <div className="bu-grid">
                    {cards.map(([fileId, state]) => (
                        <ProgressCard key={fileId} {...state} />
                    ))}
                </div>
            )}
        </div>
    );
}
