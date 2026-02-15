import React from 'react'
import { Link } from 'react-router-dom'

const Footer = () => {
    return (
        <footer style={{
            backgroundColor: 'var(--ag-navbar-bg)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            padding: '0.6rem 2rem',
            borderTop: '1px solid var(--ag-navbar-border)',
            marginTop: 'auto',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '0.75rem',
            color: 'var(--ag-text-secondary)',
            fontFamily: '"Nunito", sans-serif',
            position: 'relative',
            zIndex: 10,
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '1200px',
                flexWrap: 'wrap',
                gap: '0.5rem',
                alignItems: 'center',
            }}>
                <div style={{ whiteSpace: 'nowrap' }}>
                    Copyright © 2025 Xvert. All rights reserved.
                </div>
                <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    justifyContent: 'flex-end',
                }}>
                    {['Terms of Use', 'Cookie preferences', 'Privacy'].map((item, index) => (
                        <React.Fragment key={item}>
                            {index > 0 && <span style={{ color: 'var(--ag-glass-border)' }}>|</span>}
                            <Link
                                to={`/${item.toLowerCase().replace(/\s+/g, '-')}`}
                                style={{
                                    color: 'var(--ag-text-secondary)',
                                    textDecoration: 'none',
                                    transition: 'color 0.2s',
                                }}
                                onMouseOver={(e) => e.target.style.color = 'var(--ag-accent)'}
                                onMouseOut={(e) => e.target.style.color = 'var(--ag-text-secondary)'}
                            >
                                {item}
                            </Link>
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </footer>
    )
}

export default Footer
