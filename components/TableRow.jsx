'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tag, Star, Calendar, Eye } from 'lucide-react'

export default function TableRow({
  prompt,
  isSelected = false,
  onSelect = () => {},
  selectionMode = false,
  onCardView = () => {}
}) {
  const router = useRouter()
  const [imageError, setImageError] = useState(false)

  const {
    id,
    title,
    prompt_text,
    rating,
    usage_count,
    attachment_filename,
    created_at,
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

  const formatDate = (d) => {
    if (!d) return ''
    try {
      return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } catch {
      return ''
    }
  }

  const handleRowClick = () => {
    if (!selectionMode) {
      onCardView(id)
      router.push(`/library/${id}`)
    }
  }

  const statusLower = output_status ? output_status.toLowerCase() : ''

  return (
    <tr
      onClick={handleRowClick}
      style={{
        cursor: selectionMode ? 'default' : 'pointer',
        background: isSelected ? '#f0f9ff' : 'transparent',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
      }}
    >
      {selectionMode && (
        <td style={{ padding: 12, verticalAlign: 'middle' }}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation()
              onSelect(id)
            }}
            style={{ width: 16, height: 16 }}
          />
        </td>
      )}

      <td style={{ padding: 12, verticalAlign: 'middle', width: '40%' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 64, height: 48, borderRadius: 8, overflow: 'hidden', background: '#f3f4f6', flexShrink: 0 }}>
            {displayImage ? (
              <img src={displayImage} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImageError(true)} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9aa3af' }}>
                <Tag size={18} />
              </div>
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontWeight: 700,
              fontSize: 14,
              color: '#0f172a',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {title}
            </div>
            <div style={{
              fontSize: 13,
              color: '#64748b',
              marginTop: 6,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {prompt_text?.substring(0, 120)}
            </div>
          </div>
        </div>
      </td>

      <td style={{ padding: 12, verticalAlign: 'middle' }}>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{
            background: tool_color || '#6b7280',
            color: 'white',
            padding: '1px 2px',
            borderRadius: 999,
            fontWeight: 600,
            fontSize: 2,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: '10px',
            height: 10,
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
          }}>
            {tool_name || 'Unknown'}
          </span>

          {ai_tool_model && (
            <span style={{
              background: '#DBEAFE',
              color: '#1d4ed8',
              padding: '2px 2px',
              borderRadius: 999,
              fontSize: 9,
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
              fontWeight: 600
            }}>
              {ai_tool_model}
            </span>
          )}

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
      </td>

      <td style={{ padding: 12, verticalAlign: 'middle' }}>
        <span style={{
          background: '#eef2ff',
          color: '#3730a3',
          padding: '6px 10px',
          borderRadius: 999,
          fontWeight: 700,
          fontSize: 12,
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
        }}>
          {category_name || 'Uncategorized'}
        </span>
      </td>

      <td style={{ padding: 12, verticalAlign: 'middle' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Stars (filled) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {[1,2,3,4,5].map(s => (
              <Star
                key={s}
                size={12}
                style={{
                  color: s <= Math.round(rating || 0) ? '#fbbf24' : '#e9eef3',
                  fill: s <= Math.round(rating || 0) ? '#fbbf24' : '#e9eef3'
                }}
              />
            ))}
            <span style={{ marginLeft: 6, color: '#475569' }}>({(rating || 0).toFixed(1)})</span>
          </div>

          {/* Status pill (center within this cell) */}
          {output_status && (
            <div style={{ marginLeft: 12 }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 70,
                textAlign: 'center',
                padding: '4px 10px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
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
                    : '#475569',
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
              }}>
                {output_status}
              </span>
            </div>
          )}
        </div>
      </td>

      <td style={{ padding: 12, verticalAlign: 'middle', color: '#475569' }}>{usage_count || 0}</td>

      <td style={{ padding: 12, verticalAlign: 'middle', color: '#475569' }}>{formatDate(created_at)}</td>

      <td style={{ padding: 12, verticalAlign: 'middle' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              navigator.clipboard.writeText(prompt_text || '')
            }}
            style={{ padding: 8, borderRadius: 8, border: '1px solid #eef2f7', background: 'white', cursor: 'pointer' }}
          >
            Copy
          </button>

          <button onClick={(e) => { e.stopPropagation(); /* placeholder for share if needed */ }} style={{ padding: 8, borderRadius: 8, border: '1px solid #eef2f7', background: 'white', cursor: 'pointer' }}>
            Share
          </button>
        </div>
      </td>
    </tr>
  )
}

// helper
function formatDate(d) {
  if (!d) return ''
  try {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}
