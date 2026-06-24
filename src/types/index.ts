// ── Plans ─────────────────────────────────────────────────────
export type Plan = 'free' | 'pro' | 'plus';

// ── Providers (display grouping — all go via OpenRouter) ──────
export type Provider = 'chatgpt' | 'claude' | 'gemini' | 'deepseek' | 'grok' | 'openrouter';

// ── Model config (matches Supabase model_configs table) ───────
export interface ModelConfig {
  id:                      string;
  openrouter_model_id:     string;   // exact string sent to OpenRouter API
  provider:                Provider;
  display_name:            string;
  description:             string;
  input_cost_per_1m_usd:   number;
  output_cost_per_1m_usd:  number;
  credit_multiplier:       number;
  required_plan:           Plan;
  capabilities:            string[];
  is_active:               boolean;
  sort_order:              number;
}

// ── Credit calculation result ─────────────────────────────────
export interface CreditCalcResult {
  inputCredits:  number;
  outputCredits: number;
  totalCredits:  number;
  costUsd:       number;
}

// ── User profile ──────────────────────────────────────────────
export interface UserProfile {
  id:                      string;
  email:                   string;
  full_name?:              string;
  avatar_url?:             string;
  plan:                    Plan;
  pro_credits_balance:     number;
  plus_credits_balance:    number;
  credits_used_this_month: number;
  credits_reset_at:        string;
  razorpay_customer_id?:   string;
  created_at:              string;
  updated_at:              string;
}

// ── Conversation ──────────────────────────────────────────────
export interface Conversation {
  id:              string;
  user_id:         string;
  title:           string;
  provider:        Provider;
  model_id:        string;
  is_pinned:       boolean;
  is_archived:     boolean;
  message_count:   number;
  last_message_at?: string;
  created_at:      string;
  updated_at:      string;
}

// ── Message ───────────────────────────────────────────────────
export interface Message {
  id:               string;
  conversation_id:  string;
  user_id:          string;
  role:             'user' | 'assistant' | 'system';
  content:          string;
  model_id?:        string;
  input_tokens?:    number;
  output_tokens?:   number;
  credits_used?:    number;
  created_at:       string;
}

// ── Pricing tier (INR only, Razorpay) ────────────────────────
export interface PricingTier {
  id:           string;
  plan:         'pro' | 'plus';
  currency:     'inr';
  price_amount: number;   // paise
  credits:      number;
  is_active:    boolean;
  sort_order:   number;
  label?:       string;   // 'Popular' | 'Best Value' | null
}

// ── Provider UI metadata ──────────────────────────────────────
export interface ProviderMeta {
  id:       Provider;
  name:     string;
  logo:     string;
  color:    string;
  bgLight:  string;
  bgDark:   string;
  plans:    Plan[];
}

// ── Chat API ──────────────────────────────────────────────────
export interface ChatMessage {
  role:    'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequestBody {
  conversationId?: string;
  modelId:         string;
  messages:        ChatMessage[];
  stream?:         boolean;
}

// ── Smart route result ────────────────────────────────────────
export interface SmartRouteResult {
  modelId:    string;
  provider:   Provider;
  reason:     string;
  confidence: number;
}

// ── Compare panel ─────────────────────────────────────────────
export interface ComparePanel {
  modelId:     string;
  provider:    Provider;
  displayName: string;
  content:     string;
  isLoading:   boolean;
  error?:      string;
  timeMs?:     number;
  credits?:    number;
}
