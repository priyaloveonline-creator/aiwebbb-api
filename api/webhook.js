// Razorpay webhook — verifies payments server-side
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const secret = process.env.RZP_WEBHOOK_SECRET;
  const signature = req.headers['x-razorpay-signature'];

  if (secret && signature) {
    const body = JSON.stringify(req.body);
    const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
    if (signature !== expected) {
      console.error('Webhook signature mismatch');
      return res.status(401).json({ error: 'Invalid signature' });
    }
  }

  const { event, payload } = req.body;
  const payment = payload?.payment?.entity;

  if (event === 'payment.captured') {
    const email = payment?.email || payment?.notes?.email;
    const plan  = payment?.notes?.plan || 'standard';
    console.log('Payment captured:', payment?.id, email, plan);

    // Update user plan in Supabase
    const SB_URL = process.env.SUPABASE_URL;
    const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
    if (SB_URL && email && !SB_URL.includes('YOUR_PROJECT')) {
      try {
        const existing = await fetch(`${SB_URL}/rest/v1/users?email=eq.${encodeURIComponent(email)}&select=*`, {
          headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` }
        }).then(r => r.json());

        const cur = existing?.[0] || { plan: 'free', credits: 0 };
        const newPlan    = plan === 'credits' ? cur.plan : plan;
        const newCredits = (cur.credits || 0) + (plan === 'credits' ? 100 : 0);

        await fetch(`${SB_URL}/rest/v1/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SB_KEY,
            'Authorization': `Bearer ${SB_KEY}`,
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify({ email, plan: newPlan, credits: newCredits, last_payment: payment?.id, updated: Date.now() })
        });
        console.log('User updated:', email, newPlan, newCredits);
      } catch (e) {
        console.error('Webhook DB update failed:', e.message);
      }
    }
  }

  return res.status(200).json({ received: true });
}
