import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer style={{
            backgroundColor: '#ffffff',
            padding: '0.4rem 2rem', // Further reduced padding
            borderTop: '1px solid #e0e0e0',
            marginTop: 'auto',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '0.75rem', // Reduced font size
            color: '#666',
            fontFamily: '"Nunito", sans-serif'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '1200px',
                flexWrap: 'wrap',
                gap: '0.5rem', // Reduced gap
                alignItems: 'center'
            }}>
                <div style={{ whiteSpace: 'nowrap' }}>
                    Copyright © 2025 Xvert. All rights reserved.
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <Link to="/terms" style={{ color: '#666', textDecoration: 'none' }}>Terms of Use</Link>
                    <span style={{ color: '#ccc' }}>|</span>
                    <Link to="/cookies" style={{ color: '#666', textDecoration: 'none' }}>Cookie preferences</Link>
                    <span style={{ color: '#ccc' }}>|</span>
                    <Link to="/privacy" style={{ color: '#666', textDecoration: 'none' }}>Privacy</Link>
                    <span style={{ color: '#ccc' }}>|</span>
                    <Link to="/privacy-choices" style={{ color: '#666', textDecoration: 'none' }}>Do not sell or share my personal information</Link>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
