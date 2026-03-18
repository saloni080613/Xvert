import React, { useState } from 'react';
import { useTheme } from './ThemeContext';

const GoogleDrivePicker = ({ onFileSelected, acceptTypes, multiselect = false }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const baseBg = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)';
    const hoverBg = isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.12)';
    const borderColor = isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.12)';
    const brandColor = '#4285F4';
    const [isLoading, setIsLoading] = useState(false);

    const handleOpenGoogleDrive = () => {
        setIsLoading(true);

        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;

        if (!clientId || !apiKey) {
            console.error('Google API credentials not configured');
            alert('Google Drive integration is not configured. Please set VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_API_KEY in your .env file.');
            setIsLoading(false);
            return;
        }

        // Load Google API client library
        if (!window.gapi) {
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.async = true;
            script.defer = true;
            script.onload = () => initGooglePicker(clientId, apiKey);
            script.onerror = () => {
                console.error('Failed to load Google API');
                alert('Failed to load Google Drive picker');
                setIsLoading(false);
            };
            document.head.appendChild(script);
        } else {
            initGooglePicker(clientId, apiKey);
        }
    };

    const initGooglePicker = (clientId, apiKey) => {
        window.gapi.load('picker', { callback: () => createPicker(clientId, apiKey) });
    };

    const createPicker = (clientId, apiKey) => {
        const view = new window.google.picker.View(window.google.picker.ViewType.DOCS);
        
        // Filter by file types based on acceptTypes
        if (acceptTypes && acceptTypes !== '*') {
            const mimeTypes = getMimeTypesFromAcceptTypes(acceptTypes);
            mimeTypes.forEach(mimeType => {
                view.addMimeType(mimeType);
            });
        }

        const pickerBuilder = new window.google.picker.PickerBuilder()
            .enableFeature(window.google.picker.Feature.NAV_HIDDEN)
            .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
            .setAppId(clientId)
            .setOAuthToken(getOAuthToken())
            .addView(view)
            .setDeveloperKey(apiKey)
            .setCallback(pickerCallback);

        pickerBuilder.build().setVisible(true);
    };

    const getOAuthToken = () => {
        // In a real implementation, you would get this from Google Sign-In
        // For now, we'll attempt to use gapi.auth2
        if (window.gapi?.auth2?.getAuthInstance?.()) {
            return window.gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
        }
        return null;
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
            .map(type => type.trim().toLowerCase())
            .map(type => mimeMap[type] || type)
            .filter(Boolean);
    };

    const pickerCallback = (data) => {
        setIsLoading(false);

        if (data.action === window.google.picker.Action.PICKED) {
            const docs = data.docs;
            if (docs && docs.length > 0) {
                const selectedFiles = docs.map(doc => ({
                    name: doc.getName(),
                    url: `https://drive.google.com/uc?id=${doc.getId()}&export=download`,
                    id: doc.getId()
                }));

                if (multiselect) {
                    onFileSelected(selectedFiles);
                } else {
                    onFileSelected(selectedFiles[0]);
                }
            }
        } else if (data.action === window.google.picker.Action.CANCEL) {
            console.log('Google Drive Picker cancelled');
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
                <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    {/* Official Google Drive Logo - Three equilateral triangles */}
                    {/* Blue - top-left triangle */}
                    <path d="M10 8L24 22L10 22Z" fill="#4285F4"/>
                    {/* Green - bottom-left triangle */}
                    <path d="M10 22L24 36L10 36Z" fill="#34A853"/>
                    {/* Yellow - right triangle */}
                    <path d="M24 22L38 36L24 36Z" fill="#FBBC04"/>
                </svg>
            )}
        </button>
    );
};

export default GoogleDrivePicker;