import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { FaUser, FaHistory, FaSignOutAlt } from 'react-icons/fa';

/**
 * MenuItem Class (OOP: Encapsulation of Menu Item Data)
 */
class MenuItem {
    constructor(label, action, icon = null, isDanger = false) {
        this.label = label;
        this.action = action;
        this.icon = icon;
        this.isDanger = isDanger;
    }
}

/**
 * UserAvatar Component
 * Encapsulates the user avatar display and dropdown menu logic.
 */
export default function UserAvatar({ session, onLogout }) {
    const [isOpen, setIsOpen] = useState(false);
    const [imgError, setImgError] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    const toggleDropdown = () => setIsOpen(!isOpen);

    // Menu Items Definition (OOP: Data and Behavior separation)
    const menuItems = [
        new MenuItem('Profile', () => navigate('/profile'), <FaUser size={22} />),
        new MenuItem('History', () => navigate('/history'), <FaHistory size={22} />),
        new MenuItem('Logout', onLogout, <FaSignOutAlt size={22} />, true)
    ];

    const handleItemClick = (item) => {
        setIsOpen(false);
        item.action();
    };

    const userEmail = session?.user?.email;
    const userAvatarUrl = session?.user?.user_metadata?.avatar_url;
    const fullName = session?.user?.user_metadata?.full_name || userEmail;
    const userInitial = fullName ? fullName.charAt(0).toUpperCase() : '?';

    return (
        <div style={{ position: 'relative' }} ref={dropdownRef}>
            {/* Avatar Trigger */}
            <div
                onClick={toggleDropdown}
                style={{
                    width: '45px',
                    height: '45px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '2px solid #E8D5B5',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#fff',
                    color: '#2d3e50',
                    fontWeight: 'bold',
                    fontSize: '1.4rem',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    boxShadow: isOpen ? '0 0 0 4px rgba(232, 213, 181, 0.4)' : 'none'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                title={userEmail}
            >
                {userAvatarUrl && !imgError ? (
                    <img
                        src={userAvatarUrl}
                        alt="User"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <span>{userInitial}</span>
                )}
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '60px',
                    right: '0',
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    width: '240px',
                    zIndex: 1000,
                    overflow: 'hidden',
                    border: '1px solid #eee',
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    <div style={{
                        padding: '1rem',
                        borderBottom: '1px solid #eee',
                        backgroundColor: '#f9f9f9'
                    }}>
                        <p style={{ margin: 0, fontWeight: 'bold', color: '#1D3557', fontSize: '1rem', marginBottom: '4px' }}>Account</p>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#444', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{userEmail}</p>
                    </div>

                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {menuItems.map((item, index) => (
                            <li key={index}>
                                <button
                                    onClick={() => handleItemClick(item)}
                                    style={{
                                        width: '100%',
                                        textAlign: 'left',
                                        padding: '0.8rem 1rem',
                                        border: 'none',
                                        background: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.8rem',
                                        color: item.isDanger ? '#D32F2F' : '#333',
                                        fontSize: '1.2rem',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = item.isDanger ? '#FFEBEE' : '#F5F5F5'}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <span>{item.icon}</span>
                                    {item.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Simple animation styles */}
            <style>
                {`
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(-10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `}
            </style>
        </div>
    );
}
