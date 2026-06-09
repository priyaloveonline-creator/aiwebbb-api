// Supabase proxy — keeps service key server-side
// Frontend sends requests here instead of directly to Supabase
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://aiwebbb.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { action, table, data, filter } = req.body;
  if (!action || !table) return res.status(400).json({ error: 'Missing action or table' });

  // Whitelist tables for security
  const ALLOWED_TABLES = ['users', 'projects', 'deployments'];
  if (!ALLOWED_TABLES.includes(table)) return res.status(403).json({ error: 'Table not allowed' });

  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SB_URL || SB_URL.includes('YOUR_PROJECT')) {
    return res.status(200).json({ data: null, fallback: true });
  }

  const base = `${SB_URL}/rest/v1/${table}`;
  const headers = {
    'Content-Type': 'application/json',
    'apikey': SB_KEY,
    'Authorization': `Bearer ${SB_KEY}`
  };

  try {
    let url = base;
    let method = 'GET';
    let body = undefined;

    if (action === 'get' && filter) {
      const params = Object.entries(filter).map(([k,v]) => `${k}=eq.${encodeURIComponent(v)}`).join('&');
      url = `${base}?${params}&select=*`;
      method = 'GET';
    } else if (action === 'upsert' && data) {
      method = 'POST';
      headers['Prefer'] = 'resolution=merge-duplicates,return=representation';
      body = JSON.stringify(data);
    } else if (action === 'delete' && filter) {
      const params = Object.entries(filter).map(([k,v]) => `${k}=eq.${encodeURIComponent(v)}`).join('&');
      url = `${base}?${params}`;
      method = 'DELETE';
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const r = await fetch(url, { method, headers, body });
    const result = r.status === 204 ? [] : await r.json();
    return res.status(200).json({ data: result });

  } catch (err) {
    console.error('supabase proxy:', err.message);
    return res.status(500).json({ error: 'Internal error' });
  }
}
