import React from 'react';
import { Link } from 'react-router-dom';

const MiniFooter = () => {
    return (
        <div style={{
            borderTop: '1px solid #e5e7eb',
            padding: '1.5rem 2rem',
            backgroundColor: '#FAFAFA',
            marginTop: 'auto'
        }}>
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                fontSize: '0.9rem',
                color: '#666',
                fontFamily: '"Nunito", sans-serif'
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
        </div>
    );
};

export default MiniFooter;
