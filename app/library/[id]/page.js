"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Heart, 
  Copy, 
  Share2, 
  Eye, 
  Star, 
  Calendar,
  Tag,
  X,
  Check,
  ExternalLink,
  Printer,
  Edit3,
  Trash2
} from 'lucide-react'
import Image from 'next/image'
import { supabase } from "../../../lib/supabaseClient"
import Link from "next/link";


export default function PromptDetail() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id
  
  const [prompt, setPrompt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copySuccess, setCopySuccess] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [relatedPrompts, setRelatedPrompts] = useState([])

  useEffect(() => {
    if (!id) return
    fetchPromptDetails()
  }, [id])

  const fetchPromptDetails = async () => {
    setLoading(true)
    try {
      // Fetch main prompt with related data
      const { data, error } = await supabase
        .from("prompts")
        .select(`
          *,
          ai_tools(name, color_hex),
          categories(name, image_url, color_hex),
          prompt_types(name)
          `)
        .eq("id", id)
        .single()

      if (error) throw error

      setPrompt(data)
      
      // Fetch related prompts
      if (data.categories?.name) {
        fetchRelatedPrompts(data.categories.name)
      }
    } catch (err) {
      console.error(err)
      setPrompt(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchRelatedPrompts = async (categoryName) => {
    try {
      const { data } = await supabase
        .from("prompts")
        .select(`
          id, title, prompt_text, rating, usage_count,
          categories(name)
        `)
        .eq("categories.name", categoryName)
        .neq("id", id)
        .limit(3)

      setRelatedPrompts(data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error(err)
    }
  }

  const handleFavoriteToggle = async () => {
    try {
      const newStatus = !prompt.is_favorite
      const { error } = await supabase
        .from("prompts")
        .update({ is_favorite: newStatus })
        .eq("id", id)

      if (!error) {
        setPrompt(prev => ({ ...prev, is_favorite: newStatus }))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleShare = (platform) => {
    if (!prompt) return

    const tool = prompt.ai_tools?.name || "Not specified"
    const model = prompt.ai_tool_model || "Not specified"
    const category = prompt.categories?.name || "Not specified"
    const outputStatus = prompt.output_status || "Not specified"

    const details = 
      `Title: ${prompt.title}\n` +
      `Tool: ${tool}\n` +
      `Model: ${model}\n` +
      `Category: ${category}\n` +
      `Output Status: ${outputStatus}\n\n` +
      `Content:\n${prompt.prompt_text}\n\n` +
      `Rating: ${prompt.rating || "N/A"}/5\n` +
      `Usage: ${prompt.usage_count || 0} times\n` +
      `Created: ${new Date(prompt.created_at).toLocaleDateString()}`

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(details)}`, '_blank')
        break
      case 'email':
        const subject = encodeURIComponent(`Prompt Share: ${prompt.title}`)
        const body = encodeURIComponent(details)
        window.location.href = `mailto:?subject=${subject}&body=${body}`
        break
      default:
        handleCopy(details)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        style={{ 
          color: i < rating ? '#fbbf24' : '#d1d5db',
          fill: i < rating ? '#fbbf24' : '#d1d5db'
        }}
      />
    ))
  }

  const getCategoryColor = (categoryName) => {
    const colors = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899']
    const hash = categoryName?.split('').reduce((a, b) => a + b.charCodeAt(0), 0) || 0
    return colors[hash % colors.length]
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'white' }}>
        {/* Header */}
        <header style={{ 
          backgroundColor: 'white', 
          borderBottom: '1px solid #e5e7eb',
          padding: '24px 0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <div style={{ 
            maxWidth: '1280px', 
            margin: '0 auto', 
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Link href="https://greycells.in">
              <Image 
                src="/GC Logo.png" 
                alt="Grey Cells" 
                width={200} 
                height={60}
                style={{ height: 'auto' }}
              />
              </Link>
            </div>
            <div style={{ 
              fontSize: '36px', 
              fontWeight: '700', 
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
              color: '#1a202c',
              letterSpacing: '-0.5px'
            }}>
              PROMPT LIBRARY
            </div>
            <div style={{ width: '200px' }}></div>
          </div>
        </header>

        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading prompt details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!prompt) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f1f1f1' }}>
        {/* Header */}
        <header style={{ 
          backgroundColor: 'white', 
          borderBottom: '1px solid #e5e7eb',
          padding: '24px 0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <div style={{ 
            maxWidth: '1280px', 
            margin: '0 auto', 
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Link href="https://greycells.in">
              <Image 
                src="/GC Logo.png" 
                alt="Grey Cells" 
                width={200} 
                height={60}
                style={{ height: 'auto' }}
              />
              </Link>
            </div>
            <div style={{ 
              fontSize: '36px', 
              fontWeight: '700', 
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
              color: '#1a202c',
              letterSpacing: '-0.5px'
            }}>
              PROMPT LIBRARY
            </div>
            <div style={{ width: '200px' }}></div>
          </div>
        </header>

        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Prompt not found</p>
            <button
              onClick={() => router.push('/library')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Library
            </button>
          </div>
        </div>
      </div>
    )
  }

  const isImage = prompt.attachment_filename && 
    /\.(jpg|jpeg|png|gif|webp)$/i.test(prompt.attachment_filename)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f1f1' }}>
      {/* Header */}
      <header style={{ 
        backgroundColor: 'white', 
        borderBottom: '1px solid #e5e7eb',
        padding: '24px 0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <div style={{ 
          maxWidth: '1280px', 
          margin: '0 auto', 
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Link href="https://greycells.in">
            <Image 
              src="/GC Logo.png" 
              alt="Grey Cells" 
              width={200} 
              height={60}
              style={{ height: 'auto' }}
            />
            </Link>
          </div>
          
          <div style={{ 
            fontSize: window.innerWidth < 768 ? '24px' : '32px', 
            fontWeight: '700', 
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
            color: '#1a202c',
            letterSpacing: '-0.5px',
            marginLeft: '40px'
          }}>
            PROMPT LIBRARY
          </div>
          
          <div style={{ width: '200px' }}></div>
        </div>
      </header>

      {/* Blue Strip with Prompt Name and Actions */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #1e40af 100%)',
        padding: '32px 0',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
      }}>
        <div style={{ 
          maxWidth: '1280px', 
          margin: '0 auto', 
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          {/* Left - Back Button */}
          <button
            onClick={() => router.push('/library')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'white',
              background: '#f97316',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '25px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
              transition: 'background 0.2s ease',
              flexShrink: 0
            }}
            onMouseEnter={(e) => e.target.style.background = '#ea580c'}
            onMouseLeave={(e) => e.target.style.background = '#f97316'}
          >
            <ArrowLeft size={20} />
            <span style={{ display: window.innerWidth < 640 ? 'none' : 'inline' }}>Back to Library</span>
          </button>

          {/* Center - Prompt Title */}
          <div style={{
            color: 'white',
            fontSize: window.innerWidth < 640 ? '16px' : window.innerWidth < 768 ? '18px' : '24px',
            fontWeight: '700',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
            textAlign: 'center',
            flex: '1',
            minWidth: '0',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: window.innerWidth < 768 ? 'normal' : 'nowrap',
            margin: '0 16px',
            lineHeight: window.innerWidth < 768 ? '1.3' : '1.4'
          }}>
            {prompt.title}
          </div>

          {/* Right - Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            <button
              onClick={() => window.print()}
              style={{
                padding: '12px',
                background: '#16a34a',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                cursor: 'pointer',
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = '#15803d'}
              onMouseLeave={(e) => e.target.style.background = '#16a34a'}
            >
              <Printer size={20} />
            </button>

            <button
              onClick={() => handleCopy(prompt.prompt_text)}
              style={{
                padding: '12px',
                background: copySuccess ? '#16a34a' : '#16a34a',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                cursor: 'pointer',
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = '#15803d'}
              onMouseLeave={(e) => e.target.style.background = '#16a34a'}
            >
              {copySuccess ? <Check size={20} /> : <Copy size={20} />}
            </button>

            <div style={{ position: 'relative', display: 'inline-block' }}>
              <button
                style={{
                  padding: '12px',
                  background: '#16a34a',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
                className="share-button"
                onMouseEnter={(e) => e.target.style.background = '#15803d'}
                onMouseLeave={(e) => e.target.style.background = '#16a34a'}
              >
                <Share2 size={20} />
              </button>
              <div 
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: '8px',
                  width: '200px',
                  background: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  border: '1px solid #e2e8f0',
                  opacity: 0,
                  visibility: 'hidden',
                  transition: 'all 0.2s ease',
                  zIndex: 100,
                  overflow: 'hidden'
                }}
                className="share-dropdown"
              >
                <button
                  onClick={() => handleShare('copy')}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    border: 'none',
                    background: 'white',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f1f5f9',
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#f0f9ff'
                    e.target.style.color = '#0369a1'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'white'
                    e.target.style.color = '#374151'
                  }}
                >
                  📋 Copy Details
                </button>
                <button
                  onClick={() => handleShare('whatsapp')}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    border: 'none',
                    background: 'white',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f1f5f9',
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#f0fdf4'
                    e.target.style.color = '#16a34a'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'white'
                    e.target.style.color = '#374151'
                  }}
                >
                  💬 Share on WhatsApp
                </button>
                <button
                  onClick={() => handleShare('email')}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    border: 'none',
                    background: 'white',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#fef3f2'
                    e.target.style.color = '#dc2626'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'white'
                    e.target.style.color = '#374151'
                  }}
                >
                  📧 Share via Email
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ 
        maxWidth: '1280px', 
        margin: '0 auto', 
        padding: '32px 24px',
        display: 'grid',
        gridTemplateColumns: window.innerWidth < 1024 ? '1fr' : '2fr 1fr',
        gap: '32px'
      }}>
        {/* Left Column - Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Metadata Card */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: window.innerWidth < 640 ? '16px' : '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: window.innerWidth < 768 ? '8px' : '16px', 
              marginBottom: window.innerWidth < 768 ? '12px' : '16px',
              flexDirection: window.innerWidth < 768 ? 'column' : 'row',
              alignItems: window.innerWidth < 768 ? 'flex-start' : 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={16} style={{ color: '#6b7280' }} />
                <span style={{ fontSize: '14px', color: '#6b7280', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>
                  {formatDate(prompt.created_at)}
                </span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Eye size={16} style={{ color: '#6b7280' }} />
                <span style={{ fontSize: '14px', color: '#6b7280', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>
                  {prompt.usage_count || 0} views
                </span>
              </div>
              
              {prompt.rating > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {renderStars(prompt.rating)}
                  <span style={{ fontSize: '14px', color: '#6b7280', marginLeft: '8px', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>
                    ({prompt.rating}/5)
                  </span>
                </div>
              )}

              {/* Version */}
              {prompt.version && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '3px 8px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: '600',
                  background: '#f3e8ff',
                  color: '#7c2d92',
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
                }}
                title="Version"
                >
                  {String(prompt.version).startsWith('v') ? prompt.version : `v${prompt.version}`}
                </span>
              )}

              {/* Output Status */}
              {prompt.output_status && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: '600',
                  background:
                    prompt.output_status?.toLowerCase() === 'successful'
                      ? '#dcfce7'
                      : prompt.output_status?.toLowerCase() === 'so-so'
                      ? '#fef9c3'
                      : prompt.output_status?.toLowerCase() === 'failure'
                      ? '#fee2e2'
                      : '#f1f5f9',
                  color:
                    prompt.output_status?.toLowerCase() === 'successful'
                      ? '#166534'
                      : prompt.output_status?.toLowerCase() === 'so-so'
                      ? '#92400e'
                      : prompt.output_status?.toLowerCase() === 'failure'
                      ? '#b91c1c'
                      : '#475569',
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
                }}
                title="Output"
                >
                  {prompt.output_status}
                </span>
              )}
            </div>

            {/* Tags Row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {prompt.categories?.name && (
                <span style={{
                  color: 'white',
                  padding: '2px 10px',
                  borderRadius: '9999px',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1.2,
                  height: '24px',
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                  background: prompt.categories?.color_hex || '#6b7280'
                }}
                title="Category"
                >
                  {prompt.categories.name}
                </span>
              )}

              {prompt.ai_tools?.name && (
                <span style={{
                  color: 'white',
                  padding: '2px 10px',
                  borderRadius: '9999px',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1.2,
                  height: '24px',
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                  background: prompt.ai_tools.color_hex || '#6b7280'                  
                }}
                title="AI Tool"
                >
                  {prompt.ai_tools.name}
                </span>
              )}         
              
              {/* AI Tool Model */}
              {prompt.ai_tool_model && (
                <span style={{
                  background: '#DBEAFE',
                  color: '#002895ff',
                  padding: '2px 10px',
                  borderRadius: '9999px',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1.2,
                  height: '24px',
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
                }}
                title="AI Model"
                >
                  {prompt.ai_tool_model}
                </span>
              )}
              
              {prompt.prompt_types?.name && (
                <span style={{
                  padding: '2px 10px',
                  borderRadius: '9999px',
                  background: '#f43f5e',
                  color: '#ffffffff',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1.2,
                  height: '24px',
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
                }}
                title="Prompt Source"
                >
                  {prompt.prompt_types.name}
                </span>
              )}              
              
            </div>

            {/* Custom Tags */}
            {prompt.tags && prompt.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
                {prompt.tags.map((tag, index) => (
                  <span
                    key={index}
                    style={{
                      padding: '4px 12px',
                      background: '#f3f4f6',
                      color: '#374151',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
                    }}
                  >
                    <Tag size={12} />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Prompt Content */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: window.innerWidth < 640 ? '16px' : '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', margin: 0, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>
                Prompt
              </h2>
              <button
                onClick={() => handleCopy(prompt.prompt_text)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  background: copySuccess ? '#dcfce7' : '#f3f4f6',
                  color: copySuccess ? '#166534' : '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
                }}
              >
                {copySuccess ? <Check size={16} /> : <Copy size={16} />}
                {copySuccess ? 'Copied!' : 'Copy'}
              </button>
            </div>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e2e8f0'
            }}>
              <pre style={{
                whiteSpace: 'pre-wrap',
                color: '#374151',
                fontSize: '14px',
                lineHeight: '1.6',
                margin: 0,
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
              }}>
                {prompt.prompt_text}
              </pre>
            </div>
          </div>

          {/* Output Content */}
          {prompt.output_text && (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', margin: 0, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>
                  Output
                </h2>
                <button
                  onClick={() => handleCopy(prompt.output_text)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
                  }}
                >
                  <Copy size={16} />
                  Copy
                </button>
              </div>
              
              <div style={{
                background: '#f0fdf4',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #dcfce7'
              }}>
                <pre style={{
                  whiteSpace: 'pre-wrap',
                  color: '#374151',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  margin: 0,
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
                }}>
                  {prompt.output_text}
                </pre>
              </div>
            </div>
          )}

          {/* Attachment */}
          {prompt.attachment_filename && (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', margin: 0, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>
                  Attachment
                </h2>
                <button
                  onClick={() => {
                    const fileUrl = (prompt.attachment_filename || '').startsWith('http')
                      ? prompt.attachment_filename
                      : `https://amfwuqwcivfptdfgpcsw.supabase.co/storage/v1/object/public/prompt-assets/${prompt.attachment_filename}`;
                    window.open(fileUrl, '_blank');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                    transition: 'background 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#2563eb'}
                  onMouseLeave={(e) => e.target.style.background = '#3b82f6'}
                >
                  <ExternalLink size={16} />
                  Download
                </button>
              </div>
              
              {isImage ? (
                <div 
                  style={{ cursor: 'pointer' }}
                  onClick={() => setShowImageModal(true)}
                >
                  <img
                    src={
                      (prompt.attachment_filename || '').startsWith('http')
                        ? prompt.attachment_filename
                        : `https://amfwuqwcivfptdfgpcsw.supabase.co/storage/v1/object/public/prompt-assets/${prompt.attachment_filename}`
                    }
                    style={{
                      width: '100%',
                      maxHeight: '400px',
                      objectFit: 'cover',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0'
                    }}
                  />
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '40px',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  border: '2px dashed #cbd5e0'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <ExternalLink size={32} style={{ color: '#9ca3af', margin: '0 auto 8px' }} />
                    <p style={{ color: '#6b7280', margin: 0, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>{prompt.attachment_filename}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Quick Stats */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937', margin: '0 0 16px 0', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>
              Quick Stats
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#6b7280', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>Word Count</span>
                <span style={{ fontWeight: '600', color: '#3b82f6', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>
                  {prompt.prompt_text ? (prompt.prompt_text.match(/\b\w+\b/g) || []).length : 0}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#6b7280', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>Character Count</span>
                <span style={{ fontWeight: '600', color: '#8b5cf6', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>
                  {prompt.prompt_text ? prompt.prompt_text.length : 0}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#6b7280', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>Credits Used</span>
                <span style={{ fontWeight: '600', color: '#f59e0b', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>
                  {prompt.credits_used || 0}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                <span style={{ color: '#666666ff', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>Created</span>
                <span style={{ color: '#666666ff', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>{formatDate(prompt.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Related Prompts */}
          {relatedPrompts.length > 0 && (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937', margin: '0 0 16px 0', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>
                Related Prompts
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {relatedPrompts.map((related) => (
                  <div
                    key={related.id}
                    onClick={() => router.push(`/library/${related.id}`)}
                    style={{
                      padding: '16px',
                      border: '1px solid #f1f5f9',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.borderColor = '#3b82f6'
                      e.target.style.background = '#f8fafc'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.borderColor = '#f1f5f9'
                      e.target.style.background = 'white'
                    }}
                  >
                    <h4 style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#1f2937',
                      margin: '0 0 4px 0',
                      lineHeight: '1.3',
                      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
                    }}>
                      {related.title}
                    </h4>
                    <p style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      margin: '0 0 8px 0',
                      lineHeight: '1.4',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
                    }}>
                      {related.prompt_text?.substring(0, 80)}...
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', color: '#9ca3af', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>
                        {related.usage_count || 0} views
                      </span>
                      {related.rating > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Star size={12} style={{ color: '#fbbf24', fill: '#fbbf24' }} />
                          <span style={{ fontSize: '12px', color: '#6b7280', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>{related.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setShowImageModal(false)}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <button
              onClick={() => setShowImageModal(false)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: 0,
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                padding: '8px'
              }}
            >
              <X size={24} />
            </button>
            <img
              src={
                (prompt.attachment_filename || '').startsWith('http')
                  ? prompt.attachment_filename
                  : `https://amfwuqwcivfptdfgpcsw.supabase.co/storage/v1/object/public/prompt-assets/${prompt.attachment_filename}`
              }
              alt="Attachment"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: '8px'
              }}
            />
          </div>
        </div>
      )}

      {/* Copy Success Toast */}
      {copySuccess && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: '#166534',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
        }}>
          <Check size={20} />
          <span>Copied to clipboard!</span>
        </div>
      )}

      {/* CSS for hover effects and responsive design */}
      <style jsx>{`
        .share-button:hover + .share-dropdown,
        .share-dropdown:hover {
          opacity: 1 !important;
          visibility: visible !important;
        }
        
        @media (max-width: 1024px) {
          .main-grid {
            grid-template-columns: 1fr !important;
          }
        }
        
        @media (max-width: 768px) {
          .blue-strip {
            padding: 20px 0 !important;
          }
          
          .blue-strip > div {
            flex-direction: column !important;
            gap: 16px !important;
            text-align: center !important;
          }
          
          .prompt-title {
            font-size: 18px !important;
            text-align: center !important;
            margin: 0 !important;
          }
          
          .action-buttons {
            justify-content: center !important;
          }
          
          .metadata-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 8px !important;
          }
          
          .tags-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 8px !important;
          }
        }
        
        @media (max-width: 640px) {
          .back-button-text {
            display: none !important;
          }
          
          .content-padding {
            padding: 16px !important;
          }
          
          .main-content-padding {
            padding: 16px 16px !important;
          }
          
          .card-padding {
            padding: 16px !important;
          }
          
          .stats-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <style jsx global>{`
      body, html {
        margin: 0 !important;
        padding: 0 !important;
      }
    `}</style>
    </div>
  )
}