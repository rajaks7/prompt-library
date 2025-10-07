// api/ingest.js
import { createClient } from '@supabase/supabase-js';

const SUPA_URL = process.env.SUPA_URL;
const SUPA_KEY = process.env.SUPA_SERVICE_ROLE;
const SUPA_BUCKET = process.env.SUPA_BUCKET || 'prompt-assets'; // you set this in Vercel
const INGEST_ENDPOINT = PropertiesService.getScriptProperties().getProperty('INGEST_ENDPOINT');

if (!SUPA_URL || !SUPA_KEY) {
  console.error('Missing SUPA_URL or SUPA_SERVICE_ROLE env vars');
}

const supa = createClient(SUPA_URL, SUPA_KEY, {
  auth: { persistSession: false },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const row = req.body || {};
  try {
    // Basic validation (adjust required fields as needed)
    if (!row.title || !row.prompt_text) {
      return res.status(400).json({ error: 'Missing title or prompt_text' });
    }

    // 1) Resolve or create category -> category_id
    let category_id = null;
    if (row.category_name) {
      const { data: catData, error: catErr } = await supa
        .from('categories')
        .select('id')
        .eq('name', row.category_name)
        .limit(1);

      if (catErr) throw catErr;
      if (catData && catData.length) {
        category_id = catData[0].id;
      } else {
        const { data: newCat, error: newCatErr } = await supa
          .from('categories')
          .insert({ name: row.category_name })
          .select('id')
          .single();
        if (newCatErr) throw newCatErr;
        category_id = newCat.id;
      }
    }

    // 2) Resolve or create author -> author_id (if you have authors table)
    let author_id = null;
    if (row.author_name) {
      const { data: auData, error: auErr } = await supa
        .from('authors')
        .select('id')
        .eq('name', row.author_name)
        .limit(1);
      if (auErr) throw auErr;
      if (auData && auData.length) {
        author_id = auData[0].id;
      } else {
        const { data: newAu, error: newAuErr } = await supa
          .from('authors')
          .insert({ name: row.author_name })
          .select('id')
          .single();
        if (newAuErr) throw newAuErr;
        author_id = newAu.id;
      }
    }

    // 3) Handle image_url -> upload to Supabase Storage under attachments/
    let image_path = null;
    if (row.image_url) {
      // fetch image and upload
      const response = await fetch(row.image_url);
      if (!response.ok) throw new Error('Failed to fetch image URL');

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const extMatch = (row.image_url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/) || [])[1] || 'jpg';
      const filename = `attachments/${Date.now()}_${Math.random().toString(36).slice(2,9)}.${extMatch}`;

      const { error: uploadErr } = await supa.storage.from(SUPA_BUCKET).upload(filename, buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: response.headers.get('content-type') || `image/${extMatch}`,
      });
      if (uploadErr) throw uploadErr;

      // store the storage path (not a public URL for private bucket)
      image_path = filename;
    }

    // 4) Prepare insert payload (adjust fields per your prompts table)
    const insertPayload = {
      title: row.title,
      prompt_text: row.prompt_text,
      tags: Array.isArray(row.tags) ? row.tags : (typeof row.tags === 'string' ? row.tags.split(',').map(s => s.trim()) : row.tags || []),
      category_id: category_id,
      author_id: author_id,
      image_path: image_path,       // store path in storage
      published: !!row.published,
      metadata: row.metadata || null
    };

    // 5) Insert into prompts table
    const { data: inserted, error: insertErr } = await supa.from('prompts').insert(insertPayload).select().single();
    if (insertErr) throw insertErr;

    return res.status(200).json({ status: 'ok', row: inserted });
  } catch (err) {
    console.error('ingest error', err);
    return res.status(500).json({ error: err.message || err });
  }
}

function sendOnFormSubmit(e) {
  // e.namedValues is available for form submissions; fallback to reading last row if not
  const vals = e && e.namedValues ? e.namedValues : null;
  let payload = {};

  if (vals) {
    // adjust these keys to match your Sheet column names (case-sensitive)
    payload.title = (vals['title'] || vals['Title'] || [''])[0];
    payload.prompt_text = (vals['prompt_text'] || vals['Prompt Text'] || [''])[0];
    payload.tags = (vals['tags'] || vals['Tags'] || [''])[0];
    payload.category_name = (vals['category_name'] || vals['Category'] || [''])[0];
    payload.author_name = (vals['author_name'] || vals['Author'] || [''])[0];
    payload.image_url = (vals['image_url'] || vals['Image URL'] || [''])[0] || null;
    payload.published = ((vals['published'] || vals['Published'] || [''])[0] || '').toLowerCase() === 'true';
    payload.metadata = null; // optional - extend if you have metadata columns
  } else {
    // fallback: read last row from the first sheet (if you prefer manual triggers)
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheets()[0];
    const lastRow = sheet.getLastRow();
    const headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
    const data = sheet.getRange(lastRow,1,1,sheet.getLastColumn()).getValues()[0];
    headers.forEach((h, i) => {
      const key = String(h).trim().toLowerCase().replace(/\s+/g,'_');
      payload[key] = data[i];
    });
  }

  // normalize tags into array if comma-separated
  if (payload.tags && typeof payload.tags === 'string') {
    payload.tags = payload.tags.split(',').map(s => s.trim()).filter(Boolean);
  }

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  if (!INGEST_ENDPOINT) {
    throw new Error('INGEST_ENDPOINT not set in Script Properties.');
  }

  const resp = UrlFetchApp.fetch(INGEST_ENDPOINT, options);
  Logger.log('Ingest status: ' + resp.getResponseCode() + ' - ' + resp.getContentText());
}