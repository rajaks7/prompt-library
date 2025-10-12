// app/library/page.js
import { createClient } from '@supabase/supabase-js'
import LibraryClient from '../../components/LibraryClient'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export const metadata = {
  title: 'Prompt Library - Grey Cells',
  description: 'Browse and explore our collection of AI prompts',
}

export const dynamic = 'force-dynamic'

export default async function LibraryPage(props) {
  const searchParams = await props.searchParams
  const page = parseInt(searchParams?.page) || 1
  const pageSize = 20

  // fetch first page via the API so we get paged data + filteredTotal & overallTotal
  // Build an absolute URL for server-side fetch. Prefer explicit NEXT_PUBLIC_BASE_URL, then VERCEL_URL, else localhost.
  const explicitBase = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL
  const vercel = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null
  const fallbackLocal = `http://localhost:${process.env.PORT || 3000}`
  const baseUrl = explicitBase || vercel || fallbackLocal
  const apiUrl = `${baseUrl}/api/prompts?page=${page}&limit=${pageSize}`
  let prompts = []
  let meta = {}

  try {
    const res = await fetch(apiUrl)
    if (!res.ok) {
      // try to read the response body for more context
      let body = null
      try {
        body = await res.text()
      } catch (readErr) {
        body = `<failed to read body: ${readErr?.message}>`
      }
      console.error('Failed to fetch prompts from API:', res.status, res.statusText, body)
      throw new Error('API fetch failed')
    }

    const json = await res.json()
    prompts = json.data || []
    meta = json.meta || {}
  } catch (err) {
    // On API failure, fall back to a direct DB query so the page can still render.
    console.warn('API /api/prompts failed, falling back to Supabase query:', err?.message)
    try {
      const offset = (page - 1) * pageSize
      // select related fields similar to the API so client receives expected shape
      const { data: fallbackData, error: fallbackErr, count } = await supabase
        .from('prompts')
        .select(`
          id, title, prompt_text, rating, usage_count, attachment_filename, created_at, tags, output_status,
          ai_tool_model, version,
          ai_tools(name, color_hex),
          categories(name, image_url, color_hex),
          prompt_types(name)
        `, { count: 'exact' })
        .range(offset, offset + pageSize - 1)

      if (fallbackErr) {
        console.error('Supabase fallback error:', fallbackErr.message)
        prompts = []
        meta = { page, limit: pageSize, filteredTotal: 0, overallTotal: 0, hasMore: false }
      } else {
        // normalize similar to API
        const normalized = (fallbackData || []).map(row => ({
          ...row,
          category_image_url: row.categories?.image_url || null,
          category_color: row.categories?.color_hex || null,
          category_name: row.categories?.name || null,
          tool_name: row.ai_tools?.name || null,
          tool_color: row.ai_tools?.color_hex || null,
        }))

        prompts = normalized
        const total = count ?? (normalized ? normalized.length : 0)
        meta = { page, limit: pageSize, filteredTotal: total, overallTotal: total, hasMore: offset + (normalized ? normalized.length : 0) < total }
      }
    } catch (fallbackErr) {
      console.error('Unexpected error during Supabase fallback:', fallbackErr)
      prompts = []
      meta = { page, limit: pageSize, filteredTotal: 0, overallTotal: 0, hasMore: false }
    }
  }

  // fetch tools for filters
  const { data: tools } = await supabase
    .from('ai_tools')
    .select('id, name, color_hex')
    .order('name')

  // fetch categories for filters
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, image_url')
    .order('name')

  // Transform data to match component expectations
  const transformedPrompts = (prompts || []).map(prompt => ({
    ...prompt,
    id: String(prompt.id),
    // Map the joined data properly
    tool_name: prompt.ai_tools?.name || 'Unknown Tool',
    tool_color: prompt.ai_tools?.color_hex || '#6B7280',
    category_name: prompt.categories?.name || 'Uncategorized',
    category_color: prompt.categories?.color_hex,
    category_image_url: prompt.categories?.image_url,
    type_name: prompt.prompt_types?.name,    
    // Ensure tags is always an array
    tags: Array.isArray(prompt.tags) ? prompt.tags : []
  }))

  // de-duplicate by id (in case joins or upstream queries produced duplicates)
  const dedupedMap = new Map()
  for (const p of transformedPrompts) {
    if (!dedupedMap.has(p.id)) dedupedMap.set(p.id, p)
  }
  const dedupedPrompts = Array.from(dedupedMap.values())

  return (
    <LibraryClient
      initialPrompts={dedupedPrompts}
      initialMeta={meta}
      tools={tools || []}
      categories={categories || []}
      pageSize={pageSize}
    />
  )
}