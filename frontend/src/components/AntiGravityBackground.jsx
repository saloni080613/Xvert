import { useEffect, useState } from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'

const ORBS = [
    { size: 320, x: '10%', y: '15%', color: 'var(--ag-orb1)', duration: 18 },
    { size: 250, x: '75%', y: '20%', color: 'var(--ag-orb2)', duration: 22 },
    { size: 200, x: '60%', y: '70%', color: 'var(--ag-orb3)', duration: 20 },
    { size: 280, x: '25%', y: '75%', color: 'var(--ag-orb4)', duration: 25 },
    { size: 180, x: '85%', y: '55%', color: 'var(--ag-orb1)', duration: 16 },
    { size: 160, x: '40%', y: '40%', color: 'var(--ag-orb2)', duration: 24 },
]

const SHARDS = [
    { w: 120, h: 180, x: '15%', y: '25%', rotate: 25, duration: 14 },
    { w: 80, h: 200, x: '70%', y: '15%', rotate: -15, duration: 18 },
    { w: 100, h: 140, x: '80%', y: '65%', rotate: 40, duration: 16 },
    { w: 90, h: 160, x: '30%', y: '60%', rotate: -30, duration: 20 },
    { w: 60, h: 120, x: '50%', y: '80%', rotate: 55, duration: 15 },
]

export default function AntiGravityBackground({ children }) {
    const mouseX = useMotionValue(0.5)
    const mouseY = useMotionValue(0.5)

    // Parallax transforms — very subtle movement
    const bgX = useTransform(mouseX, [0, 1], [10, -10])
    const bgY = useTransform(mouseY, [0, 1], [10, -10])
    const orbX = useTransform(mouseX, [0, 1], [15, -15])
    const orbY = useTransform(mouseY, [0, 1], [15, -15])
    const shardX = useTransform(mouseX, [0, 1], [20, -20])
    const shardY = useTransform(mouseY, [0, 1], [20, -20])

    useEffect(() => {
        const handleMouseMove = (e) => {
            mouseX.set(e.clientX / window.innerWidth)
            mouseY.set(e.clientY / window.innerHeight)
        }
        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [mouseX, mouseY])

    return (
        <div style={{
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Layer 1: Base gradient (shifts with mouse) */}
            <motion.div
                style={{
                    position: 'fixed',
                    inset: '-20px',
                    background: 'linear-gradient(135deg, var(--ag-bg-start), var(--ag-bg-mid), var(--ag-bg-end))',
                    x: bgX,
                    y: bgY,
                    zIndex: 0,
                    transition: 'background 0.35s ease',
                }}
            />

            {/* Layer 2: Glowing orbs */}
            <motion.div
                style={{
                    position: 'fixed',
                    inset: 0,
                    x: orbX,
                    y: orbY,
                    zIndex: 1,
                    pointerEvents: 'none',
                }}
            >
                {ORBS.map((orb, i) => (
                    <motion.div
                        key={`orb-${i}`}
                        style={{
                            position: 'absolute',
                            left: orb.x,
                            top: orb.y,
                            width: orb.size,
                            height: orb.size,
                            borderRadius: '50%',
                            background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
                            filter: 'blur(40px)',
                        }}
                        animate={{
                            x: [0, 60 * (i % 2 === 0 ? 1 : -1), -30 * (i % 2 === 0 ? 1 : -1), 0],
                            y: [0, -40 * (i % 2 === 0 ? -1 : 1), 30, 0],
                            scale: [1, 1.08, 0.95, 1],
                        }}
                        transition={{
                            duration: orb.duration,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    />
                ))}
            </motion.div>

            {/* Layer 3: Glass shards */}
            <motion.div
                style={{
                    position: 'fixed',
                    inset: 0,
                    x: shardX,
                    y: shardY,
                    zIndex: 2,
                    pointerEvents: 'none',
                }}
            >
                {SHARDS.map((shard, i) => (
                    <motion.div
                        key={`shard-${i}`}
                        style={{
                            position: 'absolute',
                            left: shard.x,
                            top: shard.y,
                            width: shard.w,
                            height: shard.h,
                            borderRadius: '12px',
                            background: 'var(--ag-shard-bg)',
                            border: '1px solid var(--ag-shard-border)',
                            backdropFilter: 'blur(4px)',
                            WebkitBackdropFilter: 'blur(4px)',
                        }}
                        animate={{
                            rotate: [shard.rotate, shard.rotate + 5, shard.rotate - 3, shard.rotate],
                            y: [0, -25, 10, 0],
                        }}
                        transition={{
                            duration: shard.duration,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    />
                ))}
            </motion.div>

            {/* Content layer */}
            <div style={{ position: 'relative', zIndex: 10 }}>
                {children}
            </div>
        </div>
    )
}
