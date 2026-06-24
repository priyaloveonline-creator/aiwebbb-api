import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: 'Missing payment fields' }, { status: 400 });
  }

  // ── Verify Razorpay signature ─────────────────────────────
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expected !== razorpay_signature) {
    return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
  }

  const sbAdmin = createServerSupabase();

  // ── Fetch pending order ───────────────────────────────────
  const { data: order } = await sbAdmin
    .from('orders')
    .select('*')
    .eq('razorpay_order_id', razorpay_order_id)
    .eq('status', 'pending')
    .single();

  if (!order) {
    return NextResponse.json({ error: 'Order not found or already processed' }, { status: 404 });
  }

  // ── Apply credits to user profile ────────────────────────
  const { error: rpcError } = await sbAdmin.rpc('apply_credits', {
    p_user_id: order.user_id,
    p_plan:    order.plan,
    p_credits: order.credits,
  });

  if (rpcError) {
    console.error('apply_credits error:', rpcError);
    return NextResponse.json({ error: 'Failed to apply credits' }, { status: 500 });
  }

  // ── Mark order as paid ────────────────────────────────────
  await sbAdmin.from('orders').update({
    status:             'paid',
    razorpay_payment_id,
    updated_at:         new Date().toISOString(),
  }).eq('id', order.id);

  return NextResponse.json({
    success: true,
    plan:    order.plan,
    credits: order.credits,
  });
}
