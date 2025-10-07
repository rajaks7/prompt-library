// app/api/ingest/route.js
import { createClient } from '@supabase/supabase-js';

const SUPA_URL = process.env.SUPA_URL;
const SUPA_KEY = process.env.SUPA_SERVICE_ROLE;
const SUPA_BUCKET = process.env.SUPA_BUCKET || 'prompt-assets';

if (!SUPA_URL || !SUPA_KEY) {
  console.error('Missing SUPA_URL or SUPA_SERVICE_ROLE env vars');
}

const supa = createClient(SUPA_URL, SUPA_KEY, {
  auth: { persistSession: false },
});

// Helper: attempt to fetch an image URL and return { filename, error }
async function fetchAndUploadImage(imageUrl) {
  try {
    const resp = await fetch(imageUrl);
    if (!resp.ok) throw new Error('Failed to fetch image URL: ' + resp.status);
    const arrayBuffer = await resp.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const extMatch = (imageUrl.match(/\.([a-zA-Z0-9]+)(?:\?|$)/) || [])[1] || 'jpg';
    const filename = `attachments/${Date.now()}_${Math.random().toString(36).slice(2,9)}.${extMatch}`;

    const { error: uploadErr } = await supa.storage.from(SUPA_BUCKET).upload(filename, buffer, {
      cacheControl: '3600',
      upsert: false,
      contentType: resp.headers.get('content-type') || `image/${extMatch}`,
    });

    if (uploadErr) throw uploadErr;
    return { filename };
  } catch (err) {
    return { error: err.message || String(err) };
  }
}

export async function POST(req) {
  try {
    const row = await req.json();

    // basic validation
    if (!row.title || !row.prompt_text) {
      return new Response(JSON.stringify({ error: 'Missing title or prompt_text' }), { status: 400 });
    }

    // --- Resolve FKs without creating new ones (per your requirement) ---
    // If a friendly name is provided, map to ID; if not found, reject.
    let ai_tool_id = null;
    if (row.ai_tool_name) {
      const { data: tools, error: tErr } = await supa.from('ai_tools').select('id,name').ilike('name', row.ai_tool_name.trim()).limit(1);
      if (tErr) throw tErr;
      if (!tools || !tools.length) {
        return new Response(JSON.stringify({ error: `ai_tool_name "${row.ai_tool_name}" not found` }), { status: 400 });
      }
      ai_tool_id = tools[0].id;
    } else if (row.ai_tool_id) {
      ai_tool_id = row.ai_tool_id;
    }

    let category_id = null;
    if (row.category_name) {
      const { data: cats, error: cErr } = await supa.from('categories').select('id,name').ilike('name', row.category_name.trim()).limit(1);
      if (cErr) throw cErr;
      if (!cats || !cats.length) {
        return new Response(JSON.stringify({ error: `category_name "${row.category_name}" not found` }), { status: 400 });
      }
      category_id = cats[0].id;
    } else if (row.category_id) {
      category_id = row.category_id;
    }

    let type_id = null;
    if (row.type_name) {
      const { data: types, error: tpErr } = await supa.from('prompt_types').select('id,name').ilike('name', row.type_name.trim()).limit(1);
      if (tpErr) throw tpErr;
      if (!types || !types.length) {
        return new Response(JSON.stringify({ error: `type_name "${row.type_name}" not found` }), { status: 400 });
      }
      type_id = types[0].id;
    } else if (row.type_id) {
      type_id = row.type_id;
    }

    // Validate output_status if provided
    if (row.output_status) {
      const allowed = ['Successful', 'So-So', 'Failure'];
      if (!allowed.includes(row.output_status)) {
        return new Response(JSON.stringify({ error: `output_status must be one of ${allowed.join(', ')}` }), { status: 400 });
      }
    }

    // --- Handle image (Drive direct-link or full URL) ---
    let attachment_filename = row.attachment_filename || null;
    if (attachment_filename) {
      // If the user pasted only a Drive file ID, convert to uc?download format
      const driveIdMatch = attachment_filename.match(/^[a-zA-Z0-9_-]{10,}$/);
      if (driveIdMatch && !attachment_filename.includes('drive.google.com')) {
        attachment_filename = `https://drive.google.com/uc?export=download&id=${attachment_filename}`;
      }

      // If attachment_filename contains a drive link or any http url, attempt fetch+upload
      if (attachment_filename.startsWith('http')) {
        const { filename, error } = await fetchAndUploadImage(attachment_filename);
        if (error) {
          return new Response(JSON.stringify({ error: `Image upload failed: ${error}` }), { status: 400 });
        }
        // store the storage path (attachments/..)
        attachment_filename = filename;
      }
      // otherwise if it already looks like a storage path (attachments/...), keep as-is
    }

    // prepare payload matching your prompts table
    const insertPayload = {
      title: row.title,
      prompt_text: row.prompt_text,
      tags: row.tags ? (Array.isArray(row.tags) ? row.tags : JSON.parse(JSON.stringify(row.tags))) : null,
      ai_tool_id: ai_tool_id,
      category_id: category_id,
      type_id: type_id,
      ai_tool_model: row.ai_tool_model || null,
      output_text: row.output_text || null,
      output_status: row.output_status || null,
      attachment_filename: attachment_filename || null,
      rating: row.rating || null,
      credits_used: row.credits_used || null,
      usage_count: row.usage_count || null,
      version: row.version || null,
      published: row.published === true || String(row.published).toLowerCase() === 'true'
    };

    const { data: inserted, error: insertErr } = await supa.from('prompts').insert(insertPayload).select().single();
    if (insertErr) throw insertErr;

    return new Response(JSON.stringify({ status: 'ok', row: inserted }), { status: 200 });
  } catch (err) {
    console.error('ingest error', err);
    return new Response(JSON.stringify({ error: err.message || String(err) }), { status: 500 });
  }
}
