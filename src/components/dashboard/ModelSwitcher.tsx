'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, SlidersHorizontal } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useAuth } from '@/components/providers/AuthProvider';
import { cn } from '@/lib/utils';

const TABS: { label:string; providers:string[] }[] = [
  { label:'ChatGPT', providers:['chatgpt'] },
  { label:'Claude',  providers:['claude'] },
  { label:'Gemini',  providers:['gemini'] },
  { label:'More',    providers:['deepseek','grok'] },
];

export function ModelSwitcher() {
  const router = useRouter();
  const { modelCache } = useStore();
  const { profile } = useAuth();
  const [tab, setTab] = useState(0);
  const plan = profile?.plan ?? 'free';

  const providerIds = TABS[tab].providers;
  const models = Object.values(modelCache)
    .filter(m => providerIds.includes(m.provider) && m.required_plan !== 'plus')
    .sort((a,b) => a.sort_order - b.sort_order)
    .slice(0,5);

  if (plan === 'free') return (
    <div>
      <div className="text-[13px] font-semibold text-main mb-2">Switch AI Model</div>
      <div className="bg-surface3 rounded-xl p-4 text-center">
        <div className="text-2xl mb-2">⚡</div>
        <div className="text-[12px] font-medium text-main mb-1">Upgrade to Pro</div>
        <div className="text-[11px] text-sub mb-3">Access ChatGPT, Claude, Gemini, Grok & DeepSeek</div>
        <button onClick={() => router.push('/billing')}
          className="w-full py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-[11px] font-medium transition-colors">
          View Plans →
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[13px] font-semibold text-main">Switch AI Model</span>
        <SlidersHorizontal size={13} className="text-muted cursor-pointer" />
      </div>
      <div className="flex gap-1 bg-surface3 rounded-lg p-0.5 mb-3">
        {TABS.map((t,i) => (
          <button key={i} onClick={() => setTab(i)}
            className={cn('flex-1 text-center text-[11px] py-1.5 rounded-md transition-all',
              tab===i ? 'bg-brand-500 text-white font-medium' : 'text-sub hover:text-main')}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="space-y-0.5">
        {models.map((m,i) => (
          <button key={m.id} onClick={() => { router.push(`/chat?provider=${m.provider}&model=${m.id}`); }}
            className="w-full flex items-center gap-2.5 py-2 border-b border-base last:border-0 px-1 hover:bg-surface3 rounded-lg transition-colors group">
            <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs flex-shrink-0 bg-surface3">
              {m.provider==='chatgpt'?'🤖':m.provider==='claude'?'🔶':m.provider==='gemini'?'✦':m.provider==='deepseek'?'🐋':'⚡'}
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="text-[12px] font-medium text-main truncate group-hover:text-brand-500 transition-colors">{m.display_name}</div>
              <div className="text-[10px] text-muted truncate">{m.description}</div>
            </div>
            {i===2 && <Check size={12} className="text-green-500 flex-shrink-0"/>}
          </button>
        ))}
      </div>
      <button onClick={() => router.push(`/chat?provider=${providerIds[0]}`)}
        className="w-full mt-2 py-2 bg-surface border border-base rounded-lg text-[11px] text-sub hover:text-main hover:bg-surface3 transition-colors">
        View all {TABS[tab].label} models →
      </button>
    </div>
  );
}
