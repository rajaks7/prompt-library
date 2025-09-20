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

// fetch prompts with pagination
const { data: prompts, error: promptsError } = await supabase
  .from('prompts')
  .select(`
    id, title, prompt_text, output_text, 
    rating, usage_count, created_at, updated_at,
    tags, output_status, version, ai_tool_model, attachment_filename, credits_used,
    ai_tools!inner(id, name, color_hex),
    categories!inner(id, name, image_url, color_hex),
    prompt_types(id, name)      
  `)
  .order('created_at', { ascending: false })
  .limit(100)

// Get total count for pagination
const { count: totalCount, error: countError } = await supabase
  .from('prompts')
  .select('*', { count: 'exact', head: true })

  if (promptsError || countError) {
    console.error('Error fetching prompts:', promptsError.message)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load prompts</h2>
          <p className="text-gray-600">{promptsError.message}</p>
        </div>
      </div>
    )
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

  console.log('Raw prompts data:', prompts)

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

const totalPages = Math.ceil(totalCount / pageSize)

return (
  <LibraryClient 
    prompts={transformedPrompts} 
    tools={tools || []} 
    categories={categories || []}
    currentPage={page}
    totalPages={totalPages}
    totalCount={totalCount}
  />
)
}