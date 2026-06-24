import type { ProviderMeta } from '@/types';

export const PROVIDERS: Record<string, ProviderMeta> = {
  chatgpt: {
    id: 'chatgpt', name: 'ChatGPT', logo: '🤖',
    color: '#10a37f', bgLight: '#d1fae5', bgDark: '#064e3b',
    plans: ['pro', 'plus'],
  },
  claude: {
    id: 'claude', name: 'Claude', logo: '🔶',
    color: '#d97706', bgLight: '#fef3c7', bgDark: '#78350f',
    plans: ['pro', 'plus'],
  },
  gemini: {
    id: 'gemini', name: 'Gemini', logo: '✦',
    color: '#1a73e8', bgLight: '#dbeafe', bgDark: '#1e3a5f',
    plans: ['pro', 'plus'],
  },
  deepseek: {
    id: 'deepseek', name: 'DeepSeek', logo: '🐋',
    color: '#2563eb', bgLight: '#dbeafe', bgDark: '#1e3a5f',
    plans: ['pro', 'plus'],
  },
  grok: {
    id: 'grok', name: 'Grok', logo: '⚡',
    color: '#7c3aed', bgLight: '#ede9fe', bgDark: '#3b0764',
    plans: ['pro', 'plus'],
  },
  openrouter: {
    id: 'openrouter', name: 'AIWEBBB Free', logo: '🆓',
    color: '#6c47ff', bgLight: '#f0edff', bgDark: '#2e1065',
    plans: ['free', 'pro', 'plus'],
  },
};

export const PRO_PROVIDERS = ['chatgpt', 'claude', 'gemini', 'deepseek', 'grok'] as const;
export const FREE_PROVIDER  = 'openrouter';

// ── Smart routing — Free plan (free OpenRouter models) ───────
export const FREE_SMART_ROUTES: { keywords: string[]; modelId: string }[] = [
  { keywords: ['image','picture','photo','vision','screenshot','see'], modelId: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free' },
  { keywords: ['audio','sound','music','voice','mp3','listen'],        modelId: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free' },
  { keywords: ['video','mp4','mov','watch','clip','film'],             modelId: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free' },
  { keywords: ['code','debug','function','bug','error','script','javascript','python','typescript'], modelId: 'openai/gpt-oss-120b:free' },
  { keywords: ['math','calculate','equation','solve','proof','algebra'],                            modelId: 'openai/gpt-oss-120b:free' },
  { keywords: ['reason','think','logic','complex','analyze','step by step'],                        modelId: 'nvidia/nemotron-3-super-120b-a12b:free' },
  { keywords: ['write','essay','article','blog','story','long','creative','poem'],                  modelId: 'meta-llama/llama-3.3-70b-instruct:free' },
  { keywords: ['document','pdf','file','analyze','extract','read'],                                 modelId: 'google/gemma-4-26b-a4b-it:free' },
  { keywords: ['research','find','search','latest','news','current'],                               modelId: 'google/gemma-4-31b-it:free' },
];
export const FREE_DEFAULT_MODEL = 'openrouter/owl-alpha';

// ── Smart routing — Pro/Plus plan (via OpenRouter) ───────────
export const PRO_SMART_ROUTES: { keywords: string[]; modelId: string; provider: string }[] = [
  { keywords: ['code','debug','function','bug','typescript','javascript','python'], modelId: 'anthropic/claude-sonnet-4-6',          provider: 'claude' },
  { keywords: ['search','news','latest','today','current','find','research'],      modelId: 'perplexity/sonar-pro',                   provider: 'openrouter' },
  { keywords: ['write','essay','blog','email','story','creative','draft'],         modelId: 'openai/gpt-4.1',                         provider: 'chatgpt' },
  { keywords: ['reason','math','logic','analyze','prove','complex','think'],       modelId: 'openai/o3',                              provider: 'chatgpt' },
  { keywords: ['image','vision','photo','screenshot','picture','see'],             modelId: 'openai/gpt-4o',                          provider: 'chatgpt' },
  { keywords: ['fast','quick','simple','cheap','basic','short'],                   modelId: 'google/gemini-2.5-flash',                provider: 'gemini' },
  { keywords: ['deep','thorough','long','detailed','comprehensive'],               modelId: 'anthropic/claude-opus-4-8',              provider: 'claude' },
];
export const PRO_DEFAULT_MODEL = { modelId: 'openai/gpt-4o', provider: 'chatgpt' };
