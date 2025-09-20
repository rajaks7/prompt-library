'use client'
import { useState, useMemo, useEffect } from 'react'
import { Search, Heart, Grid, List, Filter } from 'lucide-react'
import Image from 'next/image'
import PromptCard from './PromptCard'
import ShareModal from './ShareModal'

export default function LibraryClient({ prompts, tools, categories }) {
  const [filters, setFilters] = useState({ 
    search: '', 
    tool: '',
    category: '',
    rating: '',
    sort: 'created_at_desc',
    favoritesOnly: false 
  })
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'table'
  const [selectionMode, setSelectionMode] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)

  // Selected prompts (IDs)
  const [selectedPrompts, setSelectedPrompts] = useState([])

  // Window resize handler for responsive design
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // selection action UI state + handlers
  const [showShareModal, setShowShareModal] = useState(false)

  const handleExportSelected = () => {
    if (selectedPrompts.length === 0) return
    const selectedData = filteredPrompts.filter(p => selectedPrompts.includes(p.id))
    const textContent = selectedData.map(prompt => {
      const tool = prompt.tool_name || prompt.toolName || "Not specified"
      const model = prompt.ai_tool_model || "Not specified"
      const category = prompt.category_name || prompt.categoryName || "Not specified"
      const outputStatus = prompt.output_status || "Not specified"

      return (
        `Title: ${prompt.title}\n` +
        `Tool: ${tool}\n` +
        `Model: ${model}\n` +
        `Category: ${category}\n` +
        `Output Status: ${outputStatus}\n\n` +
        `Content:\n${prompt.prompt_text}\n\n` +
        `Rating: ${prompt.rating || "N/A"}/5\n` +
        `Usage: ${prompt.usage_count || 0} times\n` +
        `Created: ${prompt.created_at ? new Date(prompt.created_at).toLocaleDateString() : ''}\n\n` +
        `---\n\n`
      )
    }).join('')

    const el = document.createElement('a')
    const file = new Blob([textContent], { type: 'text/plain' })
    el.href = URL.createObjectURL(file)
    el.download = `selected-prompts-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(el)
    el.click()
    document.body.removeChild(el)
  }

  // Filter & sort (kept same logic as your original)
  const filteredPrompts = useMemo(() => {
    let filtered = [...prompts]

    if (filters.search) {
      const query = filters.search.toLowerCase()
      filtered = filtered.filter(p =>
        (p.title || '').toLowerCase().includes(query) ||
        (p.ai_tool_model || '').toLowerCase().includes(query) ||
        (Array.isArray(p.tags) && p.tags.some(tag => tag.toLowerCase().includes(query)))
      )
    }

    if (filters.tool) {
      filtered = filtered.filter(p => p.tool_name === filters.tool)
    }

    if (filters.category) {
      filtered = filtered.filter(p => p.category_name === filters.category)
    }

    if (filters.rating) {
      filtered = filtered.filter(p => (p.rating || 0) >= parseFloat(filters.rating))
    }

    if (filters.favoritesOnly) {
      filtered = filtered.filter(p => p.is_favorite)
    }

    filtered.sort((a, b) => {
      switch (filters.sort) {
        case 'created_at_desc':
        return new Date(b.created_at || 0) - new Date(a.created_at || 0) || a.id.localeCompare(b.id)
        case 'created_at_asc':
        return new Date(a.created_at || 0) - new Date(b.created_at || 0) || b.id.localeCompare(a.id)
        case 'title_asc':
          return (a.title || '').localeCompare(b.title || '')
        case 'title_desc':
          return (b.title || '').localeCompare(a.title || '')
        case 'rating_desc':
          return (b.rating || 0) - (a.rating || 0)
        case 'rating_asc':
          return (a.rating || 0) - (b.rating || 0)
        default:
          return 0
      }
    })

    return filtered
  }, [prompts, filters])

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  const handleFavoriteToggle = () => {
    setFilters(prev => ({ ...prev, favoritesOnly: !prev.favoritesOnly }))
  }

  const clearAllFilters = () => {
    setFilters({ 
      search: '', 
      tool: '',
      category: '',
      rating: '',
      sort: 'created_at_desc',
      favoritesOnly: false 
    })
  }

  // Selection handlers
  const handleSelectPrompt = (id) => {
    setSelectedPrompts(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedPrompts.length === filteredPrompts.length && filteredPrompts.length > 0) {
      setSelectedPrompts([])
    } else {
      setSelectedPrompts(filteredPrompts.map(p => p.id))
    }
  }

  // Derived unique lists for filter dropdowns
  const uniqueTools = tools && tools.length > 0 
  ? tools.map(tool => tool.name).sort()
  : [...new Set(prompts.map(p => p.tool_name).filter(Boolean))].sort()
const uniqueCategories = categories && categories.length > 0
  ? categories.map(category => category.name).sort()
  : [...new Set(prompts.map(p => p.category_name).filter(Boolean))].sort()

  // Responsive grid columns
  const getGridColumns = () => {
    if (windowWidth < 640) return '1fr'
    if (windowWidth < 768) return 'repeat(2, 1fr)'
    if (windowWidth < 1024) return 'repeat(3, 1fr)'
    return 'repeat(4, 1fr)'
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f1f1ff', overflowX: 'hidden', boxSizing: 'border-box' }}>
      {/* Header - Mobile Responsive */}
      <header style={{ 
        backgroundColor: 'white', 
        borderBottom: '1px solid #e5e7eb',
        padding: windowWidth < 768 ? '16px 0' : '24px 0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <div style={{ 
          maxWidth: '1280px', 
          margin: '0 auto', 
          padding: windowWidth < 640 ? '0 16px' : '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: windowWidth < 768 ? 'wrap' : 'nowrap',
          gap: windowWidth < 768 ? '16px' : '20px'
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Image 
              src="/GC Logo.png" 
              alt="Grey Cells" 
              width={windowWidth < 640 ? 150 : 200} 
              height={windowWidth < 640 ? 45 : 60}
              style={{ height: 'auto' }}
            />
          </div>

          {/* Title & Count */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: windowWidth < 640 ? '12px' : '20px',
            flexWrap: windowWidth < 640 ? 'wrap' : 'nowrap',
            justifyContent: windowWidth < 768 ? 'center' : 'flex-start'
          }}>
            <h1 style={{ 
              fontSize: windowWidth < 640 ? '20px' : windowWidth < 768 ? '24px' : '32px',
              fontWeight: '700', 
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              color: '#1a202c',
              margin: 0,
              letterSpacing: '-0.5px',
              textAlign: windowWidth < 768 ? 'center' : 'left'
            }}>
              PROMPT LIBRARY
            </h1>
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: windowWidth < 640 ? '8px 14px' : '10px 18px',
              borderRadius: '25px',
              fontSize: windowWidth < 640 ? '14px' : '16px',
              fontWeight: '700',
              fontFamily: "'Inter', sans-serif",
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.25)'
            }}>
              {filteredPrompts.length} prompts
            </div>
          </div>

          {windowWidth >= 768 && <div style={{ width: '200px' }}></div>}
        </div>
      </header>

      {/* Sticky Search + Filters - Mobile Responsive */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'white',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
      }}>
        {/* Search Bar */}
        <div style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #1e40af 100%)',
          padding: windowWidth < 768 ? '20px 0' : '32px 0',
          width: '100vw',
          position: 'relative',
          left: '50%',
          right: '50%',
          marginLeft: '-50vw',
          marginRight: '-50vw',
          boxSizing: 'border-box'
        }}>
          <div style={{ 
            maxWidth: windowWidth < 768 ? '100%' : '800px',
            margin: '0 auto', 
            padding: windowWidth < 640 ? '0 16px' : '0 24px'
          }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <div style={{ 
                position: 'relative',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Search 
                  size={windowWidth < 640 ? 18 : 20}
                  style={{ 
                    position: 'absolute', 
                    left: windowWidth < 640 ? '12px' : '16px',
                    color: '#9ca3af',
                    zIndex: 10
                  }} 
                />
                <input
                  type="text"
                  name="search"
                  placeholder={windowWidth < 640 ? "Search prompts..." : "Search prompts, tags, or model..."}
                  value={filters.search}
                  onChange={handleFilterChange}
                  style={{
                    width: '100%',
                    padding: windowWidth < 640 ? '12px 80px 12px 40px' : '16px 120px 16px 48px',
                    fontSize: windowWidth < 640 ? '14px' : '16px',
                    fontFamily: "'Inter', sans-serif",
                    border: 'none',
                    borderRadius: '25px',
                    backgroundColor: 'white',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                    outline: 'none'
                  }}
                />
                <button
                  style={{
                    position: 'absolute',
                    right: '4px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    padding: windowWidth < 640 ? '8px 16px' : '12px 24px',
                    borderRadius: '20px',
                    fontWeight: '600',
                    fontFamily: "'Inter', sans-serif",
                    cursor: 'pointer',
                    fontSize: windowWidth < 640 ? '12px' : '14px'
                  }}
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Controls - Mobile Responsive */}
        <div style={{
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          padding: windowWidth < 640 ? '12px 0' : '16px 0'
        }}>
          <div style={{ 
            maxWidth: '1280px', 
            margin: '0 auto', 
            padding: windowWidth < 640 ? '0 16px' : '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            {/* Left Controls */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: windowWidth < 640 ? '8px' : '12px',
              flexWrap: 'wrap',
              minWidth: 0
            }}>
              <select
                name="sort"
                value={filters.sort}
                onChange={handleFilterChange}
                style={{
                  padding: windowWidth < 640 ? '6px 8px' : '8px 12px',
                  border: '1px solid #cbd5e0',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  fontSize: windowWidth < 640 ? '12px' : '14px',
                  fontFamily: "'Inter', sans-serif",
                  cursor: 'pointer',
                  color: '#4a5568',
                  minWidth: 0
                }}
              >
                <option value="created_at_desc">Newest First</option>
                <option value="created_at_asc">Oldest First</option>
                <option value="title_asc">Title A-Z</option>
                <option value="title_desc">Title Z-A</option>
                <option value="rating_desc">Highest Rated</option>
                <option value="rating_asc">Lowest Rated</option>
              </select>

              <button
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: windowWidth < 640 ? '6px 12px' : '8px 16px',
                  border: '1px solid #cbd5e0',
                  borderRadius: '6px',
                  backgroundColor: showFilters ? '#3b82f6' : 'white',
                  color: showFilters ? 'white' : '#4a5568',
                  cursor: 'pointer',
                  fontSize: windowWidth < 640 ? '12px' : '14px',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: '500'
                }}
              >
                <Filter size={windowWidth < 640 ? 14 : 16} />
                {windowWidth >= 640 && 'Filters'}
              </button>

              {(filters.tool || filters.category || filters.rating || filters.search) && (
                <button
                  onClick={clearAllFilters}
                  style={{
                    padding: windowWidth < 640 ? '6px 12px' : '8px 16px',
                    border: '1px solid #cbd5e0',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    color: '#e53e3e',
                    cursor: 'pointer',
                    fontSize: windowWidth < 640 ? '12px' : '14px',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: '500'
                  }}
                >
                  Clear
                </button>
              )}
            </div>

            {/* Right Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: windowWidth < 640 ? '8px' : '12px' }}>
              <div style={{ 
                display: 'flex', 
                border: '1px solid #cbd5e0', 
                borderRadius: '6px',
                overflow: 'hidden',
                backgroundColor: 'white'
              }}>
                <button
                  onClick={() => setViewMode('grid')}
                  style={{
                    padding: windowWidth < 640 ? '6px 8px' : '8px 10px',
                    border: 'none',
                    backgroundColor: viewMode === 'grid' ? '#3b82f6' : 'white',
                    color: viewMode === 'grid' ? 'white' : '#4a5568',
                    cursor: 'pointer'
                  }}
                >
                  <Grid size={windowWidth < 640 ? 14 : 16} />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  style={{
                    padding: windowWidth < 640 ? '6px 8px' : '8px 10px',
                    border: 'none',
                    borderLeft: '1px solid #cbd5e0',
                    backgroundColor: viewMode === 'table' ? '#3b82f6' : 'white',
                    color: viewMode === 'table' ? 'white' : '#4a5568',
                    cursor: 'pointer'
                  }}
                >
                  <List size={windowWidth < 640 ? 14 : 16} />
                </button>
              </div>

              <button
                onClick={() => { setSelectionMode(!selectionMode); if (selectionMode) setSelectedPrompts([]) }}
                style={{
                  padding: windowWidth < 640 ? '6px 12px' : '8px 16px',
                  border: '1px solid #cbd5e0',
                  borderRadius: '6px',
                  backgroundColor: selectionMode ? '#3b82f6' : 'white',
                  color: selectionMode ? 'white' : '#4a5568',
                  cursor: 'pointer',
                  fontSize: windowWidth < 640 ? '12px' : '14px',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: '500'
                }}
              >
                Select
              </button>
            </div>
          </div>

          {/* Expanded Filters - Mobile Responsive */}
          {showFilters && (
            <div style={{
              maxWidth: '1280px',
              margin: '16px auto 0',
              padding: windowWidth < 640 ? '0 16px' : '0 24px'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: windowWidth < 640 ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                padding: '16px',
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <select
                  name="tool"
                  value={filters.tool}
                  onChange={handleFilterChange}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #cbd5e0',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    fontSize: '14px',
                    fontFamily: "'Inter', sans-serif",
                    cursor: 'pointer'
                  }}
                >
                  <option value="">All Tools</option>
                  {uniqueTools.map(tool => (
                    <option key={tool} value={tool}>{tool}</option>
                  ))}
                </select>

                <select
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #cbd5e0',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    fontSize: '14px',
                    fontFamily: "'Inter', sans-serif",
                    cursor: 'pointer'
                  }}
                >
                  <option value="">All Categories</option>
                  {uniqueCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>

                <select
                  name="rating"
                  value={filters.rating}
                  onChange={handleFilterChange}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #cbd5e0',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    fontSize: '14px',
                    fontFamily: "'Inter', sans-serif",
                    cursor: 'pointer'
                  }}
                >
                  <option value="">Any Rating</option>
                  <option value="4.5">4.5+ Stars</option>
                  <option value="4.0">4.0+ Stars</option>
                  <option value="3.5">3.5+ Stars</option>
                  <option value="3.0">3.0+ Stars</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selection action bar - Mobile Responsive */}
      {selectionMode && (
        <div style={{
          maxWidth: '1280px',
          margin: '16px auto',
          padding: windowWidth < 640 ? '8px 16px' : '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          background: '#f8fafc',
          border: '1px solid #e6eef6',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          borderRadius: 10,
          flexWrap: windowWidth < 640 ? 'wrap' : 'nowrap'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: windowWidth < 640 ? 8 : 12,
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" 
          }}>
            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: windowWidth < 640 ? '14px' : '16px' }}>
              {selectedPrompts.length} selected
            </div>
            <button
              onClick={() => {
                if (selectedPrompts.length === Math.min(filteredPrompts.length, 10)) {
                  setSelectedPrompts([])
                } else {
                  setSelectedPrompts(filteredPrompts.slice(0, 10).map(p => p.id))
                }
              }}
              style={{ 
                padding: windowWidth < 640 ? '6px 10px' : '8px 12px',
                borderRadius: 8, 
                border: '1px solid #d1d5db', 
                background: 'white', 
                cursor: 'pointer', 
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                fontSize: windowWidth < 640 ? '12px' : '14px'
              }}
            >
              {selectedPrompts.length === Math.min(filteredPrompts.length, 10) ? 'Deselect all' : 'Select all'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: windowWidth < 640 ? 6 : 8 }}>
            <button
              onClick={() => {
                if (selectedPrompts.length === 0) return
                const text = filteredPrompts.filter(p => selectedPrompts.includes(p.id)).map(p => `Title: ${p.title}\n\n${p.prompt_text}\n\n---\n\n`).join('')
                navigator.clipboard.writeText(text)
                alert('Copied selected prompts to clipboard')
              }}
              style={{ 
                padding: windowWidth < 640 ? '6px 10px' : '8px 12px',
                borderRadius: 8, 
                border: '1px solid #d1d5db', 
                background: 'white', 
                cursor: 'pointer', 
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                fontSize: windowWidth < 640 ? '12px' : '14px'
              }}
            >
              Copy
            </button>

            <button
              onClick={handleExportSelected}
              style={{ 
                padding: windowWidth < 640 ? '6px 10px' : '8px 12px',
                borderRadius: 8, 
                border: 'none', 
                background: '#10b981', 
                color: 'white', 
                cursor: 'pointer', 
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                fontSize: windowWidth < 640 ? '12px' : '14px'
              }}
            >
              Export
            </button>

            <button
              onClick={() => setShowShareModal(true)}
              style={{ 
                padding: windowWidth < 640 ? '6px 10px' : '8px 12px',
                borderRadius: 8, 
                border: 'none', 
                background: '#3b82f6', 
                color: 'white', 
                cursor: 'pointer', 
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                fontSize: windowWidth < 640 ? '12px' : '14px'
              }}
            >
              Share
            </button>
          </div>
        </div>
      )}

      {/* Main content - Mobile Responsive Grid */}
      <div style={{ 
        maxWidth: '1280px', 
        margin: '0 auto', 
        padding: windowWidth < 640 ? '20px 16px' : '32px 24px'
      }}>
        {filteredPrompts.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: windowWidth < 640 ? '32px 0' : '64px 0',
            color: '#4a5568'
          }}>
            <h3 style={{ 
              fontSize: windowWidth < 640 ? '18px' : '20px',
              fontWeight: '600', 
              marginBottom: '8px', 
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" 
            }}>
              No prompts found
            </h3>
            <p style={{ 
              margin: 0, 
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
              fontSize: windowWidth < 640 ? '14px' : '16px'
            }}>
              Try adjusting your search terms or filters
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: getGridColumns(),
            gap: windowWidth < 640 ? '16px' : '20px'
          }}>
            {filteredPrompts.map(prompt => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                selectionMode={selectionMode}
                isSelected={selectedPrompts.includes(prompt.id)}
                onSelect={() => handleSelectPrompt(prompt.id)}
              />
            ))}
          </div>
        ) : (
          // Table view - Mobile Responsive
          <div style={{ 
            background: 'white', 
            borderRadius: 12, 
            padding: windowWidth < 640 ? '8px' : '12px',
            border: '1px solid #e6eef6',
            overflowX: 'auto'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              marginBottom: 8,
              minWidth: '600px' // Ensure minimum width for table
            }}>
              <div>
                {selectionMode && (
                  <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                    <input type="checkbox" checked={selectedPrompts.length === filteredPrompts.length && filteredPrompts.length > 0} onChange={handleSelectAll} />
                    <span style={{ marginLeft: 6, fontSize: 13 }}>Select all</span>
                  </label>
                )}
              </div>
              <div style={{ fontSize: 13, color: '#4b5563' }}>{filteredPrompts.length} prompts</div>
            </div>

            <div style={{ overflowX: 'auto', minWidth: '600px' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
              }}>
                <thead style={{ backgroundColor: '#f8fafc', textAlign: 'left' }}>
                  <tr>
                    {selectionMode && <th style={{ padding: '10px 12px' }}></th>}
                    <th style={{ padding: '10px 12px', minWidth: '200px' }}>Prompt</th>
                    <th style={{ padding: '10px 12px', minWidth: '120px' }}>Tool</th>
                    <th style={{ padding: '10px 12px', minWidth: '100px' }}>Category</th>
                    <th style={{ padding: '10px 12px', minWidth: '80px' }}>Rating</th>
                    <th style={{ padding: '10px 12px', minWidth: '60px' }}>Usage</th>
                    <th style={{ padding: '10px 12px', minWidth: '80px' }}>Created</th>                    
                  </tr>
                </thead>
                <tbody>
                  {filteredPrompts.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f1f3f4', cursor: 'pointer' }}>
                      {selectionMode && (
                        <td style={{ padding: '10px 12px' }}>
                          <input
                            type="checkbox"
                            checked={selectedPrompts.includes(p.id)}
                            onChange={(e) => { e.stopPropagation(); handleSelectPrompt(p.id) }}
                          />
                        </td>
                      )}
                      <td style={{ padding: '10px 12px', minWidth: '200px' }}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <div style={{ 
                            width: windowWidth < 640 ? 48 : 72, 
                            height: windowWidth < 640 ? 36 : 56,
                            background: '#f3f4f6', 
                            borderRadius: 8, 
                            overflow: 'hidden', 
                            flexShrink: 0 
                          }}>
                            {p.attachment_filename ? (
                              <img 
                                src={`/uploads/${p.attachment_filename}`} 
                                alt={p.title} 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                              />
                            ) : (
                              <div style={{ 
                                width: '100%', 
                                height: '100%', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                color: '#9aa0a6',
                                fontSize: windowWidth < 640 ? '10px' : '12px'
                              }}>
                                No Image
                              </div>
                            )}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ 
                              fontWeight: 600, 
                              fontSize: windowWidth < 640 ? '13px' : '14px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {p.title}
                            </div>
                            <div style={{ 
                              fontSize: windowWidth < 640 ? '11px' : '12px',
                              color: '#6b7280', 
                              marginTop: 4,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {(p.prompt_text || '').slice(0, windowWidth < 640 ? 60 : 120)}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '10px 12px', minWidth: '120px' }}>
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ 
                            padding: '2px 6px', 
                            borderRadius: 18, 
                            color: '#fff', 
                            backgroundColor: p.tool_color || '#6b7280', 
                            fontWeight: 600, 
                            fontSize: windowWidth < 640 ? '10px' : '12px'
                          }}>
                            {p.tool_name}
                          </span>
                          {p.ai_tool_model && (
                            <span style={{ 
                              padding: '2px 6px', 
                              borderRadius: 12, 
                              background: '#cce7fcff', 
                              fontSize: windowWidth < 640 ? '10px' : '12px',
                              color: '#00537fff' 
                            }}>
                              {p.ai_tool_model}
                            </span>
                          )}
                          {p.version && (
                            <span style={{ 
                              padding: '2px 8px', 
                              borderRadius: 10, 
                              background: '#f3e8ff', 
                              fontSize: windowWidth < 640 ? '10px' : '12px',
                              color: '#7c2ae8' 
                            }}>
                              {String(p.version).startsWith('v') ? p.version : `v${String(p.version)}`}
                            </span>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: '10px 12px', minWidth: '100px' }}>
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          padding: '2px 8px', 
                          borderRadius: 18, 
                          color: '#fff', 
                          fontWeight: 600, 
                          fontSize: windowWidth < 640 ? '11px' : '13px',
                          backgroundColor: p.category_color || p.categories?.color_hex || '#6b7280'
                        }}>
                          {p.category_name || 'Uncategorized'}
                        </span>
                      </td>

                      <td style={{ padding: '10px 12px', minWidth: '80px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {[1,2,3,4,5].map(st => (
                            <span key={st} style={{ 
                              fontSize: windowWidth < 640 ? '10px' : '12px',
                              color: st <= Math.round(p.rating || 0) ? '#fbbf24' : '#e9edf0'
                            }}>
                              ★
                            </span>
                          ))}
                          <span style={{ 
                            marginLeft: 6, 
                            color: '#6b7280',
                            fontSize: windowWidth < 640 ? '10px' : '11px'
                          }}>
                            ({(p.rating || 0).toFixed(1)})
                          </span>
                        </div>
                      </td>

                      <td style={{ 
                        padding: '10px 12px', 
                        minWidth: '60px',
                        fontSize: windowWidth < 640 ? '12px' : '14px'
                      }}>
                        {p.usage_count || 0}
                      </td>
                      <td style={{ 
                        padding: '10px 12px', 
                        minWidth: '80px',
                        fontSize: windowWidth < 640 ? '11px' : '12px'
                      }}>
                        {p.created_at ? (new Date(p.created_at).toLocaleDateString()) : ''}
                      </td>                      
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        selectedPrompts={selectedPrompts}
        prompts={filteredPrompts}
      />
    </div>
  )
}