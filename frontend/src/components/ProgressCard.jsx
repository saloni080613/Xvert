/**
 * ProgressCard.jsx
 * ================
 * Displays the status and progress of one file in a batch conversion.
 * Receives props directly from the fileStates map in useBatchUpload.
 */

const STATUS_CONFIG = {
    queued:     { icon: '⏳', label: 'Queued',     color: '#888' },
    processing: { icon: '⚙️', label: 'Processing', color: '#1D6FA8' },
    done:       { icon: '✅', label: 'Done',        color: '#2E7D32' },
    error:      { icon: '❌', label: 'Error',       color: '#C62828' },
};

export default function ProgressCard({ filename, progress, status, downloadUrl, error }) {
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.queued;
    const shortName = filename.length > 30 ? `…${filename.slice(-27)}` : filename;

    return (
        <div className="progress-card" data-status={status}>
            {/* Header row */}
            <div className="pc-header">
                <span className="pc-icon" aria-hidden="true">{cfg.icon}</span>
                <span className="pc-filename" title={filename}>{shortName}</span>
                <span className="pc-status-label" style={{ color: cfg.color }}>{cfg.label}</span>
            </div>

            {/* Progress bar */}
            <div className="pc-track" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                <div
                    className="pc-fill"
                    style={{
                        width: `${progress}%`,
                        background: status === 'error'
                            ? '#C62828'
                            : status === 'done'
                                ? '#2E7D32'
                                : 'linear-gradient(90deg, #A8DADC, #1D6FA8)',
                    }}
                />
            </div>

            {/* Percentage text */}
            <div className="pc-pct" style={{ color: cfg.color }}>
                {status === 'error' ? 'Failed' : `${progress}%`}
            </div>

            {/* Error message */}
            {status === 'error' && error && (
                <div className="pc-error-msg">{error}</div>
            )}

            {/* Download button (appears when done) */}
            {status === 'done' && downloadUrl && (
                <a
                    href={downloadUrl}
                    download
                    className="pc-download-btn"
                >
                    ⬇ Download
                </a>
            )}
        </div>
    );
}
