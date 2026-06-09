export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://aiwebbb.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { deployId, html, email, brand } = req.body;
  if (!deployId || !html) return res.status(400).json({ error: 'Missing deployId or html' });

  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SB_URL || SB_URL.includes('YOUR_PROJECT')) {
    return res.status(200).json({ url: `https://aiwebbb.com/${deployId}`, deployId });
  }

  try {
    const r = await fetch(`${SB_URL}/rest/v1/deployments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SB_KEY,
        'Authorization': `Bearer ${SB_KEY}`,
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({ id: deployId, html, email: email||'anon', brand: brand||'App', updated_at: new Date().toISOString() })
    });
    if (!r.ok) { const e = await r.text(); console.error('SB save:', e); }
    return res.status(200).json({ url: `https://aiwebbb.com/${deployId}`, deployId });
  } catch (err) {
    console.error('save-deployment:', err.message);
    return res.status(500).json({ error: 'Internal error' });
  }
}
