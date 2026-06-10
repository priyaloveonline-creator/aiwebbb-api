export default async function handler(req, res) {
  // Allow both custom domain and Vercel preview URL
  const origin = req.headers.origin || '';
  const allowed = ['https://aiwebbb.com','https://aiwebbb.vercel.app'];
  if (allowed.includes(origin) || origin.endsWith('.vercel.app')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://aiwebbb.com');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { messages, model } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Missing messages' });
  }

  // Allowed models only — prevents abuse
  const ALLOWED = [
    'anthropic/claude-sonnet-4-5',
    'anthropic/claude-opus-4-5'
  ];
  const safeModel = ALLOWED.includes(model) ? model : ALLOWED[0];

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OR_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://aiwebbb.com',
        'X-Title': 'AIWEBBB'
      },
      body: JSON.stringify({
        model: safeModel,
        max_tokens: 4096,
        messages
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('OpenRouter error:', err);
      return res.status(response.status).json({ error: 'AI service error' });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (err) {
    console.error('ai proxy error:', err.message);
    return res.status(500).json({ error: 'Internal error' });
  }
}
