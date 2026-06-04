export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { plan, email, amount, orderId } = req.body;

  const response = await fetch('https://api.cashfree.com/pg/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-version': '2023-08-01',
      'x-client-id': process.env.CF_APP_ID,
      'x-client-secret': process.env.CF_SECRET
    },
    body: JSON.stringify({
      order_id: orderId,
      order_amount: amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: email.replace(/[@.]/g, '_'),
        customer_email: email,
        customer_phone: '9999999999'
      },
      order_meta: {
        return_url: `https://aiwebbb.com?pay=ok&order=${orderId}&plan=${plan}&email=${encodeURIComponent(email)}`
      }
    })
  });

  const data = await response.json();
  if (!data.payment_session_id) {
    return res.status(500).json({ error: 'Cashfree error', detail: data });
  }
  res.status(200).json({ payment_session_id: data.payment_session_id, order_id: orderId });
}
