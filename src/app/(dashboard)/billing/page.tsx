'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Check, Zap, Crown, Gift } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { createBrowserSupabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { formatCredits } from '@/lib/credits';
import toast from 'react-hot-toast';
import type { PricingTier } from '@/types';

declare global { interface Window { Razorpay: any } }

export default function BillingPage() {
  const sp             = useSearchParams();
  const router         = useRouter();
  const { profile, refreshProfile } = useAuth();
  const [tiers, setTiers]     = useState<PricingTier[]>([]);
  const [activePlan, setActivePlan] = useState<'pro' | 'plus'>('pro');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (sp.get('success')) {
      toast.success('🎉 Payment successful! Credits added to your account.');
      refreshProfile();
    }
    if (sp.get('cancel')) toast.error('Payment was cancelled.');

    // Load tiers — INR only
    createBrowserSupabase()
      .from('pricing_tiers')
      .select('*')
      .eq('is_active', true)
      .eq('currency', 'inr')
      .order('plan').order('sort_order')
      .then(({ data }) => { if (data) setTiers(data as PricingTier[]); });
  }, []);

  const filtered = tiers.filter(t => t.plan === activePlan);
  const plan = profile?.plan ?? 'free';
  const credits = plan === 'plus'
    ? profile?.plus_credits_balance ?? 0
    : plan === 'pro'
    ? profile?.pro_credits_balance ?? 0
    : 0;

  async function purchase(tier: PricingTier) {
    if (loading) return;
    setLoading(true);
    setProcessing(tier.id);

    try {
      const res  = await fetch('/api/billing/razorpay/create-order', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ tierId: tier.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create order');

      const options = {
        key:         data.keyId,
        amount:      data.amount,
        currency:    'INR',
        name:        'AIWEBBB',
        description: `${tier.plan.toUpperCase()} Plan — ${formatCredits(tier.credits)} Credits`,
        order_id:    data.orderId,
        image:       '/logo.png',
        prefill: {
          name:  data.userName,
          email: data.userEmail,
        },
        theme:  { color: '#6c47ff' },
        handler: async (response: {
          razorpay_order_id:   string;
          razorpay_payment_id: string;
          razorpay_signature:  string;
        }) => {
          const vres  = await fetch('/api/billing/razorpay/verify', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(response),
          });
          const vdata = await vres.json();
          if (vdata.success) {
            toast.success(`✅ ${formatCredits(tier.credits)} ${tier.plan.toUpperCase()} credits added!`);
            await refreshProfile();
            router.push('/billing?success=1');
          } else {
            toast.error(vdata.error ?? 'Payment verification failed');
          }
          setLoading(false);
          setProcessing(null);
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setProcessing(null);
          },
        },
      };

      const rp = new window.Razorpay(options);
      rp.on('payment.failed', (response: any) => {
        toast.error(`Payment failed: ${response.error.description}`);
        setLoading(false);
        setProcessing(null);
      });
      rp.open();

    } catch (err: any) {
      toast.error(err.message ?? 'Payment failed');
      setLoading(false);
      setProcessing(null);
    }
  }

  const planFeatures: Record<'pro' | 'plus', string[]> = {
    pro: [
      '🤖 ChatGPT — GPT-5.5, o3, GPT-4o, GPT-4.1 & more',
      '🔶 Claude — Opus 4.8, Sonnet 4.6, Haiku 4.5 & more',
      '✦ Gemini — 2.5 Pro, Flash, Flash Lite & more',
      '🐋 DeepSeek — V4, R1 0528 & more',
      '⚡ Grok — 4.20, 4.3, Build 0.1',
      'File uploads & image analysis',
      'Web search in chat',
      'Compare AI side-by-side',
      'Smart model routing',
    ],
    plus: [
      '✅ Everything in Pro',
      '⚙ WEBBB Hub — 30+ additional models',
      'Llama, Mixtral, Qwen, Phi-4 & more',
      'DALL-E 3, FLUX Pro image generation',
      'Perplexity Sonar Pro search',
      'Experimental & newly released models',
      'Automation & agent models',
      'Highest priority support',
    ],
  };

  return (
    <>
      {/* Razorpay checkout script */}
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />

      <div className="h-full overflow-y-auto p-5 md:p-8">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-[18px] font-semibold text-main mb-1">Billing & Plans</h1>
            <p className="text-[12px] text-sub">
              Current plan: <span className="font-semibold text-main capitalize">{plan}</span>
              {plan !== 'free' && (
                <> · Credits remaining:{' '}
                  <span className="font-semibold text-brand-500">{formatCredits(credits)}</span>
                </>
              )}
            </p>
          </div>

          {/* Free plan notice */}
          {plan === 'free' && (
            <div className="flex items-center gap-3 bg-brand-500/5 border border-brand-400/30 rounded-xl p-4 mb-6">
              <Gift size={20} className="text-brand-500 flex-shrink-0" />
              <div>
                <div className="text-[13px] font-medium text-main">You're on the Free Plan</div>
                <div className="text-[12px] text-sub">8 powerful AI models forever — no credit card needed</div>
              </div>
            </div>
          )}

          {/* Plan toggle */}
          <div className="flex gap-2 mb-5">
            <button onClick={() => setActivePlan('pro')}
              className={cn('flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-medium transition-all border',
                activePlan === 'pro'
                  ? 'bg-brand-500 border-brand-500 text-white shadow-sm'
                  : 'border-base bg-surface2 text-sub hover:text-main')}>
              <Zap size={14} /> Pro Plan
            </button>
            <button onClick={() => setActivePlan('plus')}
              className={cn('flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-medium transition-all border',
                activePlan === 'plus'
                  ? 'bg-brand-500 border-brand-500 text-white shadow-sm'
                  : 'border-base bg-surface2 text-sub hover:text-main')}>
              <Crown size={14} /> Plus Plan
            </button>
          </div>

          {/* Plan info + features */}
          <div className="grid md:grid-cols-2 gap-4 mb-7">
            <div className={cn('border rounded-2xl p-5',
              activePlan === 'plus' ? 'border-brand-400 bg-brand-500/5' : 'border-base bg-surface2')}>
              <div className="flex items-center gap-2 mb-1">
                {activePlan === 'pro' ? <Zap size={16} className="text-brand-500" /> : <Crown size={16} className="text-brand-500" />}
                <span className="text-[15px] font-bold text-main capitalize">{activePlan} Plan</span>
                {activePlan === 'plus' && (
                  <span className="text-[10px] bg-brand-500 text-white px-2 py-0.5 rounded-full font-semibold ml-1">BEST VALUE</span>
                )}
              </div>
              <p className="text-[12px] text-sub mb-4">
                {activePlan === 'pro'
                  ? 'Access all 5 official AI providers via OpenRouter'
                  : 'Everything in Pro + WEBBB Hub with 30+ extra models'}
              </p>
              <ul className="space-y-2">
                {planFeatures[activePlan].map(f => (
                  <li key={f} className="flex items-start gap-2 text-[12px] text-sub">
                    <Check size={12} className="text-green-500 mt-0.5 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-surface2 border border-base rounded-2xl p-5">
              <div className="text-[13px] font-semibold text-main mb-3">How Credits Work</div>
              <div className="space-y-2 text-[12px] text-sub leading-relaxed">
                <p>Every AI request deducts credits based on the model's actual API cost.</p>
                <p>Formula: <code className="bg-surface3 border border-base px-1.5 py-0.5 rounded text-[11px]">credits = tokens × price × margin</code></p>
                <p>AIWEBBB applies a multiplier to cover infrastructure costs. Credits refresh every 30 days.</p>
                <p>If OpenRouter changes pricing, only the database updates — your credits auto-recalculate.</p>
                <div className="mt-3 pt-3 border-t border-base">
                  <div className="text-[11px] font-medium text-main mb-1.5">Payment via</div>
                  <div className="flex items-center gap-2">
                    <div className="bg-[#002970] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg">Razorpay</div>
                    <div className="text-[11px] text-sub">UPI · Cards · NetBanking · Wallets</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Credit tiers grid */}
          <h3 className="text-[13px] font-semibold text-main mb-3">
            Select Credit Pack — <span className="text-brand-500">{activePlan.toUpperCase()}</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((tier) => {
              const priceInr    = `₹${(tier.price_amount / 100).toLocaleString('en-IN')}`;
              const isProcessing = processing === tier.id;
              const isPopular    = (tier as any).label === 'Popular';
              const isBest       = (tier as any).label === 'Best Value';

              return (
                <div key={tier.id}
                  className={cn('border rounded-xl p-4 flex flex-col transition-all relative',
                    isPopular || isBest
                      ? 'border-brand-400 bg-brand-500/5'
                      : 'border-base bg-surface2 hover:border-brand-400/50')}>

                  {(isPopular || isBest) && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-[9px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wide whitespace-nowrap">
                      {(tier as any).label}
                    </div>
                  )}

                  <div className="text-[24px] font-bold text-main mb-0.5">{priceInr}</div>
                  <div className="text-[11px] text-muted mb-3">/ month</div>

                  <div className="flex items-center gap-1.5 mb-4">
                    <span className="text-base">🪙</span>
                    <span className="text-[14px] font-semibold text-main">{formatCredits(tier.credits)}</span>
                    <span className="text-[11px] text-muted capitalize">{activePlan} credits</span>
                  </div>

                  {/* Credit-to-cost hint */}
                  <div className="text-[10px] text-muted mb-4 leading-relaxed">
                    ≈ {Math.floor(tier.credits / 150).toLocaleString()} GPT-4o messages<br />
                    ≈ {Math.floor(tier.credits / 90).toLocaleString()} Gemini Flash messages
                  </div>

                  <button
                    onClick={() => purchase(tier)}
                    disabled={loading}
                    className={cn('w-full mt-auto py-2.5 rounded-xl text-[12px] font-semibold transition-all',
                      isPopular || isBest
                        ? 'bg-brand-500 hover:bg-brand-600 text-white'
                        : 'border border-base hover:bg-surface3 hover:border-brand-400 text-main')}>
                    {isProcessing ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </span>
                    ) : `Pay ${priceInr}`}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Bottom note */}
          <div className="mt-6 bg-surface2 border border-base rounded-xl p-4 text-[12px] text-sub">
            <div className="font-medium text-main mb-1">🔒 Secure Payments via Razorpay</div>
            <p>All payments are processed securely. Supports UPI, credit/debit cards, net banking, and wallets. Credits are added instantly after payment confirmation.</p>
          </div>
        </div>
      </div>
    </>
  );
}
