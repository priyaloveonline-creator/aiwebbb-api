export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { type, data } = req.body;
  const orderId = data?.order?.order_id || '';
  if (type === 'PAYMENT_SUCCESS') {
    console.log('Payment success:', orderId);
  }
  if (type === 'PAYMENT_FAILED') {
    console.log('Payment failed:', orderId);
  }
  return res.status(200).json({ received: true });
}
