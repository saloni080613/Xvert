/**
 * useBatchUpload.js
 * =================
 * Custom React hook that manages the full lifecycle of a parallel batch upload:
 *
 *   1. POST /api/batch/convert  → returns batch_id + file_ids
 *   2. Open EventSource to /api/batch/progress/{batch_id}
 *   3. For each SSE event, update the individual file state
 *   4. On "batch_complete" event, close the EventSource
 *
 * State shape (fileStates):
 *   Map: file_id → { filename, progress (0–100), status, downloadUrl, error }
 */

import { useState, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';
import { getApiBaseUrl } from '../config/api';

const API_BASE = getApiBaseUrl();

async function _getAuthHeaders() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
            return { Authorization: `Bearer ${session.access_token}` };
        }
    } catch (_) { /* auth is optional */ }
    return {};
}

export function useBatchUpload() {
    // Map of file_id -> file state object
    const [fileStates, setFileStates] = useState({});
    // Overall batch status: idle | uploading | processing | done | error
    const [batchStatus, setBatchStatus] = useState('idle');
    const [batchError, setBatchError] = useState(null);
    const [summary, setSummary] = useState({ done: 0, error: 0, total: 0 });

    // Keep EventSource ref so we can close it on unmount / reset
    const esRef = useRef(null);

    /**
     * Start a batch: upload files and open SSE progress stream.
     * @param {File[]} files - Array of File objects (max 20)
     * @param {string} targetFormat - e.g. "jpg", "csv", "pdf"
     */
    const startBatch = useCallback(async (files, targetFormat) => {
        // Reset state
        if (esRef.current) esRef.current.close();
        setFileStates({});
        setBatchError(null);
        setSummary({ done: 0, error: 0, total: files.length });
        setBatchStatus('uploading');

        try {
            // ── 1. POST all files ──────────────────────────────────────────
            const formData = new FormData();
            files.forEach(f => formData.append('files', f));
            formData.append('target_format', targetFormat);

            const authHeaders = await _getAuthHeaders();
            const res = await fetch(`${API_BASE}/api/batch/convert`, {
                method: 'POST',
                body: formData,
                headers: authHeaders,  // no Content-Type: fetch sets multipart boundary automatically
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || `Upload failed (${res.status})`);
            }

            const { batch_id, file_ids, filenames } = await res.json();

            // Pre-populate UI so all cards appear instantly
            const initial = {};
            file_ids.forEach((id, i) => {
                initial[id] = {
                    filename: filenames[i] ?? files[i]?.name ?? 'unknown',
                    progress: 0,
                    status: 'queued',
                    downloadUrl: null,
                    error: null,
                };
            });
            setFileStates(initial);
            setBatchStatus('processing');

            // ── 2. Open SSE stream ─────────────────────────────────────────
            const esUrl = `${API_BASE}/api/batch/progress/${batch_id}`;
            const es = new EventSource(esUrl);
            esRef.current = es;

            // Track counts locally inside this closure to avoid stale closures
            let doneCount = 0;
            let errorCount = 0;

            es.onmessage = (evt) => {
                let data;
                try { data = JSON.parse(evt.data); }
                catch { return; }

                // ── batch finished ──
                if (data.type === 'batch_complete') {
                    setBatchStatus('done');
                    es.close();
                    return;
                }

                // ── individual file update ──
                const { file_id, filename, progress, status, download_url, error } = data;

                setFileStates(prev => ({
                    ...prev,
                    [file_id]: {
                        filename: filename ?? prev[file_id]?.filename,
                        progress: progress ?? prev[file_id]?.progress,
                        status: status ?? prev[file_id]?.status,
                        downloadUrl: download_url
                            ? `${API_BASE}${download_url}`
                            : prev[file_id]?.downloadUrl,
                        error: error ?? null,
                    },
                }));

                if (status === 'done') doneCount++;
                if (status === 'error') errorCount++;
                setSummary(prev => ({ ...prev, done: doneCount, error: errorCount }));
            };

            es.onerror = () => {
                setBatchError('Connection to server lost. Some files may still be converting.');
                setBatchStatus('error');
                es.close();
            };

        } catch (err) {
            setBatchError(err.message || 'Upload failed');
            setBatchStatus('error');
        }
    }, []);

    /** Reset everything back to idle. */
    const reset = useCallback(() => {
        if (esRef.current) esRef.current.close();
        esRef.current = null;
        setFileStates({});
        setBatchError(null);
        setBatchStatus('idle');
        setSummary({ done: 0, error: 0, total: 0 });
    }, []);

    return { fileStates, batchStatus, batchError, summary, startBatch, reset };
}
