import React, { useEffect } from 'react';
import { useTheme } from './ThemeContext';

const DropboxPicker = ({ onFileSelected, acceptTypes, multiselect = false, buttonText = "Import from Dropbox" }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const baseBg = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)';
    const hoverBg = isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.12)';
    const borderColor = isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.12)';
    const brandColor = '#0061FE';

    useEffect(() => {
        // Attempt to initialize or re-initialize Dropbox if it failed on load (e.g. strict mode or fast refresh)
        if (window.Dropbox && !window.Dropbox.appKey) {
            console.warn("Dropbox script loaded but app key missing in Initialization. Ensure VITE_DROPBOX_APP_KEY is set in .env.");
        }
    }, []);

    const handleOpenDropbox = () => {
        if (!window.Dropbox) {
            alert("Dropbox Chooser script not loaded. Please check your internet connection or ad blocker.");
            return;
        }

        const options = {
            success: function (files) {
                // Return an array of files or just the first one depending on multiselect
                if (multiselect) {
                    onFileSelected(files);
                } else {
                    onFileSelected(files[0] || null);
                }
            },
            cancel: function () {
                console.log("Dropbox Chooser cancelled.");
            },
            linkType: "direct", // Get a direct download URL
            multiselect: multiselect,
            extensions: acceptTypes === '*' ? [] : acceptTypes.split(','),
            folderselect: false,
        };

        window.Dropbox.choose(options);
    };

    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                handleOpenDropbox();
            }}
            style={{
                backgroundColor: baseBg,
                color: brandColor,
                padding: '0.75rem',
                borderRadius: '50%',
                border: `1px solid ${borderColor}`,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.15s, box-shadow 0.15s, background-color 0.2s',
                width: '42px',
                height: '42px',
                boxShadow: `0 6px 16px rgba(0, 97, 254, 0.25)`,
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 10px 22px rgba(0, 97, 254, 0.35)';
                e.currentTarget.style.backgroundColor = hoverBg;
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 97, 254, 0.25)';
                e.currentTarget.style.backgroundColor = baseBg;
            }}
            title="Import from Dropbox"
        >
            <svg width="20" height="20" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                {/* Official Dropbox Logo - 4 white diamonds overlapping */}
                {/* Top left diamond */}
                <path d="M10 6L16 10L10 14L4 10Z" fill="white"/>
                {/* Top right diamond */}
                <path d="M30 6L36 10L30 14L24 10Z" fill="white"/>
                {/* Middle diamond (overlapping) */}
                <path d="M20 12L26 16L20 20L14 16Z" fill="white"/>
                {/* Bottom diamond */}
                <path d="M20 20L26 24L20 28L14 24Z" fill="white"/>
            </svg>
        </button>
    );
};

export default DropboxPicker;
