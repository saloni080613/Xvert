import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaDropbox } from 'react-icons/fa';

/**
 * Dropbox Integration for Local Files (Blobs)
 * 
 * NOTE: For this to work on localhost, you MUST add:
 * http://localhost:5173/dropbox-callback.html
 * to the "Redirect URIs" in your Dropbox App Console.
 */
const DropboxSaver = ({ downloadUrl, filename, minimal = false }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [accessToken, setAccessToken] = useState(localStorage.getItem('dropbox_token'));
    const authWindowRef = useRef(null);

    // Listen for authentication success (Both postMessage and localStorage fallback)
    useEffect(() => {
        const handleAuth = (data) => {
            if (data.source === 'dropbox-auth-success') {
                const token = data.token;
                setAccessToken(token);
                localStorage.setItem('dropbox_token', token);
                
                // Once we have the token, proceed with the save
                if (downloadUrl && filename) {
                    saveToDropbox(token);
                }
            }
        };

        const handleMessage = (event) => {
            if (event.origin !== window.location.origin) return;
            handleAuth(event.data);
        };

        const handleStorage = (event) => {
            if (event.key === 'dropbox_auth_result' && event.newValue) {
                try {
                    const data = JSON.parse(event.newValue);
                    handleAuth(data);
                    // Cleanup
                    localStorage.removeItem('dropbox_auth_result');
                } catch { /* ignore */ }
            }
        };

        window.addEventListener('message', handleMessage);
        window.addEventListener('storage', handleStorage);
        return () => {
            window.removeEventListener('message', handleMessage);
            window.removeEventListener('storage', handleStorage);
        };
    }, [downloadUrl, filename]);

    const handleSave = () => {
        if (!accessToken) {
            startAuthFlow();
        } else {
            saveToDropbox(accessToken);
        }
    };

    const startAuthFlow = () => {
        const clientId = import.meta.env.VITE_DROPBOX_APP_KEY;
        if (!clientId) {
            alert('Dropbox App Key is missing. Please set VITE_DROPBOX_APP_KEY in your .env file.');
            return;
        }

        // Use the browser-based callback page we created
        const redirectUri = `${window.location.origin}/dropbox-callback.html`;
        const scope = 'files.content.write files.content.read';
        const authUrl = `https://www.dropbox.com/oauth2/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
        
        // Open the auth popup in the center of the screen
        const width = 600, height = 700;
        const left = (window.screen.width / 2) - (width / 2);
        const top = (window.screen.height / 2) - (height / 2);
        
        authWindowRef.current = window.open(
            authUrl, 
            'DropboxAuth', 
            `width=${width},height=${height},left=${left},top=${top},status=0,location=0,toolbar=0,menubar=0`
        );
    };

    const saveToDropbox = async (token) => {
        if (!downloadUrl || !filename) {
            alert('No conversion result found to save.');
            return;
        }
        setIsSaving(true);

        try {
            // 1. Fetch the local blob data (works on localhost)
            const blobRes = await fetch(downloadUrl);
            if (!blobRes.ok) throw new Error('Could not read the converted file.');
            const blob = await blobRes.blob();

            // 2. Upload directly to Dropbox Content API
            // This bypasses the "Saver" Drop-in limitation for local URLs
            const response = await fetch('https://content.dropboxapi.com/2/files/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/octet-stream',
                    'Dropbox-API-Arg': JSON.stringify({
                        path: `/${filename}`,
                        mode: 'add',
                        autorename: true,
                        mute: false,
                        strict_conflict: false
                    })
                },
                body: blob
            });

            if (response.status === 401) {
                // Token likely expired or revoked
                localStorage.removeItem('dropbox_token');
                setAccessToken(null);
                startAuthFlow();
                return;
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Dropbox upload failed: ${errorText}`);
            }

            const result = await response.json();
            console.log('Dropbox Upload Result:', result);
            alert(`"${filename}" successfully saved to your Dropbox!`);
        } catch (error) {
            console.error('Dropbox Save Error:', error);
            alert(`Dropbox Error: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
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
                title="Save to Dropbox"
            >
                {isSaving ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" fill="none" stroke="#7c4dff" strokeWidth="2" strokeDasharray="15.7 47.1">
                          <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" />
                        </circle>
                    </svg>
                ) : (
                    <FaDropbox color="#7c4dff" size={20} />
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
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
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
                boxShadow: '0 4px 15px rgba(124, 77, 255, 0.08)',
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
                    <FaDropbox color="#7c4dff" size={20} />
                    Save to Dropbox
                </>
            )}
        </motion.button>
    );
};

export default DropboxSaver;
