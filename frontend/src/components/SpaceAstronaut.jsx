import { motion, AnimatePresence } from 'framer-motion'

const astronautVariants = {
    idle: {
        y: [0, -8, 0],
        rotate: [0, 2, -2, 0],
        transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' }
    },
    fileUploaded: {
        y: [0, -15, 0],
        rotate: [0, 10, -10, 5, 0],
        scale: [1, 1.1, 1],
        transition: { duration: 1.2, ease: 'easeInOut' }
    },
    converting: {
        rotate: [0, 360],
        transition: { duration: 2, repeat: Infinity, ease: 'linear' }
    },
    success: {
        y: [0, -20, 0],
        scale: [1, 1.15, 1],
        transition: { duration: 0.8, ease: 'easeOut' }
    },
    error: {
        x: [0, -10, 10, -6, 6, 0],
        transition: { duration: 0.6 }
    }
}

// Emoji states for astronaut reactions
const MASCOT_FACES = {
    idle: '🧑‍🚀',
    fileUploaded: '🎉',
    converting: '🚀',
    success: '✨',
    error: '😵'
}

const MASCOT_TEXT = {
    idle: 'Ready to convert!',
    fileUploaded: 'File received!',
    converting: 'Converting...',
    success: 'Done!',
    error: 'Oops!'
}

export default function SpaceAstronaut({ state = 'idle' }) {
    return (
        <motion.div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                userSelect: 'none',
                pointerEvents: 'none',
            }}
            variants={astronautVariants}
            animate={state}
        >
            {/* Astronaut body */}
            <motion.div
                style={{
                    position: 'relative',
                    width: '80px',
                    height: '80px',
                }}
            >
                {/* Helmet */}
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1))',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    border: '2px solid rgba(255,255,255,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 30px var(--ag-accent-glow), inset 0 0 20px rgba(255,255,255,0.1)',
                    overflow: 'hidden',
                }}>
                    {/* Visor with reflection */}
                    <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #1a1a3e 0%, #2d1b69 40%, #4a2c8a 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                    }}>
                        {/* Visor reflection */}
                        <div style={{
                            position: 'absolute',
                            top: '8px',
                            left: '10px',
                            width: '18px',
                            height: '8px',
                            background: 'rgba(255,255,255,0.25)',
                            borderRadius: '50%',
                            transform: 'rotate(-20deg)',
                        }} />
                        {/* Face emoji */}
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={state}
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0, rotate: 180 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                                style={{ fontSize: '1.8rem', zIndex: 1 }}
                            >
                                {MASCOT_FACES[state] || MASCOT_FACES.idle}
                            </motion.span>
                        </AnimatePresence>
                    </div>
                </div>

                {/* Left arm */}
                <motion.div
                    style={{
                        position: 'absolute',
                        left: '-12px',
                        top: '50px',
                        width: '16px',
                        height: '28px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.08))',
                        border: '1px solid rgba(255,255,255,0.2)',
                        transformOrigin: 'top center',
                    }}
                    animate={state === 'fileUploaded' ? {
                        rotate: [0, -30, 20, -20, 0],
                        transition: { duration: 1, repeat: 2 }
                    } : {
                        rotate: [0, -5, 5, 0],
                        transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' }
                    }}
                />

                {/* Right arm */}
                <motion.div
                    style={{
                        position: 'absolute',
                        right: '-12px',
                        top: '50px',
                        width: '16px',
                        height: '28px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.08))',
                        border: '1px solid rgba(255,255,255,0.2)',
                        transformOrigin: 'top center',
                    }}
                    animate={state === 'success' ? {
                        rotate: [0, -45],
                        y: [0, -5],
                        transition: { duration: 0.4 }
                    } : {
                        rotate: [0, 5, -5, 0],
                        transition: { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }
                    }}
                />

                {/* Sparkles on success/upload */}
                {(state === 'success' || state === 'fileUploaded') && (
                    <>
                        {[...Array(5)].map((_, i) => (
                            <motion.div
                                key={i}
                                style={{
                                    position: 'absolute',
                                    width: '4px',
                                    height: '4px',
                                    borderRadius: '50%',
                                    background: 'var(--ag-accent)',
                                    boxShadow: '0 0 6px var(--ag-accent-glow)',
                                }}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{
                                    opacity: [0, 1, 0],
                                    scale: [0, 1.5, 0],
                                    x: [0, (Math.random() - 0.5) * 80],
                                    y: [0, (Math.random() - 0.5) * 80],
                                }}
                                transition={{
                                    duration: 1,
                                    delay: i * 0.15,
                                    repeat: state === 'success' ? 0 : 2,
                                }}
                            />
                        ))}
                    </>
                )}
            </motion.div>

            {/* Speech bubble */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={state}
                    initial={{ opacity: 0, y: 5, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.8 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    style={{
                        padding: '0.35rem 0.8rem',
                        borderRadius: '12px',
                        background: 'var(--ag-glass-bg)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        border: '1px solid var(--ag-glass-border)',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: 'var(--ag-text)',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {MASCOT_TEXT[state] || MASCOT_TEXT.idle}
                </motion.div>
            </AnimatePresence>
        </motion.div>
    )
}
