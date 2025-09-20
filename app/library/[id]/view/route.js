import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function PATCH(request, { params }) {
  try {
    const { id } = params
    
    const { data, error } = await supabase
      .from('prompts')
      .update({ 
        usage_count: supabase.raw('usage_count + 1')
      })
      .eq('id', id)
      .select('usage_count')
      .single()

    if (error) throw error

    return Response.json({ usage_count: data.usage_count })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}