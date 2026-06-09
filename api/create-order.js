export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://aiwebbb.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { plan, email, yearly } = req.body;
  if (!plan || !email) return res.status(400).json({ error: 'Missing plan or email' });

  const amounts = { standard: yearly?69900:99900, pro: yearly?174900:249900, credits: 9900 };
  const amount = amounts[plan];
  if (!amount) return res.status(400).json({ error: 'Invalid plan' });

  const key_id = process.env.RZP_KEY_ID;
  const key_secret = process.env.RZP_KEY_SECRET;
  const auth = Buffer.from(`${key_id}:${key_secret}`).toString('base64');

  try {
    const r = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, currency: 'INR', receipt: `awbb_${Date.now()}`, notes: { plan, email } })
    });
    const data = await r.json();
    if (!data.id) { console.error('Razorpay:', JSON.stringify(data)); return res.status(500).json({ error: 'Order failed' }); }
    return res.status(200).json({ order_id: data.id, amount: data.amount, currency: data.currency, key_id });
  } catch (err) {
    console.error('create-order:', err.message);
    return res.status(500).json({ error: 'Internal error' });
  }
}
