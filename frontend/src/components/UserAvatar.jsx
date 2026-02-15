import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Clock as ClockIcon, LogOut } from 'lucide-react'

const springBounce = { type: 'spring', stiffness: 400, damping: 20 }

class MenuItem {
    constructor(label, action, icon = null, isDanger = false) {
        this.label = label
        this.action = action
        this.icon = icon
        this.isDanger = isDanger
    }
}

export default function UserAvatar({ session, onLogout }) {
    const [isOpen, setIsOpen] = useState(false)
    const [imgError, setImgError] = useState(false)
    const dropdownRef = useRef(null)
    const navigate = useNavigate()

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const toggleDropdown = () => setIsOpen(!isOpen)

    const menuItems = [
        new MenuItem('Profile', () => navigate('/profile'), User),
        new MenuItem('History', () => navigate('/history'), ClockIcon),
        new MenuItem('Logout', onLogout, LogOut, true),
    ]

    const handleItemClick = (item) => {
        setIsOpen(false)
        item.action()
    }

    const userEmail = session?.user?.email
    const userAvatarUrl = session?.user?.user_metadata?.avatar_url
    const fullName = session?.user?.user_metadata?.full_name || userEmail
    const userInitial = fullName ? fullName.charAt(0).toUpperCase() : '?'

    return (
        <div style={{ position: 'relative' }} ref={dropdownRef}>
            {/* Avatar Trigger */}
            <motion.div
                onClick={toggleDropdown}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                transition={springBounce}
                style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: `2px solid ${isOpen ? 'var(--ag-accent)' : 'var(--ag-glass-border)'}`,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'var(--ag-card-bg)',
                    backdropFilter: 'blur(8px)',
                    color: 'var(--ag-text)',
                    fontWeight: 700,
                    fontSize: '1.2rem',
                    cursor: 'pointer',
                    boxShadow: isOpen ? '0 0 20px var(--ag-accent-glow)' : 'none',
                    transition: 'border-color 0.3s, box-shadow 0.3s',
                }}
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
            </motion.div>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        style={{
                            position: 'absolute',
                            top: '55px',
                            right: '0',
                            background: 'var(--ag-megamenu-bg, rgba(235, 235, 250, 0.95))',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            borderRadius: '14px',
                            boxShadow: '0 12px 40px var(--ag-glass-shadow)',
                            width: '210px',
                            zIndex: 10000,
                            overflow: 'hidden',
                            border: '1px solid var(--ag-glass-border)',
                        }}
                    >
                        {/* User info header */}
                        <div style={{
                            padding: '1rem',
                            borderBottom: '1px solid var(--ag-glass-border)',
                            background: 'var(--ag-input-bg)',
                        }}>
                            <p style={{
                                margin: 0,
                                fontWeight: 700,
                                color: 'var(--ag-text)',
                                fontSize: '0.9rem',
                            }}>Account</p>
                            <p style={{
                                margin: 0,
                                fontSize: '0.75rem',
                                color: 'var(--ag-text-secondary)',
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                            }}>{userEmail}</p>
                        </div>

                        {/* Menu items */}
                        <ul style={{ listStyle: 'none', padding: '0.4rem 0', margin: 0 }}>
                            {menuItems.map((item, index) => {
                                const Icon = item.icon
                                return (
                                    <li key={index}>
                                        <motion.button
                                            onClick={() => handleItemClick(item)}
                                            whileHover={{
                                                x: 4,
                                                backgroundColor: item.isDanger
                                                    ? 'rgba(255, 82, 82, 0.1)'
                                                    : 'var(--ag-input-bg)',
                                            }}
                                            transition={{ duration: 0.15 }}
                                            style={{
                                                width: '100%',
                                                textAlign: 'left',
                                                padding: '0.7rem 1rem',
                                                border: 'none',
                                                background: 'none',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.75rem',
                                                color: item.isDanger ? '#ff5252' : 'var(--ag-text)',
                                                fontSize: '0.9rem',
                                                fontFamily: '"Nunito", sans-serif',
                                                fontWeight: 600,
                                            }}
                                        >
                                            <Icon size={16} />
                                            {item.label}
                                        </motion.button>
                                    </li>
                                )
                            })}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
