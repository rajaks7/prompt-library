'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, Star, Tag, Calendar } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

export default function PromptCard({
  prompt,
  isSelected = false,
  onSelect = () => {},
  selectionMode = false,
  onCardView = () => {}
}) {
  const router = useRouter()
  const [isHovered, setIsHovered] = useState(false)
  const [imageError, setImageError] = useState(false)

  const {
    id,
    title,
    prompt_text,
    rating,
    usage_count,
    attachment_filename,
    created_at,
    tags,
    output_status,
    ai_tool_model,
    version,
    tool_name,
    tool_color,
    category_name,
    category_image_url
  } = prompt

  const isImageFile = (filename) => {
    if (!filename) return false
    const ext = filename.split('.').pop()?.toLowerCase()
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)
  }

  let displayImage = null
  if (!imageError) {
    if (attachment_filename && isImageFile(attachment_filename)) {
      displayImage = `/uploads/${attachment_filename}`
    } else if (category_image_url) {
      displayImage = category_image_url.startsWith('http') ? category_image_url : category_image_url
    }
  }

  const excerpt =
    prompt_text?.length > 120 ? prompt_text.substring(0, 120) + '...' : prompt_text || ''

  const formatDate = (d) => {
    if (!d) return ''
    try {
      return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } catch {
      return ''
    }
  }

  const handleCardClick = async () => {
  if (!selectionMode) {
    try {
      console.log('Attempting to increment view count for prompt:', id)
      
      const { data, error } = await supabase.rpc('increment_view_count', {
        prompt_id: id
      })
      
      console.log('View count result:', { data, error })
      
      if (error) {
        console.error('Failed to increment view count:', error)
      }
    } catch (error) {
      console.error('Error tracking view:', error)
    }
    
    onCardView(id)
    router.push(`/library/${id}`)
  }
}

  // category color mapping (keeps consistent palette)
  const categoryBg = (cat) => {
    switch ((cat || '').toLowerCase()) {
      case 'images':
        return '#f59e0b'
      case 'writing':
        return '#10b981'
      case 'code':
        return '#3b82f6'
      case 'business':
        return '#8b5cf6'
      case 'creative':
        return '#ef4444'
      case 'analysis':
        return '#06b6d4'
      default:
        return '#6b7280'
    }
  }

  const statusLower = output_status ? output_status.toLowerCase() : ''

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
      style={{
  maxWidth: '360px',
  width: '100%',
  background: 'white',
  borderRadius: 16,
  overflow: 'hidden',
  border: isSelected ? '2px solid #3b82f6' : '1px solid #eef2f7',
  boxShadow: isHovered ? '0 8px 24px rgba(16,24,40,0.08)' : '0 4px 12px rgba(16,24,40,0.04)',
  cursor: selectionMode ? 'default' : 'pointer',
  transition: 'transform .18s ease, box-shadow .18s ease',
  transform: isHovered && !selectionMode ? 'translateY(-6px)' : 'none',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
}}

    >
      {/* selection checkbox */}
      {selectionMode && (
        <div style={{ position: 'absolute', margin: 12, zIndex: 30 }}>
          <input
            type="checkbox"
            checked={Boolean(isSelected)}
            onChange={(e) => {
              e.stopPropagation()
              onSelect(id)
            }}
            style={{ width: 16, height: 16 }}
          />
        </div>
      )}

      {/* Image */}
      <div style={{ height: 190, background: '#f3f4f6', position: 'relative' }}>
        {displayImage ? (
          // image tag used for simplicity
          <img
            src={displayImage}
            alt={title}
            onError={() => setImageError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(180deg,#f7fafc,#eef2f7)' }}>
            <Tag size={22} style={{ color: '#9ca3af' }} />
            <span style={{ color: '#9ca3af', fontSize: 13 }}>No Image</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: 14 }}>
        {/* Tool / model / version / usage */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {/* Tool pill */}
            <span
            style={{
                backgroundColor: tool_color || '#6b7280',
                color: 'white',
                padding: '2px 10px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1.2,
                height: '18px',
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
            }}
            >
            {tool_name || 'Unknown'}
            </span>

            {/* model small pill */}
            {ai_tool_model && (
              <span style={{
                background: '#DBEAFE',
                color: '#1d4ed8',
                padding: '3px 8px',
                borderRadius: 999,
                fontSize: '12px',
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                fontWeight: 600
              }}>
                {ai_tool_model}
              </span>
            )}

            {/* version */}
            {version != null && (
              <span style={{
                background: '#e9d8fd',
                color: '#6b46c1',
                padding: '3px 10px',
                borderRadius: 999,
                fontSize: 12,
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                fontWeight: 600
              }}>
                {String(version).startsWith('v') ? String(version) : `v${String(version)}`}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', color: '#6b7280', gap: 6 }}>
            <Eye size={14} />
            <span style={{ fontSize: 13 }}>{usage_count || 0}</span>
          </div>
        </div>

        {/* Title */}
        <h3 style={{
          margin: '8px 0 6px 0',
          fontSize: 15,
          lineHeight: '1.25',
          color: '#0f172a',
          fontWeight: 600,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          overflow: 'hidden'
        }}>
          {title}
        </h3>

        {/* Excerpt */}
        <p style={{
          margin: 0,
          fontSize: 13,
          color: '#475569',
          lineHeight: '1.4',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          overflow: 'hidden'
        }}>
          {excerpt}
        </p>

        {/* Category */}
        <div style={{ marginTop: 10 }}>
          <span style={{
            color: 'white',
            padding: '2px 10px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1.2,
            height: '18px',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
            background: categoryBg(category_name)
          }}>
            {category_name || 'Uncategorized'}
          </span>
        </div>

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            {tags.slice(0, 3).map((t, i) => (
              <span key={i} style={{
                background: '#E5E5E5',
                color: '#4a5568',
                padding: '4px 8px',
                borderRadius: 7,
                fontSize: 12,
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                fontWeight: 600
              }}>{t}</span>
            ))}
          </div>
        )}

        {/* Footer row (rating / status / date) */}
        <div style={{
        display: 'flex',
        alignItems: 'center',
        marginTop: 12,
        borderTop: '1px solid #f1f5f9',
        paddingTop: 10,
        gap: 12
        }}>
        {/* Left: Rating */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
            {[1,2,3,4,5].map(s => (
            <Star key={s} size={12} style={{ color: s <= Math.round(rating || 0) ? '#f9dc3bff' : '#c5c5c5ff', fill: s <= Math.round(rating || 0) ? '#fbbf24' : '#e9eef3' }} />
            ))}
            <span style={{ color: '#475569', fontSize: 12 }}>({(rating || 0).toFixed(1)})</span>
        </div>

        {/* Center: Status (centered) */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            {output_status && (
            <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 70,
                textAlign: 'center',
                padding: '3px 0px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                background:
                statusLower === 'successful'
                    ? '#dcfce7'
                    : statusLower === 'so-so'
                    ? '#fef9c3'
                    : statusLower === 'failure'
                    ? '#fee2e2'
                    : '#f1f5f9',
                color:
                statusLower === 'successful'
                    ? '#166534'
                    : statusLower === 'so-so'
                    ? '#92400e'
                    : statusLower === 'failure'
                    ? '#b91c1c'
                    : '#475569'
            }}>
                {output_status}
            </span>
            )}
        </div>

        {/* Right: Date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#535353ff' }}>
            <Calendar size={12} />
            <span style={{ fontSize: 12 }}>{formatDate(created_at)}</span>
            </div>
        </div>
    </div>
</div>
)
}
