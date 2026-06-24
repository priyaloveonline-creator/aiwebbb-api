import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createServerSupabase } from '@/lib/supabase';
import { calculateCredits, creditBucket } from '@/lib/credits';
import { v4 as uuid } from 'uuid';
import type { ModelConfig, ChatMessage } from '@/types';

export const runtime = 'edge';
export const maxDuration = 60;

// ── Single OpenRouter client — powers ALL models ──────────────
function getOpenRouterClient() {
  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY!,
    defaultHeaders: {
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'https://aiwebbb-api.vercel.app',
      'X-Title': 'AIWEBBB',
    },
  });
}

export async function POST(req: NextRequest) {
  const sb      = createRouteHandlerClient({ cookies });
  const sbAdmin = createServerSupabase();

  const { data: { session } } = await sb.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body: {
    conversationId?: string;
    modelId: string;
    messages: ChatMessage[];
    stream?: boolean;
  } = await req.json();

  const { conversationId, modelId, messages, stream = true } = body;

  // ── Fetch model config from DB ────────────────────────────
  const { data: modelRow } = await sbAdmin
    .from('model_configs')
    .select('*')
    .eq('id', modelId)
    .eq('is_active', true)
    .single();

  if (!modelRow) {
    return NextResponse.json({ error: 'Model not found or inactive' }, { status: 400 });
  }
  const mc = modelRow as ModelConfig & { openrouter_model_id: string };

  // ── Fetch user profile ────────────────────────────────────
  const { data: profile } = await sbAdmin
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  // ── Plan check ────────────────────────────────────────────
  const planRank: Record<string, number> = { free: 0, pro: 1, plus: 2 };
  if (planRank[profile.plan] < planRank[mc.required_plan]) {
    return NextResponse.json(
      { error: `This model requires ${mc.required_plan} plan. Please upgrade.` },
      { status: 403 }
    );
  }

  // ── Credit check for paid plans ───────────────────────────
  const bucket = creditBucket(profile.plan);
  if (bucket) {
    const balance = profile[bucket] as number;
    if (balance < 10) {
      return NextResponse.json(
        { error: 'Insufficient credits. Please top up on the Billing page.' },
        { status: 402 }
      );
    }
  }

  // ── Create or reuse conversation ─────────────────────────
  let convId = conversationId;
  if (!convId) {
    const title = messages[messages.length - 1]?.content.slice(0, 60) ?? 'New Chat';
    const { data: conv } = await sbAdmin
      .from('conversations')
      .insert({ user_id: session.user.id, title, provider: mc.provider, model_id: mc.id })
      .select('id')
      .single();
    convId = conv?.id;
  }

  // ── Save user message ─────────────────────────────────────
  await sbAdmin.from('messages').insert({
    conversation_id: convId,
    user_id: session.user.id,
    role: 'user',
    content: messages[messages.length - 1].content,
    model_id: mc.id,
  });

  // ── Stream from OpenRouter ────────────────────────────────
  const enc = new TextEncoder();

  const readable = new ReadableStream({
    async start(ctrl) {
      const emit = (data: object) =>
        ctrl.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`));

      emit({ type: 'conversation_id', id: convId });

      let fullContent = '';
      let inputTokens  = 0;
      let outputTokens = 0;

      try {
        const client = getOpenRouterClient();

        // Use the openrouter_model_id from DB — this is the exact model string
        const completion = await client.chat.completions.create({
          model: mc.openrouter_model_id,
          stream: true,
          messages: messages.map(m => ({
            role:    m.role as 'user' | 'assistant' | 'system',
            content: m.content,
          })),
        });

        for await (const chunk of completion) {
          const delta = chunk.choices[0]?.delta?.content ?? '';
          if (delta) {
            fullContent += delta;
            emit({ type: 'chunk', content: delta });
          }
          if (chunk.usage) {
            inputTokens  = chunk.usage.prompt_tokens     ?? 0;
            outputTokens = chunk.usage.completion_tokens ?? 0;
          }
        }

        // ── Calculate credits dynamically from DB pricing ──
        const calc = calculateCredits(mc, inputTokens, outputTokens);
        const msgId = uuid();

        // ── Persist AI message ────────────────────────────
        await sbAdmin.from('messages').insert({
          id:              msgId,
          conversation_id: convId,
          user_id:         session.user.id,
          role:            'assistant',
          content:         fullContent,
          model_id:        mc.id,
          input_tokens:    inputTokens,
          output_tokens:   outputTokens,
          credits_used:    calc.totalCredits,
        });

        // ── Deduct credits for Pro/Plus ───────────────────
        if (bucket && calc.totalCredits > 0) {
          const currentBalance = profile[bucket as keyof typeof profile] as number;
          await sbAdmin.from('profiles').update({
            [bucket]:               Math.max(0, currentBalance - calc.totalCredits),
            credits_used_this_month: (profile.credits_used_this_month as number) + calc.totalCredits,
            updated_at:             new Date().toISOString(),
          }).eq('id', session.user.id);
        }

        // ── Log usage ─────────────────────────────────────
        await sbAdmin.from('usage_logs').insert({
          user_id:         session.user.id,
          conversation_id: convId,
          model_id:        mc.id,
          provider:        mc.provider,
          input_tokens:    inputTokens,
          output_tokens:   outputTokens,
          credits_used:    calc.totalCredits,
          cost_usd:        calc.costUsd,
        });

        emit({
          type:         'done',
          messageId:    msgId,
          inputTokens,
          outputTokens,
          creditsUsed:  calc.totalCredits,
          costUsd:      calc.costUsd,
        });

      } catch (err: any) {
        console.error('OpenRouter error:', err);
        emit({ type: 'error', message: err.message ?? 'AI request failed' });
      } finally {
        ctrl.enqueue(enc.encode('data: [DONE]\n\n'));
        ctrl.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    },
  });
}
