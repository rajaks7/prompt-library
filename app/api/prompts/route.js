// app/api/prompts/route.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// GET /api/prompts?page=1&limit=20&search=term&sort=created_at.desc
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(5, parseInt(url.searchParams.get('limit') || '20')));
    const offset = (page - 1) * limit;
    const search = url.searchParams.get('search') || '';
  const sort = url.searchParams.get('sort') || 'created_at.desc';
  const tool = url.searchParams.get('tool') || '';
  const category = url.searchParams.get('category') || '';
  const rating = url.searchParams.get('rating') || '';
  // favorites column removed/unsupported in this DB; ignore favorites filter
  const favoritesOnly = false;

    let toolId = null;
    let catId = null;
    // build query: select prompts and include related ai_tools and categories so we can surface image and names
    let filteredQuery = supabase.from('prompts').select(`
      id, title, prompt_text, rating, usage_count, attachment_filename, created_at, tags, output_status,
      ai_tool_model, version,
      ai_tools(name, color_hex),
      categories(name, image_url, color_hex)
    `, { count: 'exact' });

    if (search) filteredQuery = filteredQuery.ilike('title', `%${search}%`);

    // Resolve tool name -> id then filter by ai_tool_id (more robust across schemas)
    if (tool) {
      try {
        const { data: toolRows } = await supabase.from('ai_tools').select('id').eq('name', tool).limit(1)
        const toolId = toolRows && toolRows.length > 0 ? toolRows[0].id : null
        if (toolId) filteredQuery = filteredQuery.eq('ai_tool_id', toolId)
        else {
          // no matching tool -> return empty result set
          return new Response(JSON.stringify({ data: [], meta: { page, limit, filteredTotal: 0, overallTotal: 0, hasMore: false } }), { status: 200 })
        }
      } catch (lookupErr) {
        console.warn('Tool lookup error:', lookupErr?.message)
      }
    }

    // Resolve category name -> id then filter by category_id
    if (category) {
      try {
        const { data: catRows } = await supabase.from('categories').select('id').eq('name', category).limit(1)
        const catId = catRows && catRows.length > 0 ? catRows[0].id : null
        if (catId) filteredQuery = filteredQuery.eq('category_id', catId)
        else {
          return new Response(JSON.stringify({ data: [], meta: { page, limit, filteredTotal: 0, overallTotal: 0, hasMore: false } }), { status: 200 })
        }
      } catch (lookupErr) {
        console.warn('Category lookup error:', lookupErr?.message)
      }
    }
    // only apply rating filter when it's a valid number
    if (rating) {
      const ratingNum = Number(rating)
      if (!Number.isNaN(ratingNum)) {
        filteredQuery = filteredQuery.gte('rating', ratingNum)
      }
    }
  // favorites filter intentionally ignored (column not available)

    // sorting
    // parse sort safely (expecting 'field.dir')
    const sortParts = String(sort).split('.')
    const sortField = sortParts[0] || 'created_at'
    const sortDir = sortParts[1] || 'desc'
    try {
      filteredQuery = filteredQuery.order(sortField, { ascending: sortDir !== 'desc' })
    } catch (orderErr) {
      console.warn('Invalid sort field or direction, falling back to created_at.desc', orderErr?.message)
      filteredQuery = filteredQuery.order('created_at', { ascending: false })
    }

  // get paged data and filtered total
  const { data, error, count: filteredCount } = await filteredQuery.range(offset, offset + limit - 1);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    // get overall total (no filters). Use head select to only retrieve count
    const { count: overallCount, error: overallErr } = await supabase.from('prompts').select('*', { head: true, count: 'exact' });
    if (overallErr) {
      // not fatal — continue without overall count
      console.warn('Failed to fetch overall count:', overallErr.message);
    }

    // normalize rows: move related fields to top-level denormalized keys expected by the client
    const normalized = (data || []).map(row => ({
      ...row,
      category_image_url: row.categories?.image_url || null,
      category_color: row.categories?.color_hex || null,
      category_name: row.categories?.name || null,
      tool_name: row.ai_tools?.name || null,
      tool_color: row.ai_tools?.color_hex || null,
      // keep nested objects in case callers need them, but client uses top-level keys
    }))

    const filteredTotal = filteredCount ?? (normalized ? normalized.length : 0);
    const overallTotal = overallCount ?? filteredTotal;
    const hasMore = offset + (data ? data.length : 0) < filteredTotal;

    return new Response(JSON.stringify({
      data: normalized,
      meta: {
        page,
        limit,
        filteredTotal,
        overallTotal,
        hasMore
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    // Log full error server-side for debugging
    console.error('API /api/prompts error:', err)
    return new Response(JSON.stringify({ error: err?.message || 'Unknown error' }), { status: 500 });
  }
}
