export default async function handler(req, res) {
  const { slug } = req.query;
  if (!slug || slug.length < 8) return res.status(404).send(notFound(''));

  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SB_URL || SB_URL.includes('YOUR_PROJECT')) {
    return res.status(200).send(placeholder(slug));
  }

  try {
    const r = await fetch(`${SB_URL}/rest/v1/deployments?id=eq.${encodeURIComponent(slug)}&select=html,brand`, {
      headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` }
    });
    const data = await r.json();
    if (!data || !data.length) return res.status(404).send(notFound(slug));
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    return res.status(200).send(data[0].html);
  } catch (err) {
    return res.status(500).send(notFound(slug));
  }
}

function notFound(slug) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Not Found · AIWEBBB</title>
<style>body{font-family:system-ui,sans-serif;background:#000;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:14px;text-align:center;}
h1{font-size:48px;font-weight:800;}p{color:#555;font-size:14px;}a{color:#fff;text-decoration:underline;}</style>
</head><body><h1>404</h1><p>No project found${slug?' at /'+slug:''}.</p><a href="https://aiwebbb.com">← Build your own at AIWEBBB.com</a></body></html>`;
}

function placeholder(slug) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>AIWEBBB · ${slug}</title>
<style>body{font-family:system-ui,sans-serif;background:#000;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:14px;text-align:center;}
h1{font-size:24px;font-weight:700;}code{background:#111;padding:8px 16px;border-radius:6px;font-size:13px;color:#fff;}a{color:#fff;}</style>
</head><body><h1>🚀 Project Live!</h1><code>aiwebbb.com/${slug}</code><p style="color:#555;font-size:12px;">Connect Supabase to serve full projects.</p><a href="https://aiwebbb.com">← Back to AIWEBBB</a></body></html>`;
}
