import type { ModelConfig } from '@/types';

/**
 * AIWEBBB Dynamic Credit System
 * ─────────────────────────────
 * All models go through OpenRouter. Actual API cost is stored in the DB.
 *
 * Formula:
 *   1 credit = $0.0001 USD
 *   inputCredits  = ceil( (inputTokens  / 1_000_000) * input_cost_per_1m_usd  * multiplier * 10_000 )
 *   outputCredits = ceil( (outputTokens / 1_000_000) * output_cost_per_1m_usd * multiplier * 10_000 )
 *
 * Default multiplier = 5.0
 *   → AIWEBBB charges 5× the actual API cost
 *   → API cost = 20% of revenue → platform profit = 80%
 *
 * Free models: input_cost = 0, output_cost = 0 → always 0 credits
 * Updating a model's cost in Supabase auto-recalculates everything.
 */

export interface CreditCalcResult {
  inputCredits:  number;
  outputCredits: number;
  totalCredits:  number;
  costUsd:       number; // raw API cost before multiplier
}

export function calculateCredits(
  model: Pick<ModelConfig, 'input_cost_per_1m_usd' | 'output_cost_per_1m_usd' | 'credit_multiplier'>,
  inputTokens:  number,
  outputTokens: number,
): CreditCalcResult {
  const M                = 1_000_000;
  const CREDITS_PER_USD  = 10_000;     // 1 USD = 10,000 credits
  const multiplier       = model.credit_multiplier ?? 5;

  const inputCostUsd  = (inputTokens  / M) * (model.input_cost_per_1m_usd  ?? 0);
  const outputCostUsd = (outputTokens / M) * (model.output_cost_per_1m_usd ?? 0);
  const costUsd       = inputCostUsd + outputCostUsd;

  const inputCredits  = Math.ceil(inputCostUsd  * multiplier * CREDITS_PER_USD);
  const outputCredits = Math.ceil(outputCostUsd * multiplier * CREDITS_PER_USD);
  const totalCredits  = inputCredits + outputCredits;

  return { inputCredits, outputCredits, totalCredits, costUsd };
}

/** Format large credit numbers for display */
export function formatCredits(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

/** Format INR amount from paise */
export function formatINR(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

/**
 * Which column to deduct credits from based on plan.
 * Free plan = null (no deduction — free models cost nothing)
 */
export function creditBucket(plan: string): 'pro_credits_balance' | 'plus_credits_balance' | null {
  if (plan === 'pro')  return 'pro_credits_balance';
  if (plan === 'plus') return 'plus_credits_balance';
  return null;
}
