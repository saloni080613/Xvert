import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const GoogleDriveSaver = ({ downloadUrl, filename, minimal = false }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [scriptsLoaded, setScriptsLoaded] = useState(false);

    useEffect(() => {
        const loadScript = (src) => new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) return resolve();
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.defer = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });

        loadScript('https://accounts.google.com/gsi/client').then(() => {
            setScriptsLoaded(true);
        }).catch(() => console.error("Failed to load Google Auth client"));
    }, []);

    const handleSave = async () => {
        if (!scriptsLoaded) {
            alert('Google Drive connection is still initializing. Please try again in a moment.');
            return;
        }

        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (!clientId) {
            alert('Google Drive integration is not configured. Please set the IDs in your .env file.');
            return;
        }

        setIsSaving(true);

        try {
            const tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: 'https://www.googleapis.com/auth/drive.file',
                callback: async (tokenResponse) => {
                    if (tokenResponse && tokenResponse.access_token) {
                        try {
                            await uploadBlobToDrive(tokenResponse.access_token);
                            setIsSaving(false);
                            setTimeout(() => {
                                alert(`"${filename}" was successfully saved to your Google Drive!`);
                            }, 100);
                        } catch (err) {
                            console.error('Upload Error:', err);
                            alert('Failed to save the file to Google Drive. ' + err.message);
                            setIsSaving(false);
                        }
                    } else {
                        setIsSaving(false);
                        if (tokenResponse?.error !== 'user_canceled') {
                            alert('Google Authentication failed.');
                        }
                    }
                },
            });
            tokenClient.requestAccessToken();
        } catch (error) {
            console.error('Auth Init Error:', error);
            setIsSaving(false);
            alert('Failed to initialize Google Authentication.');
        }
    };

    const uploadBlobToDrive = async (accessToken) => {
        const blobRes = await fetch(downloadUrl);
        const blob = await blobRes.blob();
        const metadata = { name: filename, mimeType: blob.type || 'application/octet-stream' };
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', blob);

        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}` },
            body: form,
        });

        if (!response.ok) throw new Error(`Google Drive API Error: ${response.status}`);
        return await response.json();
    };

    if (minimal) {
        return (
            <motion.div
                onClick={!isSaving ? handleSave : undefined}
                whileHover={!isSaving ? { scale: 1.2, y: -2 } : {}}
                whileTap={!isSaving ? { scale: 0.9 } : {}}
                style={{ 
                    cursor: isSaving ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: isSaving ? 0.6 : 1,
                    transition: 'all 0.2s',
                    padding: '4px',
                }}
                title="Save to Google Drive"
            >
                {isSaving ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" fill="none" stroke="#4285F4" strokeWidth="2" strokeDasharray="15.7 47.1">
                          <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" />
                        </circle>
                    </svg>
                ) : (
                    <svg viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
                        <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                        <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                        <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                        <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                        <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                        <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                    </svg>
                )}
            </motion.div>
        );
    }

    return (
        <motion.button
            onClick={handleSave}
            disabled={isSaving}
            whileHover={!isSaving ? { scale: 1.05 } : {}}
            whileTap={!isSaving ? { scale: 0.95 } : {}}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            style={{ 
                background: 'rgba(124, 77, 255, 0.15)',
                color: '#7c4dff',
                border: '1px solid rgba(124, 77, 255, 0.25)',
                backdropFilter: 'blur(10px)',
                padding: '0.8rem 1.6rem',
                borderRadius: '50px',
                fontWeight: 700,
                cursor: isSaving ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                fontSize: '0.95rem',
                minWidth: '200px',
                opacity: isSaving ? 0.7 : 1,
                boxShadow: '0 4px 15px rgba(124, 77, 255, 0.08)'
            }}
        >
            {isSaving ? (
                <>
                    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="15.7 47.1">
                          <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" />
                        </circle>
                    </svg>
                    Saving...
                </>
            ) : (
                <>
                    <svg viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                        <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                        <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                        <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                        <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                        <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                        <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                    </svg>
                    Save to Drive
                </>
            )}
        </motion.button>
    );
};

export default GoogleDriveSaver;
