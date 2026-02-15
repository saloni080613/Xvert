import React from 'react';

const SpeedArt = () => (
    <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto' }}>
        <rect width="400" height="300" fill="#F0F9FF" rx="16" />
        <path d="M50 250L150 50L250 200L350 100" stroke="#1D3557" strokeWidth="4" strokeLinecap="round" strokeDasharray="10 10" opacity="0.2" />
        <path d="M50 220L350 70" stroke="#457B9D" strokeWidth="6" strokeLinecap="round" />
        <rect x="330" y="50" width="40" height="40" rx="8" fill="#E63946" transform="rotate(15 350 70)" />
        <circle cx="50" cy="220" r="8" fill="#1D3557" />
        <path d="M280 150L320 150" stroke="#A8DADC" strokeWidth="4" strokeLinecap="round" />
        <path d="M290 170L330 170" stroke="#A8DADC" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
    </svg>
);

export default SpeedArt;
