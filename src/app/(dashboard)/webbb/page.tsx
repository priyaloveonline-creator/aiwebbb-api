'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Star, Lock } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useAuth } from '@/components/providers/AuthProvider';
import { PROVIDERS } from '@/lib/providers';
import { cn } from '@/lib/utils';
import type { ModelConfig } from '@/types';

const CATS = ['All','Coding','Writing','Reasoning','Research','Image','Audio','Video','Agents'];

export default function WebbHubPage() {
  const router = useRouter();
  const { modelCache } = useStore();
  const { profile } = useAuth();
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('All');
  const [favs, setFavs] = useState<string[]>([]);

  const plan = profile?.plan ?? 'free';

  const allModels = Object.values(modelCache)
    .filter(m => m.is_active)
    .sort((a, b) => {
      // Free models first if user is free, else sort by provider + sort_order
      if (a.required_plan === 'free' && b.required_plan !== 'free') return -1;
      if (a.required_plan !== 'free' && b.required_plan === 'free') return 1;
      return a.provider.localeCompare(b.provider) || a.sort_order - b.sort_order;
    });

  const filtered = allModels.filter(m => {
    const matchSearch = m.display_name.toLowerCase().includes(search.toLowerCase()) || m.provider.toLowerCase().includes(search.toLowerCase()) || m.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = cat === 'All' || m.capabilities.some(c => c.toLowerCase().includes(cat.toLowerCase()));
    return matchSearch && matchCat;
  });

  function canAccess(m: ModelConfig): boolean {
    const rank: Record<string,number> = { free:0, pro:1, plus:2 };
    return rank[plan] >= rank[m.required_plan];
  }

  function launch(m: ModelConfig) {
    if (!canAccess(m)) { router.push('/billing'); return; }
    router.push(`/chat?provider=${m.provider}&model=${m.id}`);
  }

  function toggleFav(id: string) {
    setFavs(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  }

  const planColors: Record<string,string> = { free:'text-green-500', pro:'text-brand-500', plus:'text-amber-500' };

  return (
    <div className="h-full overflow-y-auto p-5">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-[16px] font-semibold text-main mb-0.5">WEBBB Hub</h1>
            <p className="text-[12px] text-sub">{allModels.length} AI models — free, pro & plus</p>
          </div>
          {plan === 'free' && (
            <button onClick={() => router.push('/billing')}
              className="flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl px-4 py-2 text-[12px] font-medium transition-colors">
              ⚡ Upgrade for more models
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, provider or capability..."
            className="w-full bg-surface2 border border-base focus:border-brand-400 rounded-xl pl-9 pr-4 py-2.5 text-[13px] text-main placeholder:text-muted outline-none transition-colors" />
        </div>

        {/* Category filters */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {CATS.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] whitespace-nowrap transition-colors border',
                cat === c ? 'bg-brand-500 border-brand-500 text-white' : 'border-base bg-surface2 text-sub hover:text-main hover:border-brand-400')}>
              {c}
            </button>
          ))}
        </div>

        {/* Plan groups */}
        {['free', 'pro', 'plus'].map(planTier => {
          const tierModels = filtered.filter(m => m.required_plan === planTier);
          if (!tierModels.length) return null;
          const tierLabels: Record<string,string> = { free:'🆓 Free Models', pro:'🚀 Pro Models', plus:'💎 Plus Models' };
          return (
            <div key={planTier} className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-[13px] font-semibold text-main">{tierLabels[planTier]}</h3>
                <span className={cn('text-[10px] font-semibold', planColors[planTier])}>
                  {tierModels.length} models
                </span>
                {planTier !== 'free' && plan === 'free' && (
                  <span className="text-[10px] bg-amber-100 dark:bg-amber-900/20 text-amber-600 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                    Upgrade required
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {tierModels.map(m => {
                  const accessible = canAccess(m);
                  const prov = PROVIDERS[m.provider];
                  return (
                    <div key={m.id} className={cn('border rounded-xl p-4 transition-all', accessible ? 'bg-surface2 border-base hover:border-brand-400 cursor-pointer' : 'bg-surface2/50 border-base opacity-60 cursor-not-allowed')}>
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-lg flex-shrink-0" style={{ background: prov?.bgLight ?? '#f0f0f2' }}>
                          {prov?.logo ?? '🤖'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[12px] font-medium text-main truncate">{m.display_name}</span>
                            {!accessible && <Lock size={10} className="text-muted flex-shrink-0" />}
                          </div>
                          <div className="text-[10px] text-muted mb-1">{prov?.name ?? m.provider}</div>
                          <div className="text-[10px] text-sub truncate">{m.description}</div>
                          {m.input_cost_per_1m_usd > 0 && (
                            <div className="text-[9px] text-muted mt-1">
                              ${m.input_cost_per_1m_usd}/M in · ${m.output_cost_per_1m_usd}/M out
                            </div>
                          )}
                        </div>
                        <button onClick={e => { e.stopPropagation(); toggleFav(m.id); }}
                          className={cn('flex-shrink-0 transition-colors', favs.includes(m.id) ? 'text-amber-400' : 'text-muted hover:text-amber-400')}>
                          <Star size={13} fill={favs.includes(m.id) ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                      <div className="flex gap-1.5 mt-3 flex-wrap">
                        {m.capabilities.slice(0, 4).map(cap => (
                          <span key={cap} className="text-[9px] bg-surface3 border border-base px-1.5 py-0.5 rounded text-muted capitalize">{cap}</span>
                        ))}
                      </div>
                      <button onClick={() => launch(m)}
                        className={cn('mt-3 w-full py-1.5 rounded-lg text-[11px] transition-colors font-medium',
                          accessible ? 'bg-surface border border-base hover:bg-brand-500/5 hover:border-brand-400 hover:text-brand-500 text-sub' : 'bg-surface3 text-muted')}>
                        {accessible ? 'Use Model →' : `Upgrade to ${planTier.charAt(0).toUpperCase() + planTier.slice(1)} →`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted text-[13px]">No models matching "{search}".</div>
        )}
      </div>
    </div>
  );
}
