import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from './ThemeContext';

const GoogleDrivePicker = ({ onFileSelected, acceptTypes, multiselect = false }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const baseBg = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)';
    const hoverBg = isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.12)';
    const borderColor = isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.12)';
    const brandColor = '#4285F4';
    const [isLoading, setIsLoading] = useState(false);
    const [scriptsLoaded, setScriptsLoaded] = useState(false);
    const authTokenRef = useRef(null);
    const [currentAuthToken, setCurrentAuthToken] = useState(null);

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

        // Pre-load both APIs when the component mounts
        Promise.all([
            loadScript('https://apis.google.com/js/api.js'),
            loadScript('https://accounts.google.com/gsi/client')
        ]).then(() => {
            window.gapi.load('picker', { callback: () => setScriptsLoaded(true) });
        }).catch(() => {
            console.error('Failed to pre-load Google APIs');
        });
    }, []);

    const handleOpenGoogleDrive = () => {
        if (!scriptsLoaded) {
            alert('Google Drive connection is still initializing. Please wait a second and try again.');
            return;
        }

        setIsLoading(true);

        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;

        if (!clientId || !apiKey) {
            console.error('Google API credentials not configured');
            alert('Google Drive integration is not configured. Please set the IDs in your .env file.');
            setIsLoading(false);
            return;
        }

        // Now this executes completely synchronously on the click event!
        requestTokenAndShowPicker(clientId, apiKey);
    };


    const requestTokenAndShowPicker = (clientId, apiKey) => {
        try {
            const tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: 'https://www.googleapis.com/auth/drive.readonly',
                callback: (tokenResponse) => {
                    if (tokenResponse && tokenResponse.access_token) {
                        authTokenRef.current = tokenResponse.access_token;
                        setCurrentAuthToken(tokenResponse.access_token);
                        createPicker(clientId, apiKey, tokenResponse.access_token);
                    } else {
                        setIsLoading(false);
                        if (tokenResponse?.error !== 'user_canceled') {
                            alert('Google Authentication failed or was restricted.');
                        }
                    }
                },
            });
            tokenClient.requestAccessToken();
        } catch (error) {
            console.error('Error initializing token client:', error);
            setIsLoading(false);
            alert('Failed to initialize Google Authentication. Check your Client ID.');
        }
    };

    const createPicker = (clientId, apiKey, accessToken) => {
        try {
            const view = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS);
            
            // Filter by file types based on acceptTypes
            if (acceptTypes && acceptTypes !== '*') {
                const mimeTypes = getMimeTypesFromAcceptTypes(acceptTypes);
                view.setMimeTypes(mimeTypes.join(','));
            }

            // Google Picker requires the exact numeric Project Number (App ID), not the full client ID string.
            // On older projects this was the prefix of the client ID, but on newer ones it MUST be explicitly set
            const appId = import.meta.env.VITE_GOOGLE_APP_ID || clientId.split('-')[0];

            const pickerBuilder = new window.google.picker.PickerBuilder()
                .enableFeature(window.google.picker.Feature.NAV_HIDDEN)
                .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
                .setAppId(appId)
                .setOAuthToken(accessToken)
                .addView(view)
                .setDeveloperKey(apiKey)
                .setCallback(pickerCallback);

            const picker = pickerBuilder.build();
            picker.setVisible(true);
        } catch (error) {
            console.error('Error creating Google Picker widget:', error);
            setIsLoading(false);
            alert(`Google Drive connection failed.\n\nPlease ensure the "Google Picker API" is enabled in your Google Cloud Console.\n\nError details: ${error.message || error}`);
        }
    };

    const getMimeTypesFromAcceptTypes = (acceptTypes) => {
        const mimeMap = {
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'ppt': 'application/vnd.ms-powerpoint',
            'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'txt': 'text/plain',
            'csv': 'text/csv',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
        };

        return acceptTypes.split(',')
            .map(type => type.trim().toLowerCase().replace(/^\./, ''))
            .map(type => mimeMap[type] || type)
            .filter(Boolean);
    };

    const pickerCallback = (data) => {
        if (data.action === window.google.picker.Action.PICKED) {
            setIsLoading(true);
            const docs = data.docs;
            
            if (docs && docs.length > 0) {
                const processDocs = async () => {
                    try {
                        const tokenToUse = authTokenRef.current;
                        const downloadedFiles = await Promise.all(docs.map(async (doc) => {
                            let url;
                            let finalMimeType = doc.mimeType;
                            let finalName = doc.name;

                            if (doc.mimeType === 'application/vnd.google-apps.document') {
                                finalMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                                url = `https://www.googleapis.com/drive/v3/files/${doc.id}/export?mimeType=${finalMimeType}`;
                                if (!finalName.endsWith('.docx')) finalName += '.docx';
                            } else if (doc.mimeType === 'application/vnd.google-apps.spreadsheet') {
                                finalMimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                                url = `https://www.googleapis.com/drive/v3/files/${doc.id}/export?mimeType=${finalMimeType}`;
                                if (!finalName.endsWith('.xlsx')) finalName += '.xlsx';
                            } else if (doc.mimeType === 'application/vnd.google-apps.presentation') {
                                finalMimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
                                url = `https://www.googleapis.com/drive/v3/files/${doc.id}/export?mimeType=${finalMimeType}`;
                                if (!finalName.endsWith('.pptx')) finalName += '.pptx';
                            } else {
                                url = `https://www.googleapis.com/drive/v3/files/${doc.id}?alt=media`;
                            }

                            const res = await fetch(url, {
                                headers: { Authorization: `Bearer ${tokenToUse}` }
                            });
                            if (!res.ok) {
                                let errText = '';
                                try { errText = await res.text(); } catch(e){}
                                throw new Error(`Google Drive API error: ${res.status} ${errText}`);
                            }
                            const blob = await res.blob();
                            return new File([blob], finalName, { type: finalMimeType || blob.type || 'application/octet-stream' });
                        }));
                        
                        const fakeEvent = { target: { files: downloadedFiles, value: '' } };
                        onFileSelected(fakeEvent);
                    } catch (err) {
                        console.error("Failed to download file from Google Drive", err);
                        alert("Could not securely download your file from Google Drive. Ensure it is accessible.");
                    } finally {
                        setIsLoading(false);
                    }
                };
                processDocs();
            } else {
                setIsLoading(false);
            }
        } else if (data.action === window.google.picker.Action.CANCEL) {
            setIsLoading(false);
            console.log('Google Drive Picker cancelled');
        } else {
            // handle loading states safely
        }
    };

    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                if (!isLoading) handleOpenGoogleDrive();
            }}
            disabled={isLoading}
            style={{
                backgroundColor: baseBg,
                color: isLoading ? '#999' : brandColor,
                padding: '0.75rem',
                borderRadius: '50%',
                border: `1px solid ${borderColor}`,
                cursor: isLoading ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.15s, box-shadow 0.15s, background-color 0.2s',
                width: '42px',
                height: '42px',
                boxShadow: isLoading ? '0 6px 16px rgba(66, 133, 244, 0.1)' : '0 6px 16px rgba(66, 133, 244, 0.25)',
                opacity: isLoading ? 0.6 : 1,
            }}
            onMouseOver={(e) => {
                if (!isLoading) {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 10px 22px rgba(66, 133, 244, 0.35)';
                    e.currentTarget.style.backgroundColor = hoverBg;
                }
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(66, 133, 244, 0.25)';
                e.currentTarget.style.backgroundColor = baseBg;
            }}
            title={isLoading ? "Connecting to Google Drive..." : "Import from Google Drive"}
        >
            {isLoading ? (
                <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="none" stroke="#4285F4" strokeWidth="2" strokeDasharray="15.7 47.1" style={{ animation: 'spin 1s linear infinite' }} />
                </svg>
            ) : (
                <svg viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                    <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                    <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                    <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                    <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                    <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                    <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                </svg>
            )}
        </button>
    );
};

export default GoogleDrivePicker;