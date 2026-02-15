import { motion } from 'framer-motion'

/**
 * Glassmorphism skeleton loader — used while data is loading.
 * Accepts `width`, `height`, `borderRadius`, and `style` props.
 */
export default function SkeletonLoader({
    width = '100%',
    height = '1.2rem',
    borderRadius = '8px',
    style = {},
    count = 1,
}) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <motion.div
                    key={i}
                    style={{
                        width,
                        height,
                        borderRadius,
                        background: `linear-gradient(90deg, var(--ag-skeleton-base) 0%, var(--ag-skeleton-shine) 50%, var(--ag-skeleton-base) 100%)`,
                        backgroundSize: '200% 100%',
                        ...style,
                    }}
                    animate={{
                        backgroundPosition: ['200% 0', '-200% 0'],
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            ))}
        </>
    )
}
