'use client'
import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, MessageCircle, Mail, Copy } from 'lucide-react'

export default function ShareModal({ isOpen, onClose, selectedPrompts, prompts }) {
  useEffect(() => {
    // prevent body scroll while modal open
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const selectedPromptData = prompts.filter((p) => selectedPrompts.includes(p.id))

  const buildPromptText = (p) =>{
    const tool = p.tool_name || p.toolName || 'Not specified'
  const model = p.ai_tool_model || 'Not specified'
  const category = p.category_name || p.categoryName || 'Not specified'
  const outputStatus = p.output_status || 'Not specified'
  const rating = (p.rating != null && p.rating !== '') ? p.rating : ''
  const usage = p.usage_count != null ? p.usage_count : ''
  const created = p.created_at ? new Date(p.created_at).toLocaleDateString() : ''

  return (
    `Title: ${p.title || ''}\n` +
    `Tool: ${tool}\n` +
    `Model: ${model}\n` +
    `Category: ${category}\n` +
    `Output Status: ${outputStatus}\n` +
    `Content:\n${p.prompt_text || ''}\n\n` +
    `Rating: ${rating}\n` +
    `Usage: ${usage}\n` +
    `Created: ${created}\n\n` +
    `---\n\n`
  )
}

  const handleCopy = () => {
    const text = selectedPromptData.map(buildPromptText).join('')
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard')
  }

  const handleWhatsApp = () => {
    const text = selectedPromptData.map(buildPromptText).join('')
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  const handleEmail = () => {
    const text = selectedPromptData.map(buildPromptText).join('')
    window.location.href = `mailto:?subject=Shared Prompts&body=${encodeURIComponent(text)}`
  }

  const modal = (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        background: 'white',
        borderRadius: 12,
        padding: 20,
        maxWidth: 480,
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>Share Prompts</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ color: '#4b5563', marginBottom: 12, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>
          Share {selectedPrompts.length} selected prompt{selectedPrompts.length > 1 ? 's' : ''}
        </p>

        <div style={{ display: 'grid', gap: 10 }}>
          <button onClick={handleCopy} style={{ padding: 12, borderRadius: 8, border: '1px solid #e5e7eb', background: '#f3f4f6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>
            <Copy size={18} /> Copy to Clipboard
          </button>

          <button onClick={handleWhatsApp} style={{ padding: 12, borderRadius: 8, border: 'none', background: '#25D366', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>
            <MessageCircle size={18} /> Share via WhatsApp
          </button>

          <button onClick={handleEmail} style={{ padding: 12, borderRadius: 8, border: 'none', background: '#3b82f6', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>
            <Mail size={18} /> Share via Email
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
