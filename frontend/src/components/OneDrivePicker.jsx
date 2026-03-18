import React, { useState } from 'react';
import { useTheme } from './ThemeContext';

const OneDrivePicker = ({ onFileSelected, acceptTypes, multiselect = false }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const baseBg = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)';
    const hoverBg = isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.12)';
    const borderColor = isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.12)';
    const brandColor = '#0078D4';
    const [isLoading, setIsLoading] = useState(false);

    const handleOpenOneDrive = () => {
        setIsLoading(true);

        const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID;
        if (!clientId) {
            console.error('Microsoft Graph credentials not configured');
            alert('OneDrive integration is not configured. Please set VITE_MICROSOFT_CLIENT_ID in your .env file.');
            setIsLoading(false);
            return;
        }

        // Load OneDrive picker SDK
        if (!window.OneDrive) {
            const script = document.createElement('script');
            script.src = 'https://js.live.net/v7.2/OneDrive.js';
            script.async = true;
            script.defer = true;
            script.onload = () => initOneDrivePicker();
            script.onerror = () => {
                console.error('Failed to load OneDrive SDK');
                alert('Failed to load OneDrive picker');
                setIsLoading(false);
            };
            document.head.appendChild(script);
        } else {
            initOneDrivePicker();
        }
    };

    const initOneDrivePicker = () => {
        const odOptions = {
            clientId: import.meta.env.VITE_MICROSOFT_CLIENT_ID,
            action: "query",
            multiSelect: multiselect,
            openInNewWindow: true,
            advanced: {
                redirectUri: window.location.origin,
                filter: acceptTypes && acceptTypes !== '*' ? buildMimeTypeFilter(acceptTypes) : null
            },
            success: onPicked,
            cancel: onCancelled,
            error: onError
        };

        // Use the OneDrive picker
        if (window.OneDrive?.open) {
            window.OneDrive.open(odOptions);
        } else {
            console.error('OneDrive picker not available');
            setIsLoading(false);
        }
    };

    const buildMimeTypeFilter = (acceptTypes) => {
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
            .filter(Boolean)
            .join(',');
    };

    const onPicked = (response) => {
        setIsLoading(false);

        if (response.value && response.value.length > 0) {
            const selectedFiles = response.value.map(item => ({
                name: item.name,
                url: item['@microsoft.graph.downloadUrl'],
                id: item.id,
                webUrl: item.webUrl
            }));

            if (multiselect) {
                onFileSelected(selectedFiles);
            } else {
                onFileSelected(selectedFiles[0]);
            }
        }
    };

    const onCancelled = () => {
        setIsLoading(false);
        console.log('OneDrive picker cancelled');
    };

    const onError = (error) => {
        setIsLoading(false);
        console.error('OneDrive picker error:', error);
        alert('An error occurred while accessing OneDrive: ' + (error?.message || 'Unknown error'));
    };

    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                if (!isLoading) handleOpenOneDrive();
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
                boxShadow: isLoading ? '0 6px 16px rgba(0, 120, 212, 0.1)' : '0 6px 16px rgba(0, 120, 212, 0.25)',
                opacity: isLoading ? 0.6 : 1,
            }}
            onMouseOver={(e) => {
                if (!isLoading) {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 10px 22px rgba(0, 120, 212, 0.35)';
                    e.currentTarget.style.backgroundColor = hoverBg;
                }
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 120, 212, 0.25)';
                e.currentTarget.style.backgroundColor = baseBg;
            }}
            title={isLoading ? "Connecting to OneDrive..." : "Import from OneDrive"}
        >
            {isLoading ? (
                <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="none" stroke="#0078D4" strokeWidth="2" strokeDasharray="15.7 47.1" style={{ animation: 'spin 1s linear infinite' }} />
                </svg>
            ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 8C18 5.2 15.8 3 13 3C10.7 3 8.8 4.5 8.1 6.6C6 6.8 4.5 8.8 4.5 11C4.5 13.8 6.7 16 9.5 16H18C20.2 16 22 14.2 22 12C22 10.1 20.7 8.6 18.9 8.2C18.7 8.1 18.4 8 18 8Z" fill="#0078D4"/>
                </svg>
            )}
        </button>
    );
};

export default OneDrivePicker;