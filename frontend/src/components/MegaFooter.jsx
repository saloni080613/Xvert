import React from 'react';
import { Link } from 'react-router-dom';


const MegaFooter = () => {


    const linkStyle = {
        color: '#4b5563', // Gray-600
        textDecoration: 'none',
        fontSize: '0.92rem', // Increased from 0.85rem
        marginBottom: '0.7rem', // Tad more spacing
        display: 'block',
        fontFamily: '"Nunito", sans-serif',
        transition: 'color 0.2s'
    };

    const headingStyle = {
        color: '#1D3557', // Navy
        fontSize: '1.05rem', // Increased from 0.95rem
        fontWeight: '700',
        marginBottom: '1.2rem', // Tad more spacing
        fontFamily: '"Outfit", sans-serif'
    };

    return (
        <div style={{
            backgroundColor: '#FAFAFA', // Very light gray/off-white
            borderTop: '1px solid #e5e7eb',
            paddingTop: '3rem',
            marginTop: 'auto'
        }}>
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                padding: '0 2rem 3rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '2rem'
            }}>
                {/* Column 1: Shop For */}
                <div>
                    <h3 style={headingStyle}>Shop for</h3>
                    <Link to="/" style={linkStyle}>Xvert Cloud</Link>
                    <Link to="/" style={linkStyle}>Image Editor</Link>
                    <Link to="/" style={linkStyle}>Xvert Express</Link>
                    <Link to="/" style={linkStyle}>Photography</Link>
                    <Link to="/" style={linkStyle}>Video Editor</Link>
                    <Link to="/" style={linkStyle}>Xvert Stock</Link>
                    <Link to="/" style={linkStyle}>Xvert Family</Link>
                    <Link to="/" style={linkStyle} onMouseOver={e => e.target.style.color = '#1D3557'} onMouseOut={e => e.target.style.color = '#4b5563'}>View all products</Link>
                </div>

                {/* Column 2: For Business */}
                <div>
                    <h3 style={headingStyle}>For Business</h3>
                    <Link to="/" style={linkStyle}>Xvert Cloud for business</Link>
                    <Link to="/" style={linkStyle}>Xvert Cloud for enterprise</Link>
                    <Link to="/" style={linkStyle}>Xvert PDF for business</Link>
                </div>

                {/* Column 3: Education & Mobile */}
                <div>
                    <h3 style={headingStyle}>For Education</h3>
                    <Link to="/" style={linkStyle}>Discounts for students and teachers</Link>
                    <Link to="/" style={linkStyle}>Schools and universities</Link>
                    <Link to="/" style={linkStyle}>Digital Learning Solutions</Link>

                    <h3 style={{ ...headingStyle, marginTop: '1.5rem' }}>For Mobile</h3>
                    <Link to="/" style={linkStyle}>Apps for iOS</Link>
                    <Link to="/" style={linkStyle}>Apps for Android</Link>
                </div>

                {/* Column 4: Xvert Experience */}
                <div>
                    <h3 style={headingStyle}>Xvert Experience</h3>
                    <Link to="/" style={linkStyle}>What is Xvert Experience?</Link>
                    <Link to="/" style={linkStyle}>Analytics</Link>
                    <Link to="/" style={linkStyle}>Marketing Suite</Link>
                    <Link to="/" style={linkStyle}>Commerce</Link>
                </div>

                {/* Column 5: Support & Company */}
                <div>
                    <h3 style={headingStyle}>Support</h3>
                    <Link to="/" style={linkStyle}>Help Center</Link>
                    <Link to="/" style={linkStyle}>Community</Link>
                    <Link to="/" style={linkStyle}>Download and Install</Link>

                    <h3 style={{ ...headingStyle, marginTop: '1.5rem' }}>Xvert</h3>
                    <Link to="/" style={linkStyle}>Home</Link>
                    <Link to="/about" style={linkStyle}>About Xvert</Link>
                    <Link to="/" style={linkStyle}>Careers</Link>
                    <Link to="/" style={linkStyle}>Newsroom</Link>
                </div>
            </div>

            {/* Featured Products Strip */}


            {/* Copyright / Legal Strip */}
            <div style={{
                borderTop: '1px solid #e5e7eb',
                padding: '1.5rem 2rem',
                backgroundColor: '#FAFAFA' // Keep consistent with mega footer bg
            }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    fontSize: '0.95rem', // Increased from 0.9rem
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
        </div>
    );
};

export default MegaFooter;
