export default function Logo({ width = 40, height = 40 }) {
    return (
        <svg width={width} height={height} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* File: Light Blue Fill */}
            <path d="M25 10C25 5 30 0 35 0H65L90 25V90C90 95 85 100 80 100H25C20 100 15 95 15 90V10C15 5 20 0 25 0Z" fill="#B0D8F5" />
            {/* Fold: Darker Blue */}
            <path d="M65 0V25H90" fill="#8FBADC" />
            {/* X Symbol: Beige */}
            <path d="M40 45 L65 75 M65 45 L40 75" stroke="#E8D5B5" strokeWidth="12" strokeLinecap="round" />
            {/* X Symbol Outline: Navy (for subtle contrast) */}
            <path d="M40 45 L65 75 M65 45 L40 75" stroke="#1D3557" strokeWidth="1.5" strokeOpacity="0.2" strokeLinecap="round" />
        </svg>
    );
}
