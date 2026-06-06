export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { deployId, projectId, email, html, brand } = req.body;
  if (!deployId || !html) return res.status(400).json({ error: 'Missing deployId or html' });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPABASE_URL || SUPABASE_URL.includes('YOUR_PROJECT')) {
    return res.status(200).json({ url: `https://aiwebbb.com/${deployId}`, deployId });
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/deployments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        id: deployId,
        project_id: projectId || null,
        email: email || null,
        html,
        brand: brand || 'My App',
        updated_at: new Date().toISOString()
      })
    });

    if (!response.ok) return res.status(500).json({ error: 'Failed to save' });
    return res.status(200).json({ url: `https://aiwebbb.com/${deployId}`, deployId });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
