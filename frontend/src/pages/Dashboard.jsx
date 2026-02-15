import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import authService from '../services/AuthService'
import conversionService from '../services/ConversionService'
import UserAvatar from '../components/UserAvatar'
import ToolIcon from '../components/ToolIcon'
import Navbar from '../components/Navbar'

export default function Dashboard() {
    const navigate = useNavigate()
    const [file, setFile] = useState(null)
    const [selectedTool, setSelectedTool] = useState(null)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [session, setSession] = useState(null)
    const [files, setFiles] = useState([])
    const [progress, setProgress] = useState(0)
    const [downloadUrl, setDownloadUrl] = useState(null)

    useEffect(() => {
        authService.getSession().then(({ data: { session } }) => {
            setSession(session)
            if (!session) {
                navigate('/login') // Redirect if not logged in, since this IS the dashboard
            }
        })
    }, [navigate])

    const tools = [
        // Document Tools
        { id: 'pdf-to-word', name: 'PDF to Word', desc: 'Convert PDFs to editable DOCX.', icon: '📄', type: 'pdf', target: 'docx' },
        { id: 'docx-to-pdf', name: 'Word to PDF', desc: 'Convert DOCX files to PDF.', icon: '📝', type: 'docx', target: 'pdf' },
        { id: 'image-to-pdf', name: 'Image to PDF', desc: 'JPG, PNG, GIF to PDF.', icon: '🖼️', type: 'image', target: 'pdf' },
        { id: 'merge-pdf', name: 'Merge PDF', desc: 'Combine multiple PDFs into one.', icon: '🔗', type: 'merge', target: 'pdf' },
        { id: 'pdf-to-jpg', name: 'PDF to JPG', desc: 'Extract PDF pages as JPGs.', icon: 'fz', type: 'pdf', target: 'jpg' },
        { id: 'pdf-to-png', name: 'PDF to PNG', desc: 'Extract PDF pages as PNGs.', icon: 'fz', type: 'pdf', target: 'png' },

        // Image Tools
        { id: 'jpg-to-png', name: 'JPG to PNG', desc: 'Convert JPG to transparent PNG.', icon: '📷', type: 'jpg', target: 'png' },
        { id: 'png-to-jpg', name: 'PNG to JPG', desc: 'Convert PNG to standard JPG.', icon: '📸', type: 'png', target: 'jpg' },
        { id: 'jpg-to-gif', name: 'JPG to GIF', desc: 'Animated GIF from JPGs.', icon: '👾', type: 'jpg', target: 'gif' },
        { id: 'png-to-gif', name: 'PNG to GIF', desc: 'Animated GIF from PNGs.', icon: '👾', type: 'png', target: 'gif' },
        { id: 'gif-to-jpg', name: 'GIF to JPG', desc: 'Static JPG from GIF.', icon: '📸', type: 'gif', target: 'jpg' },
        { id: 'gif-to-png', name: 'GIF to PNG', desc: 'Static PNG from GIF.', icon: '📷', type: 'gif', target: 'png' },

        // Data Tools
        { id: 'json-to-csv', name: 'JSON to CSV', desc: 'Convert JSON data to CSV.', icon: '📊', type: 'data', target: 'csv' },
        { id: 'csv-to-json', name: 'CSV to JSON', desc: 'Convert CSV rows to JSON.', icon: '📋', type: 'data', target: 'json' },
        { id: 'excel-to-csv', name: 'Excel to CSV', desc: 'Convert XLSX sheets to CSV.', icon: 'x', type: 'data', target: 'csv' },
        { id: 'csv-to-excel', name: 'CSV to Excel', desc: 'Convert CSV to Excel XLSX.', icon: 'x', type: 'data', target: 'xlsx' },
        { id: 'excel-to-json', name: 'Excel to JSON', desc: 'Convert Excel to JSON data.', icon: 'x', type: 'data', target: 'json' },
        { id: 'json-to-excel', name: 'JSON to Excel', desc: 'Convert JSON to Excel XLSX.', icon: 'x', type: 'data', target: 'xlsx' },
        { id: 'xml-to-json', name: 'XML to JSON', desc: 'Convert XML to JSON format.', icon: '📋', type: 'data', target: 'json' },
        { id: 'json-to-xml', name: 'JSON to XML', desc: 'Convert JSON to XML format.', icon: '🧩', type: 'data', target: 'xml' },
        { id: 'xml-to-csv', name: 'XML to CSV', desc: 'Convert XML to CSV format.', icon: '📊', type: 'data', target: 'csv' },
        { id: 'csv-to-xml', name: 'CSV to XML', desc: 'Convert CSV to XML format.', icon: '🧩', type: 'data', target: 'xml' },
        { id: 'xml-to-excel', name: 'XML to Excel', desc: 'Convert XML to Excel XLSX.', icon: 'x', type: 'data', target: 'xlsx' },
        { id: 'excel-to-xml', name: 'Excel to XML', desc: 'Convert Excel to XML format.', icon: '🧩', type: 'data', target: 'xml' },
    ]

    const getAcceptTypes = (tool) => {
        if (!tool) return '*'
        if (tool.id === 'merge-pdf') return '.pdf'
        if (tool.type === 'pdf') return '.pdf'
        if (tool.type === 'image') return '.jpg,.jpeg,.png,.gif'
        if (tool.type === 'jpg') return '.jpg,.jpeg'
        if (tool.type === 'png') return '.png'
        if (tool.type === 'gif') return '.gif'
        if (tool.type === 'docx') return '.docx,.doc'
        if (tool.type === 'data') return '.json,.csv,.xlsx,.xls,.xml'
        return '*'
    }

    const handleLogout = async () => {
        await authService.logout()
        navigate('/')
    }

    const handleFileChange = (e) => {
        setDownloadUrl(null)
        const selectedFile = e.target.files[0];

        const isValidFileType = (file, tool) => {
            if (!file) return false
            const ext = '.' + file.name.split('.').pop().toLowerCase()
            const accept = getAcceptTypes(tool)
            return accept === '*' || accept.includes(ext)
        }

        if (selectedTool?.id === 'merge-pdf') {
            const newFiles = Array.from(e.target.files).filter(f => isValidFileType(f, selectedTool))
            if (newFiles.length < e.target.files.length) {
                setMessage('Some files were skipped because they are not PDFs.')
                setTimeout(() => setMessage(''), 3000)
            }
            setFiles(prev => [...prev, ...newFiles])
            setFile(null)
        } else {
            if (isValidFileType(selectedFile, selectedTool)) {
                setFile(selectedFile)
                setMessage('')
            } else {
                setFile(null)
                setMessage(`Invalid file type. Please select a ${selectedTool.type === 'image' ? 'Image' : selectedTool.type.toUpperCase()} file.`)
            }
            setFiles([])
        }
        e.target.value = ''
    }

    const handleRemoveFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
    }

    const handleToolSelect = (tool) => {
        setSelectedTool(tool)
        setFile(null)
        setMessage('')
    }

    const handleBackToGrid = () => {
        setSelectedTool(null)
        setFile(null)
        setFiles([])
        setMessage('')
        setDownloadUrl(null)
    }

    const handleConvert = async () => {
        if (selectedTool.id === 'merge-pdf') {
            if (files.length < 2) {
                setMessage('Please select at least 2 PDF files to merge.')
                return
            }
        } else if (!file) {
            setMessage('Please select a file first.')
            return
        }

        setLoading(true)
        setProgress(0)
        setMessage('Converting... (Larger files may take 10-20 seconds)')

        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 95) return prev
                return prev + 5
            })
        }, 500)

        const timer = setTimeout(() => {
            setMessage('Still processing... complex files need a moment. Please do not refresh.');
        }, 5000);

        try {
            let resultBlob;

            if (selectedTool.id === 'merge-pdf') {
                resultBlob = await conversionService.mergeDocuments(files);
            } else if (selectedTool.id === 'image-to-pdf') {
                resultBlob = await conversionService.convertDocument(file, 'image', 'pdf');
            } else if (selectedTool.type === 'pdf') {
                resultBlob = await conversionService.convertDocument(file, 'pdf', selectedTool.target);
            } else if (selectedTool.type === 'image' || selectedTool.type === 'jpg' || selectedTool.type === 'png' || selectedTool.type === 'gif') {
                resultBlob = await conversionService.convertImage(file, selectedTool.target);
            } else if (selectedTool.type === 'docx') {
                resultBlob = await conversionService.convertDocument(file, 'docx', 'pdf');
            } else if (selectedTool.type === 'data') {
                resultBlob = await conversionService.convertData(file, selectedTool.target);
            } else {
                clearInterval(progressInterval);
                clearTimeout(timer);
                setMessage('This tool is currently unavailable.');
                setLoading(false);
                setProgress(0);
                return;
            }

            clearInterval(progressInterval);

            // Fast fill animation to reach 100% smoothly
            const fastFillInterval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(fastFillInterval);
                        setTimeout(() => {
                            const url = window.URL.createObjectURL(new Blob([resultBlob]));
                            clearTimeout(timer);
                            setMessage('Conversion successful!');
                            setDownloadUrl(url);
                            setLoading(false);
                            setTimeout(() => setProgress(0), 1000);
                        }, 500); // 500ms pause at 100% before switching
                        return 100;
                    }
                    return prev + 10; // Increment faster to catch up
                });
            }, 50); // Fast update rate

        } catch (error) {
            console.error(error);
            clearInterval(progressInterval);
            clearTimeout(timer);
            if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                setMessage('Conversion timed out. The file might be too large or complex.');
            } else {
                setMessage('Conversion failed. Please try again.');
            }
            setProgress(0);
            setLoading(false);
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#F7F5F0', // Beige background
            fontFamily: '"Nunito", sans-serif',
            color: '#333'
        }}>
            {/* Navbar */}
            <Navbar
                tools={tools}
                onToolSelect={handleToolSelect}
                onReset={handleBackToGrid}
                session={session}
                UserAvatarComponent={
                    <UserAvatar session={session} onLogout={handleLogout} />
                }
            />

            {!selectedTool && (
                <>
                    {/* Hero Section (Reverted to Simple Style) */}
                    <div style={{
                        padding: '4rem 2rem 2rem',
                        textAlign: 'center',
                    }}>
                        <h1 style={{
                            fontSize: '3rem',
                            fontWeight: 'bold',
                            color: '#1D3557',
                            marginBottom: '0.5rem'
                        }}>
                            My Dashboard
                        </h1>
                        <p style={{
                            fontSize: '1.2rem',
                            color: '#666',
                        }}>
                            Access your favorite tools and manage your files.
                        </p>
                    </div>


                    {/* Main Content Area */}
                    <main style={{ padding: '0 2rem', maxWidth: '1400px', margin: '0 auto 4rem' }}>

                        {/* Card Grid (Reverted to Simple Style) */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: '2rem',
                        }}>
                            {tools.map(tool => (
                                <div key={tool.id}
                                    onClick={() => handleToolSelect(tool)}
                                    style={{
                                        backgroundColor: '#fff',
                                        padding: '2rem',
                                        borderRadius: '15px',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                                        transition: 'all 0.3s ease',
                                        textAlign: 'center',
                                        border: '1px solid #eee'
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-5px)'
                                        e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)'
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)'
                                        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)'
                                    }}
                                >
                                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
                                        <ToolIcon tool={tool} />
                                    </div>
                                    <h3 style={{ color: '#1D3557', margin: '0 0 0.5rem 0' }}>{tool.name}</h3>
                                    <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>{tool.desc}</p>
                                </div>
                            ))}
                        </div>
                    </main>
                </>
            )}

            {/* View: Selected Tool Interface */}
            {selectedTool && (
                <main style={{ padding: '3rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
                        {/* Back Button */}
                        <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
                            <span onClick={handleBackToGrid} style={{ cursor: 'pointer', color: '#1D3557', fontWeight: 'bold' }}>
                                ← Back to Dashboard
                            </span>
                        </div>

                        <div style={{
                            backgroundColor: '#fff',
                            padding: '3rem',
                            borderRadius: '20px',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                        }}>
                            <div style={{ marginBottom: '2rem' }}>
                                <ToolIcon tool={selectedTool} />
                            </div>
                            <h2 style={{ fontSize: '2.5rem', color: '#1D3557', marginBottom: '0.5rem' }}>{selectedTool.name}</h2>
                            <p style={{ color: '#666', marginBottom: '3rem', fontSize: '1.2rem' }}>{selectedTool.desc}</p>

                            <div style={{
                                border: '2px dashed #A8DADC',
                                borderRadius: '15px',
                                padding: '3rem',
                                backgroundColor: '#f9f9f9',
                                marginBottom: '2rem',
                                position: 'relative',
                                transition: 'all 0.3s ease'
                            }}

                                onDragOver={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.style.backgroundColor = '#E3F2FD';
                                    e.currentTarget.style.borderColor = '#2196F3';
                                }}
                                onDragLeave={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.style.backgroundColor = '#FAFAFA';
                                    e.currentTarget.style.borderColor = '#1D3557';
                                }}
                            >
                                <input
                                    type="file"
                                    accept={getAcceptTypes(selectedTool)}
                                    onChange={handleFileChange}
                                    multiple={selectedTool.id === 'merge-pdf'}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        opacity: 0,
                                        cursor: 'pointer'
                                    }}
                                />
                                {selectedTool.id === 'merge-pdf' && files.length > 0 ? (
                                    <div style={{ maxHeight: '200px', overflowY: 'auto', width: '100%', textAlign: 'left', position: 'relative', zIndex: 10, pointerEvents: 'none' }}>
                                        <p style={{ fontWeight: 'bold', color: '#1D3557', textAlign: 'center', marginBottom: '1rem' }}>
                                            {files.length} files selected
                                        </p>
                                        {files.map((f, index) => (
                                            <div key={index} style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                backgroundColor: 'white',
                                                padding: '0.5rem',
                                                marginBottom: '0.5rem',
                                                borderRadius: '4px',
                                                border: '1px solid #1D3557',
                                                pointerEvents: 'auto'
                                            }}>
                                                <span style={{ fontSize: '0.9rem', maxWidth: '85%' }}>
                                                    {f.name}
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        e.preventDefault()
                                                        handleRemoveFile(index)
                                                    }}
                                                    style={{ border: 'none', background: 'none', color: '#D32F2F', cursor: 'pointer', fontWeight: 'bold' }}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : file ? (
                                    <div>
                                        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📄</div>
                                        <p style={{ fontWeight: 'bold', color: '#1D3557', fontSize: '1.2rem' }}>{file.name}</p>
                                        <p style={{ fontSize: '0.9rem', color: '#666' }}>Click to change file</p>
                                    </div>
                                ) : (
                                    <div>
                                        <div style={{
                                            backgroundColor: '#A8DADC',
                                            color: '#1D3557',
                                            padding: '0.8rem 2rem',
                                            borderRadius: '50px',
                                            display: 'inline-block',
                                            fontWeight: 'bold',
                                            marginBottom: '1rem',
                                            cursor: 'pointer'
                                        }}>
                                            Select {selectedTool.type === 'image' ? 'Image' : selectedTool.id === 'merge-pdf' ? 'PDFs' : 'File'}
                                        </div>
                                        <p style={{ color: '#666', fontSize: '0.9rem' }}>or drag and drop here</p>
                                    </div>
                                )}
                            </div>

                            {/* Progress bar removed as the button now handles the animation */}


                            {downloadUrl ? (
                                <button
                                    onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = downloadUrl;
                                        link.setAttribute('download', `converted_${selectedTool.target === 'pdf' ? 'document' : (files.length > 0 ? 'merged' : file.name.split('.')[0])}.${selectedTool.target}`);
                                        document.body.appendChild(link);
                                        link.click();
                                        link.remove();
                                    }}
                                    style={{
                                        backgroundColor: '#CBB9A4', // Beige
                                        color: '#1D3557', // Navy text
                                        padding: '1rem 3rem',
                                        borderRadius: '50px',
                                        border: 'none',
                                        fontSize: '1.2rem',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 15px rgba(203, 185, 164, 0.4)',
                                        transition: 'all 0.2s',
                                        animation: 'pulse 2s infinite'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    Download
                                </button>
                            ) : (
                                <button
                                    onClick={handleConvert}
                                    disabled={loading || (!file && files.length < 2)}
                                    style={{
                                        background: loading && progress > 0
                                            ? `linear-gradient(to right, #B0D8F5 ${progress}%, #CBB9A4 ${progress}%)`
                                            : (loading || (!file && files.length < 2) ? '#ccc' : '#CBB9A4'),
                                        color: '#1D3557',
                                        padding: '1rem 2.5rem',
                                        borderRadius: '50px',
                                        border: 'none',
                                        fontSize: '1.1rem',
                                        fontWeight: 'bold',
                                        cursor: loading || (!file && files.length < 2) ? 'not-allowed' : 'pointer',
                                        minWidth: '200px',
                                        boxShadow: loading ? 'none' : '0 4px 10px rgba(0,0,0,0.1)',
                                        transition: 'background 0.3s ease-out, transform 0.2s',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                    onMouseOver={(e) => {
                                        if (!loading && (file || files.length >= 2)) {
                                            e.currentTarget.style.transform = 'scale(1.02)'
                                        }
                                    }}
                                    onMouseOut={(e) => {
                                        if (!loading && (file || files.length >= 2)) {
                                            e.currentTarget.style.transform = 'scale(1)'
                                        }
                                    }}
                                >
                                    <span style={{ position: 'relative', zIndex: 1 }}>
                                        {loading ? 'Converting...' : 'Convert'}
                                    </span>
                                </button>
                            )}

                            {message && (
                                <div style={{
                                    marginTop: '2rem',
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    backgroundColor: message.includes('failed') || message.includes('Invalid') ? '#FFEBEE' : '#E8F5E9',
                                    color: message.includes('failed') || message.includes('Invalid') ? '#C62828' : '#2E7D32',
                                    fontWeight: '600'
                                }}>
                                    {message}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            )}
        </div>
    )
}
