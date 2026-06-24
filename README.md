# AIWEBBB v2 — Setup Guide

> One Platform. All Top AIs.
> ChatGPT · Claude · Gemini · Grok · DeepSeek · 100+ Models via OpenRouter

---

## Architecture

| What            | How                                      |
|-----------------|------------------------------------------|
| All AI models   | **Single OpenRouter API key**            |
| Payments        | **Razorpay only** (INR)                  |
| Auth + DB       | Supabase                                 |
| Frontend        | Next.js 14 + Tailwind                    |
| State           | Zustand                                  |
| Deployment      | Vercel                                   |

---

## Environment Variables (Vercel + .env.local)

Only **3 services** need keys:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
SUPABASE_SERVICE_ROLE_KEY=eyJh...

# OpenRouter — ALL models go through this ONE key
OPENROUTER_API_KEY=sk-or-...

# Razorpay — only payment gateway
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_...

# App URL
NEXT_PUBLIC_APP_URL=https://aiwebbb-api.vercel.app
```

No separate OpenAI, Anthropic, Google, xAI, or DeepSeek keys needed.
OpenRouter handles routing to all of them.

---

## Supabase Setup

1. Open your **aiwebbb** project at supabase.com
2. SQL Editor → New Query → paste `001_schema.sql` → Run
3. Authentication → Providers → enable Email, Google, GitHub
4. Authentication → URL Config:
   - Site URL: `https://aiwebbb-api.vercel.app`
   - Redirect URLs: `https://aiwebbb-api.vercel.app/**`

---

## OpenRouter Setup

1. Go to openrouter.ai → sign in
2. Keys → Create Key → copy key
3. Add credits to your OpenRouter account (they charge you actual API cost)
4. Paste key as `OPENROUTER_API_KEY` in Vercel

**All 48+ models are powered by this one key:**
- Free plan: 8 free OpenRouter models (zero cost)
- Pro plan: ChatGPT, Claude, Gemini, Grok, DeepSeek
- Plus plan: Everything + 30 more models (WEBBB Hub)

---

## Razorpay Setup

Your account: razorpay.me/@aiwebbb (MID: SydFES3ZM1nAXn)

1. dashboard.razorpay.com → Settings → API Keys
2. Switch to **Live Mode** → Generate Live Keys
3. Copy Key ID and Key Secret
4. Settings → Webhooks → Add webhook:
   - URL: `https://aiwebbb-api.vercel.app/api/billing/razorpay/verify`
   - Events: `payment.captured`

Test card: `4111 1111 1111 1111` (any future expiry, any CVV)

---

## GitHub → Vercel Deploy

```bash
# Push to your existing repo
git add .
git commit -m "AIWEBBB v2 — OpenRouter + Razorpay"
git push origin main
```

Vercel auto-deploys on every push.

---

## File → GitHub Path Mapping

| Downloaded file                  | GitHub path                                                  |
|----------------------------------|--------------------------------------------------------------|
| `001_schema.sql`                 | Run in Supabase SQL Editor — do NOT commit                   |
| `package.json`                   | `package.json`                                               |
| `tailwind.config.js`             | `tailwind.config.js`                                         |
| `tsconfig.json`                  | `tsconfig.json`                                              |
| `postcss.config.js`              | `postcss.config.js`                                          |
| `next.config.js`                 | `next.config.js`                                             |
| `eslintrc.json`                  | `.eslintrc.json`                                             |
| `gitignore.txt`                  | `.gitignore`                                                 |
| `env.local.example`              | `.env.local.example`                                         |
| `globals.css`                    | `src/app/globals.css`                                        |
| `app_layout.tsx`                 | `src/app/layout.tsx`                                         |
| `app_page.tsx`                   | `src/app/page.tsx`                                           |
| `auth_page.tsx`                  | `src/app/auth/page.tsx`                                      |
| `auth_callback_route.ts`         | `src/app/auth/callback/route.ts`                             |
| `dashboard_layout.tsx`           | `src/app/(dashboard)/layout.tsx`                             |
| `dashboard_page.tsx`             | `src/app/(dashboard)/page.tsx`                               |
| `chat_page.tsx`                  | `src/app/(dashboard)/chat/page.tsx`                          |
| `chat_id_page.tsx`               | `src/app/(dashboard)/chat/[id]/page.tsx`                     |
| `compare_page.tsx`               | `src/app/(dashboard)/compare/page.tsx`                       |
| `webbb_page.tsx`                 | `src/app/(dashboard)/webbb/page.tsx`                         |
| `billing_page.tsx`               | `src/app/(dashboard)/billing/page.tsx`                       |
| `history_page.tsx`               | `src/app/(dashboard)/history/page.tsx`                       |
| `usage_page.tsx`                 | `src/app/(dashboard)/usage/page.tsx`                         |
| `settings_page.tsx`              | `src/app/(dashboard)/settings/page.tsx`                      |
| `api_chat_route.ts`              | `src/app/api/chat/route.ts`                                  |
| `api_smart_route.ts`             | `src/app/api/smart-route/route.ts`                           |
| `api_razorpay_create_order.ts`   | `src/app/api/billing/razorpay/create-order/route.ts`         |
| `api_razorpay_verify.ts`         | `src/app/api/billing/razorpay/verify/route.ts`               |
| `Sidebar.tsx`                    | `src/components/layout/Sidebar.tsx`                          |
| `Topbar.tsx`                     | `src/components/layout/Topbar.tsx`                           |
| `MobileNav.tsx`                  | `src/components/layout/MobileNav.tsx`                        |
| `ModelSwitcher.tsx`              | `src/components/dashboard/ModelSwitcher.tsx`                 |
| `dashboard_components.tsx`       | `src/components/dashboard/index.tsx`                         |
| `AuthProvider.tsx`               | `src/components/providers/AuthProvider.tsx`                  |
| `ThemeBootstrap.tsx`             | `src/components/providers/ThemeBootstrap.tsx`                |
| `lib_supabase.ts`                | `src/lib/supabase.ts`                                        |
| `lib_store.ts`                   | `src/lib/store.ts`                                           |
| `lib_credits.ts`                 | `src/lib/credits.ts`                                         |
| `lib_providers.ts`               | `src/lib/providers.ts`                                       |
| `lib_utils.ts`                   | `src/lib/utils.ts`                                           |
| `types_index.ts`                 | `src/types/index.ts`                                         |
| `manifest.json`                  | `public/manifest.json`                                       |

---

## Adding New Models Later

Just run this SQL in Supabase — no code changes needed:

```sql
insert into public.model_configs
  (id, openrouter_model_id, provider, display_name, description,
   input_cost_per_1m_usd, output_cost_per_1m_usd, credit_multiplier,
   required_plan, capabilities)
values
  ('my-new-model', 'provider/model-name-on-openrouter',
   'openrouter', 'My New Model', 'Description',
   1.00, 3.00, 5, 'plus', '{text,code}');
```

Check model IDs at: openrouter.ai/models

---

## Credits Pricing Logic

| Model tier  | Cost to AIWEBBB | You charge user | Margin |
|-------------|-----------------|-----------------|--------|
| Free models | $0              | 0 credits        | 100%  |
| Cheap models (GPT-4o mini) | ~$0.001/msg | ~5 credits | 80% |
| Mid models (GPT-4o) | ~$0.01/msg | ~50 credits | 80% |
| Premium (Opus, o3) | ~$0.10/msg | ~500 credits | 80% |

Multiplier = 5 ensures platform stays profitable at all times.
