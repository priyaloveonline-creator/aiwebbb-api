export default async function handler(req, res) {
  const { slug } = req.query;
  if (!slug || slug.length < 8) return res.status(404).send(notFoundPage(''));

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPABASE_URL || SUPABASE_URL.includes('YOUR_PROJECT')) {
    return res.status(200).send(placeholderPage(slug));
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/deployments?id=eq.${encodeURIComponent(slug)}&select=html,brand`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      }
    );
    const data = await response.json();
    if (!data || data.length === 0) return res.status(404).send(notFoundPage(slug));
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    return res.status(200).send(data[0].html);
  } catch (err) {
    return res.status(500).send(notFoundPage(slug));
  }
}

function notFoundPage(slug) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Not Found · AIWEBBB</title>
<style>body{font-family:monospace;background:#080808;color:#f0f0f0;display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:16px;}
h1{font-size:48px;color:#00ff88;}p{color:#555;font-size:14px;}a{color:#00ff88;text-decoration:none;}</style>
</head><body><h1>404</h1><p>No project found${slug?' at /'+slug:''}.</p>
<a href="https://aiwebbb.com">← Build your own at AIWEBBB.com</a></body></html>`;
}

function placeholderPage(slug) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>AIWEBBB · ${slug}</title>
<style>body{font-family:monospace;background:#080808;color:#f0f0f0;display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:16px;text-align:center;}
h1{font-size:28px;color:#00ff88;}.url{background:#111;border:1px solid #222;border-radius:8px;padding:12px 24px;font-size:13px;color:#00ff88;}
p{color:#555;font-size:13px;line-height:1.8;}a{color:#00ff88;}</style>
</head><body><h1>🚀 Project Live!</h1><div class="url">aiwebbb.com/${slug}</div>
<p>Connect Supabase to serve full projects.</p><a href="https://aiwebbb.com">← Back to AIWEBBB</a></body></html>`;
}
