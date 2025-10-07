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

    // build query
    let query = supabase.from('prompts').select('*', { count: 'exact' }).range(offset, offset + limit - 1);

    // simple search by title (optional)
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    // sorting
    const [sortField, sortDir] = sort.split('.');
    if (sortField) query = query.order(sortField, { ascending: sortDir !== 'desc' });

    const { data, error, count } = await query;

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({
      data,
      meta: {
        page,
        limit,
        total: count ?? (data ? data.length : 0)
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
