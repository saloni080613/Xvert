import React from 'react';
import Navbar from '../components/Navbar';
// Import the new SVG components
import missionGraphic from '../assets/mission-graphic.png';
import SpeedArt from '../components/SpeedArt';
import { FaCheckCircle, FaRocket, FaShieldAlt, FaMagic } from 'react-icons/fa';

const About = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#F7F5F0' }}>
            <Navbar />

            {/* Hero Section */}
            <section style={{
                backgroundColor: '#B0D8F5', // 1st Section: Light Blue (Button Color)
                background: 'linear-gradient(135deg, #B0D8F5 0%, #B0D8F5 100%)',
                padding: '5rem 2rem',
                textAlign: 'center',
                color: '#1D3557'
            }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <h1 style={{
                        fontFamily: '"Outfit", sans-serif',
                        fontSize: '5rem', // Increased from 4rem
                        fontWeight: '700',
                        marginBottom: '1.5rem',
                        letterSpacing: '-0.02em'
                    }}>
                        About Xvert
                    </h1>
                    <p style={{
                        fontFamily: '"Nunito", sans-serif',
                        fontSize: '1.6rem', // Increased from 1.4rem
                        lineHeight: '1.6',
                        color: '#4b5563',
                        maxWidth: '800px', // Increased max-width slightly to accommodate larger text
                        maxWidth: '700px',
                        margin: '0 auto'
                    }}>
                        Since Xvert is a project built on the principle of "vibe coding"—focusing on high-level logic and seamless execution rather than getting bogged down in syntax—our approach reflects that same efficiency.
                    </p>
                </div>
            </section>

            {/* Mission Section */}
            <section style={{ padding: '4rem 2rem', backgroundColor: '#F7F5F0' }}> {/* 2nd Section: Beige */}
                <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontFamily: '"Outfit", sans-serif', fontSize: '3rem', color: '#1D3557', marginBottom: '1.5rem' }}>Our Mission</h2>
                        <p style={{ fontFamily: '"Nunito", sans-serif', fontSize: '1.3rem', lineHeight: '1.8', color: '#4b5563', marginBottom: '1.5rem' }}>
                            At Xvert, we believe that file conversion shouldn't be a hurdle in your workflow. Our mission is to provide a seamless, multi-format conversion experience that prioritizes speed, security, and simplicity. Whether you are a developer, a student, or a creative professional, Xvert is built to handle your data with precision.
                        </p>
                    </div>
                    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                        <img src={missionGraphic} alt="Xvert Mission" style={{ width: '100%', height: 'auto', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                    </div>
                </div>
            </section>

            {/* Why Choose Xvert? */}
            <section style={{ padding: '4rem 2rem', backgroundColor: '#B0D8F5' }}> {/* 3rd Section: Light Blue */}
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    <h2 style={{ fontFamily: '"Outfit", sans-serif', fontSize: '3rem', color: '#1D3557', marginBottom: '3rem', textAlign: 'center' }}>Why Choose Xvert?</h2>

                    <p style={{ textAlign: 'center', marginBottom: '3rem', color: '#6b7280', fontSize: '1.4rem' }}>In a digital world cluttered with complex tools, Xvert stands out by focusing on what matters: the result.</p>

                    {/* Fixed 4-column grid, Small Square Cards, Left Aligned, Larger Fonts */}
                    {/* Fixed 4-column grid, Responsive Square-ish Cards, Full Content Visible */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '1.5rem',
                    }}>
                        {[
                            { title: 'Universal Compatibility', desc: 'From PDFs and images to complex code formats, we support a vast array of extensions to ensure you’re never stuck with an unreadable file.', icon: <FaCheckCircle /> },
                            { title: 'Built for Efficiency', desc: 'Leveraging modern development methodologies, Xvert is optimized for performance, ensuring your files are processed in seconds, not minutes.', icon: <FaRocket /> },
                            { title: 'Privacy First', desc: 'Your data is yours. We implement industry-standard protocols to ensure that your files are handled securely and wiped from our systems after conversion.', icon: <FaShieldAlt /> },
                            { title: 'Simple & Intuitive', desc: 'No steep learning curves. Our interface is designed to be "plug and play"—upload, convert, and get back to what you do best.', icon: <FaMagic /> }
                        ].map((item, index) => (
                            <div
                                key={index}
                                style={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Glass effect
                                    padding: '2rem',
                                    borderRadius: '24px',
                                    border: '1px solid rgba(255, 255, 255, 0.3)',
                                    backdropFilter: 'blur(10px)',
                                    WebkitBackdropFilter: 'blur(10px)',
                                    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
                                    transition: 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.3s ease',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center', // Center Aligned
                                    justifyContent: 'center',
                                    textAlign: 'center',
                                    gap: '1rem',
                                    minHeight: '320px', // Ensure minimum height to look square-ish
                                    height: 'auto', // Allow growth if text is long
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)';
                                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.1)';
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                    e.currentTarget.style.boxShadow = '0 8px 32px 0 rgba(31, 38, 135, 0.15)';
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                                }}
                            >
                                <div style={{
                                    fontSize: '3rem',
                                    color: '#1D3557',
                                    marginBottom: '0.2rem',
                                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '100%'
                                }}>
                                    {item.icon}
                                </div>
                                <h3 style={{ fontFamily: '"Outfit", sans-serif', fontSize: '1.5rem', fontWeight: '800', color: '#1D3557', lineHeight: '1.2' }}>{item.title}</h3>
                                <p style={{
                                    fontFamily: '"Nunito", sans-serif',
                                    fontSize: '1.05rem', // Adjusted for readability/fit
                                    color: '#4b5563',
                                    lineHeight: '1.5',
                                    fontWeight: '600',
                                    // Removed LineClamp to show full content
                                }}>{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* The Vision Section */}
            <section style={{ padding: '4rem 2rem', backgroundColor: '#F7F5F0' }}> {/* 4th Section: Beige */}
                <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'row-reverse', flexWrap: 'wrap', gap: '3rem', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ flex: '1 1 300px' }}>
                        <h2 style={{ fontFamily: '"Outfit", sans-serif', fontSize: '3rem', color: '#1D3557', marginBottom: '1.5rem' }}>The Vision</h2>
                        <p style={{ fontFamily: '"Nunito", sans-serif', fontSize: '1.3rem', lineHeight: '1.8', color: '#4b5563', marginBottom: '1.5rem' }}>
                            Xvert started as a project to bridge the gap between different digital ecosystems. We recognized that while technology is advancing, file fragmentation remains a common pain point. By applying a logic-first approach to software, we’ve created a tool that understands the user’s intent and delivers high-quality output every time.
                        </p>
                        <p style={{ fontFamily: '"Nunito", sans-serif', fontSize: '1.3rem', lineHeight: '1.8', color: '#4b5563' }}>
                            We are constantly evolving, adding new formats, and refining our engine to stay ahead of the curve.
                        </p>
                    </div>
                    <div style={{ flex: '0 1 400px', maxWidth: '400px' }}>
                        <SpeedArt />
                    </div>
                </div>
            </section>

            {/* Get In Touch */}
            <section style={{ padding: '5rem 2rem', backgroundColor: '#B0D8F5', color: '#1D3557', textAlign: 'center' }}> {/* 5th Section: Light Blue */}
                <div style={{ maxWidth: '700px', margin: '0 auto' }}>
                    <h2 style={{ fontFamily: '"Outfit", sans-serif', fontSize: '3rem', marginBottom: '1rem' }}>Get In Touch</h2>
                    <p style={{ fontFamily: '"Nunito", sans-serif', fontSize: '1.3rem', marginBottom: '2.5rem', opacity: '0.9' }}>
                        Have a suggestion or a format you'd like to see supported? We’d love to hear from you.
                    </p>
                    <a href="mailto:support@xvert.com" style={{
                        display: 'inline-block',
                        backgroundColor: '#F7F5F0', // Beige button
                        color: '#1D3557',
                        padding: '1rem 2.5rem', // Larger button
                        borderRadius: '50px',
                        textDecoration: 'none',
                        fontWeight: '700',
                        fontSize: '1.1rem', // Larger button text
                        fontFamily: '"Outfit", sans-serif',
                        transition: 'transform 0.2s',
                        border: '2px solid #1D3557' // Navy border for definition
                    }}
                        onMouseOver={e => e.target.style.transform = 'scale(1.05)'}
                        onMouseOut={e => e.target.style.transform = 'scale(1)'}
                    >
                        Contact Us
                    </a>
                </div>
            </section>

            {/* MegaFooter with no extra imports since footer logic handles usage */}
        </div>
    );
};

export default About;
