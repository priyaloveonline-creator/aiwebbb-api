import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createServerSupabase } from '@/lib/supabase';

const rp = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  const sb = createRouteHandlerClient({ cookies });
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { tierId } = await req.json();
  const sbAdmin = createServerSupabase();

  // Fetch pricing tier
  const { data: tier } = await sbAdmin
    .from('pricing_tiers')
    .select('*')
    .eq('id', tierId)
    .eq('is_active', true)
    .single();

  if (!tier) return NextResponse.json({ error: 'Invalid plan tier' }, { status: 400 });

  // Create Razorpay order — only INR supported
  const order = await rp.orders.create({
    amount:   tier.price_amount,   // in paise
    currency: 'INR',
    receipt:  `aiwebbb_${session.user.id.slice(0, 8)}_${Date.now()}`,
    notes: {
      userId:  session.user.id,
      plan:    tier.plan,
      credits: tier.credits.toString(),
      tierId,
    },
  });

  // Save pending order
  await sbAdmin.from('orders').insert({
    user_id:          session.user.id,
    plan:             tier.plan,
    currency:         'inr',
    amount:           tier.price_amount,
    credits:          tier.credits,
    razorpay_order_id: order.id,
    status:           'pending',
  });

  // Fetch user name/email for prefill
  const { data: profile } = await sbAdmin
    .from('profiles')
    .select('full_name, email')
    .eq('id', session.user.id)
    .single();

  return NextResponse.json({
    orderId:   order.id,
    amount:    tier.price_amount,
    currency:  'INR',
    keyId:     process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    userName:  profile?.full_name ?? '',
    userEmail: profile?.email ?? session.user.email ?? '',
    plan:      tier.plan,
    credits:   tier.credits,
  });
}
