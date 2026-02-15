import { motion, AnimatePresence } from 'framer-motion'
import ToolIcon from './ToolIcon'

const springBounce = { type: 'spring', stiffness: 400, damping: 20 }

class ToolCategory {
    constructor(title, icon) {
        this.title = title
        this.icon = icon
        this.tools = []
    }
    addTool(tool) {
        this.tools.push(tool)
    }
}

export default function MegaMenu({ tools, activeMenu, onToolSelect, onClose }) {

    const OrganizeAllTools = () => {
        const categories = {
            pdf: new ToolCategory('PDF Tools', '📄'),
            image: new ToolCategory('Image Tools', '🖼️'),
            data: new ToolCategory('Data Tools', '📊'),
        }
        tools.forEach(tool => {
            if (tool.type === 'pdf' || tool.type === 'docx' || tool.type === 'merge' || tool.type === 'image') {
                categories.pdf.addTool(tool)
            } else if (tool.type === 'jpg' || tool.type === 'png' || tool.type === 'gif') {
                categories.image.addTool(tool)
            } else if (tool.type === 'data') {
                categories.data.addTool(tool)
            }
        })
        return Object.values(categories).filter(c => c.tools.length > 0)
    }

    const OrganizePDFTools = () => {
        const categories = {
            convertTo: new ToolCategory('Convert TO PDF', '📥'),
            convertFrom: new ToolCategory('Convert FROM PDF', '📤'),
            organize: new ToolCategory('Organize PDF', '📁'),
        }
        tools.forEach(tool => {
            if (tool.id === 'image-to-pdf' || tool.id === 'docx-to-pdf') {
                categories.convertTo.addTool(tool)
            } else if (tool.id === 'pdf-to-word' || tool.id === 'pdf-to-jpg' || tool.id === 'pdf-to-png') {
                categories.convertFrom.addTool(tool)
            } else if (tool.id === 'merge-pdf') {
                categories.organize.addTool(tool)
            }
        })
        return Object.values(categories).filter(c => c.tools.length > 0)
    }

    const categoryList = activeMenu === 'convert-pdf' ? OrganizePDFTools() : OrganizeAllTools()

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={springBounce}
                style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    width: '100%',
                    background: 'var(--ag-megamenu-bg, rgba(230, 230, 250, 0.92))',
                    backdropFilter: 'blur(30px)',
                    WebkitBackdropFilter: 'blur(30px)',
                    borderBottom: '1px solid var(--ag-glass-border)',
                    boxShadow: '0 10px 40px var(--ag-glass-shadow)',
                    padding: '2rem 4rem',
                    zIndex: 9999,
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '4rem',
                }}
                onMouseLeave={onClose}
            >
                {categoryList.map((category, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...springBounce, delay: index * 0.05 }}
                        style={{ minWidth: '200px' }}
                    >
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginBottom: '1rem',
                            color: 'var(--ag-accent)',
                            fontWeight: 700,
                            fontFamily: '"Outfit", sans-serif',
                            fontSize: '0.9rem',
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                        }}>
                            <span>{category.icon}</span>
                            <span>{category.title}</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {category.tools.map(tool => (
                                <motion.div
                                    key={tool.id}
                                    onClick={() => {
                                        onToolSelect(tool)
                                        onClose()
                                    }}
                                    whileHover={{ x: 5, color: 'var(--ag-accent)' }}
                                    transition={springBounce}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.8rem',
                                        cursor: 'pointer',
                                        color: 'var(--ag-text-secondary)',
                                        padding: '0.35rem 0.5rem',
                                        borderRadius: '8px',
                                        transition: 'background 0.2s',
                                        fontSize: '0.9rem',
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.background = 'var(--ag-card-bg)'
                                        e.currentTarget.style.color = 'var(--ag-accent)'
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.background = 'transparent'
                                        e.currentTarget.style.color = 'var(--ag-text-secondary)'
                                    }}
                                >
                                    <div style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <ToolIcon tool={tool} />
                                    </div>
                                    <span style={{ fontWeight: 500 }}>{tool.name}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </motion.div>
        </AnimatePresence>
    )
}
