import { Link } from 'react-router-dom';
import { useState } from 'react';
import MegaMenu from './MegaMenu';
import Logo from './Logo';

/**
 * NavigationItem Class
 */
class NavigationItem {
    constructor(label, action, id = null) {
        this.label = label;
        this.action = action;
        this.id = id;
    }
}

/**
 * Navbar Component
 */
export default function Navbar({ tools, onToolSelect, onReset, session, UserAvatarComponent }) {

    const [activeMenu, setActiveMenu] = useState(null);

    // Define navigation items
    const navItems = [
        new NavigationItem('All Tools', () => setActiveMenu(activeMenu === 'all-tools' ? null : 'all-tools')),
        new NavigationItem('Convert PDF', () => setActiveMenu(activeMenu === 'convert-pdf' ? null : 'convert-pdf')),
        new NavigationItem('Merge PDF', () => onToolSelect(tools.find(t => t.id === 'merge-pdf')), 'merge-pdf'),
        new NavigationItem('PDF to Word', () => onToolSelect(tools.find(t => t.id === 'pdf-to-word')), 'pdf-to-word'),
        new NavigationItem('Image to PDF', () => onToolSelect(tools.find(t => t.id === 'image-to-pdf')), 'image-to-pdf'),
    ];

    return (
        <header style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 2rem',
            backgroundColor: '#fff',
            borderBottom: '1px solid #e0e0e0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.03)', // Lighter shadow
            position: 'sticky',
            top: 0,
            zIndex: 100,
            height: '70px'
        }}>
            {/* Logo and Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
                {/* Logo */}
                <div
                    onClick={onReset}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}
                >
                    <Logo width={36} height={36} />
                    <h1 style={{
                        fontFamily: '"Outfit", sans-serif',
                        fontSize: '1.6rem',
                        margin: 0,
                        color: '#1D3557', // Navy
                        fontWeight: '800',
                        letterSpacing: '-0.5px'
                    }}>Xvert</h1>
                </div>

                {/* Navigation Links */}
                <nav style={{ display: 'flex', gap: '0.5rem' }}>
                    {navItems.map((item, index) => {
                        const isActive = (item.label === 'All Tools' && activeMenu === 'all-tools') ||
                            (item.label === 'Convert PDF' && activeMenu === 'convert-pdf');

                        return (
                            <div
                                key={index}
                                onClick={item.action}
                                role="button"
                                tabIndex={0}
                                style={{
                                    background: isActive ? '#E3F2FD' : 'transparent', // Light Blue bg when active
                                    border: 'none',
                                    borderRadius: '20px',
                                    cursor: 'pointer',
                                    fontSize: '0.95rem',
                                    fontWeight: '600',
                                    color: isActive ? '#1D3557' : '#4a5568',
                                    fontFamily: '"Outfit", sans-serif',
                                    padding: '0.5rem 1rem',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    userSelect: 'none'
                                }}
                                onMouseOver={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.backgroundColor = '#F7F9FC';
                                        e.currentTarget.style.color = '#1D3557';
                                    }
                                }}
                                onMouseOut={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                        e.currentTarget.style.color = '#4a5568';
                                    }
                                }}
                                onKeyDown={(e) => e.key === 'Enter' && item.action()}
                            >
                                {item.label}
                                {(item.label === 'All Tools' || item.label === 'Convert PDF') && (
                                    <span style={{
                                        fontSize: '0.7em',
                                        transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.2s',
                                        opacity: 0.7
                                    }}>▼</span>
                                )}
                            </div>
                        );
                    })}
                </nav>
            </div>

            {/* User Section (Session/Auth) */}
            <div>
                {session ? (
                    UserAvatarComponent
                ) : (
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Link to="/login" style={{
                            textDecoration: 'none',
                            backgroundColor: '#A8DADC', // Light Blue Pill Button
                            color: '#1D3557', // Navy Text
                            padding: '0.7rem 2rem',
                            borderRadius: '50px',
                            fontSize: '1.1rem',
                            fontWeight: '700',
                            fontFamily: '"Nunito", sans-serif',
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                        }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.backgroundColor = '#98C9DC';
                                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.backgroundColor = '#A8DADC';
                                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                            }}
                        >Log in</Link>

                        <Link to="/signup" style={{
                            textDecoration: 'none',
                            backgroundColor: '#A8DADC', // Light Blue Pill Button
                            color: '#1D3557', // Navy Text
                            padding: '0.7rem 2rem',
                            borderRadius: '50px',
                            fontSize: '1.1rem',
                            fontWeight: '700',
                            fontFamily: '"Nunito", sans-serif',
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                        }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.backgroundColor = '#98C9DC';
                                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.backgroundColor = '#A8DADC';
                                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                            }}
                        >Sign Up</Link>
                    </div>
                )}
            </div>

            {/* Mega Menu Dropdown */}
            {activeMenu && (
                <MegaMenu
                    tools={tools}
                    activeMenu={activeMenu}
                    onToolSelect={onToolSelect}
                    onClose={() => setActiveMenu(null)}
                />
            )}
        </header>
    );
}
