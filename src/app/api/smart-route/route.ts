import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { FREE_SMART_ROUTES, FREE_DEFAULT_MODEL, PRO_SMART_ROUTES, PRO_DEFAULT_MODEL } from '@/lib/providers';

export async function POST(req: NextRequest) {
  const sb = createRouteHandlerClient({ cookies });
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { prompt, plan } = await req.json();
  if (!prompt) return NextResponse.json({ error: 'prompt is required' }, { status: 400 });

  const lower = prompt.toLowerCase();

  if (!plan || plan === 'free') {
    let best      = null;
    let bestScore = 0;
    for (const rule of FREE_SMART_ROUTES) {
      const score = rule.keywords.filter(k => lower.includes(k)).length;
      if (score > bestScore) { bestScore = score; best = rule; }
    }
    return NextResponse.json({
      modelId:    best?.modelId ?? FREE_DEFAULT_MODEL,
      provider:   'openrouter',
      reason:     best
        ? `Detected "${best.keywords[0]}" — routing to best free model`
        : 'General chat — using Owl Alpha',
      confidence: best ? Math.min(95, bestScore * 30) : 60,
    });
  }

  // Pro / Plus
  let best      = null;
  let bestScore = 0;
  for (const rule of PRO_SMART_ROUTES) {
    const score = rule.keywords.filter(k => lower.includes(k)).length;
    if (score > bestScore) { bestScore = score; best = rule; }
  }
  return NextResponse.json({
    modelId:    best?.modelId   ?? PRO_DEFAULT_MODEL.modelId,
    provider:   best?.provider  ?? PRO_DEFAULT_MODEL.provider,
    reason:     best
      ? `Detected "${best.keywords[0]}" — routing to best model for this task`
      : 'General task — using GPT-4o',
    confidence: best ? Math.min(95, bestScore * 30) : 65,
  });
}
