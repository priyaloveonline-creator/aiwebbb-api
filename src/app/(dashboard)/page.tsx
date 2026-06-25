'use client';
import { useRouter } from 'next/navigation';
import { Plus, ChevronRight } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useStore } from '@/lib/store';
import { PROVIDERS, PRO_PROVIDERS } from '@/lib/providers';
import { RecentChats, UsageChart } from '@/components/dashboard';
import { ModelSwitcher } from '@/components/dashboard/ModelSwitcher';

const TOOLS = [
  { icon:'🖼', name:'Image Generation', desc:'DALL-E, FLUX, Ideogram', href:'/chat?tool=image' },
  { icon:'🎬', name:'Video Generation',  desc:'Sora, Runway, Kling',   href:'/chat?tool=video' },
  { icon:'🎵', name:'Audio Generation',  desc:'Voice, Music, TTS',     href:'/chat?tool=audio' },
  { icon:'📄', name:'Document Analysis', desc:'PDF, Excel, Code',      href:'/chat?tool=doc' },
];

export default function HomePage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { setActiveModel } = useStore();
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there';
  const plan = profile?.plan ?? 'free';

  function goProvider(pid: string, mid: string) {
    setActiveModel(pid as any, mid);
    router.push(`/chat?provider=${pid}&model=${mid}`);
  }

  const defaultModels: Record<string,string> = {
    chatgpt:'gpt-4o', claude:'claude-sonnet-4-6',
    gemini:'gemini-2.5-flash', deepseek:'deepseek-v3.1', grok:'grok-4-3',
  };

  return (
    <div className="h-full flex overflow-hidden">
      {/* Main */}
      <div className="flex-1 overflow-y-auto p-5 md:p-6">

        {/* Welcome banner */}
        <div className="bg-surface2 border border-base rounded-2xl p-5 mb-6 flex items-center justify-between">
          <div className="max-w-xs">
            <div className="text-[13px] text-sub mb-1">Welcome back, {firstName} 👋</div>
            <h2 className="text-[22px] font-bold text-main leading-tight mb-1">
              One Platform. <span className="text-brand-500">All Top AIs.</span>
            </h2>
            <p className="text-[12px] text-sub mb-4">Chat with the best AI models in one place.</p>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => router.push('/chat')}
                className="flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg px-4 py-2 text-[12px] font-medium transition-colors">
                <Plus size={13} /> New Chat
              </button>
              <button onClick={() => router.push('/webbb')}
                className="flex items-center gap-1.5 border border-base bg-surface hover:bg-surface3 text-main rounded-lg px-4 py-2 text-[12px] transition-colors">
                Explore Models
              </button>
              {plan === 'free' && (
                <button onClick={() => router.push('/billing')}
                  className="flex items-center gap-1.5 border border-brand-400 text-brand-500 hover:bg-brand-500/5 rounded-lg px-4 py-2 text-[12px] transition-colors">
                  ⚡ Upgrade
                </button>
              )}
            </div>
          </div>
          <div className="hidden sm:flex text-5xl gap-1 opacity-70 select-none">🤖✦🐋⚡</div>
        </div>

        {/* Plan-gated AI cards */}
        {plan === 'free' ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-semibold text-main">Free AI Models</h3>
              <button onClick={() => router.push('/billing')} className="text-[11px] text-brand-500 flex items-center gap-0.5 hover:underline">Upgrade for more <ChevronRight size={12}/></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
              {[
                { label:'General Chat', desc:'Owl Alpha — everyday assistant', model:'openrouter/owl-alpha' },
                { label:'Multimodal',   desc:'Nemotron — image, audio, video', model:'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free' },
                { label:'Coding',       desc:'GPT-OSS 120B — coding & math',   model:'openai/gpt-oss-120b:free' },
                { label:'Reasoning',    desc:'Nemotron Super — complex tasks',  model:'nvidia/nemotron-3-super-120b-a12b:free' },
                { label:'Writing',      desc:'Llama 3.3 70B — long content',   model:'meta-llama/llama-3.3-70b-instruct:free' },
                { label:'Research',     desc:'Gemma 4 31B — research & docs',  model:'google/gemma-4-31b-it:free' },
              ].map(f => (
                <button key={f.model} onClick={() => goProvider('openrouter', f.model)}
                  className="bg-surface border border-base hover:border-brand-400 rounded-xl p-4 text-left transition-all hover:-translate-y-0.5 group">
                  <div className="w-8 h-8 rounded-[9px] flex items-center justify-center text-base mb-2 bg-purple-l">🆓</div>
                  <div className="text-[12px] font-semibold text-main mb-0.5">{f.label}</div>
                  <div className="text-[10px] text-muted">{f.desc}</div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-semibold text-main">Top AI Apps</h3>
              <button onClick={() => router.push('/webbb')} className="text-[11px] text-brand-500 flex items-center gap-0.5 hover:underline">View all <ChevronRight size={12}/></button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
              {PRO_PROVIDERS.map(pid => {
                const p = PROVIDERS[pid];
                return (
                  <button key={pid} onClick={() => goProvider(pid, defaultModels[pid])}
                    className="bg-surface border border-base hover:border-brand-400 rounded-xl p-3 text-left transition-all hover:-translate-y-0.5 group">
                    <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-lg mb-2" style={{ background:p.bgLight }}>{p.logo}</div>
                    <div className="text-[12px] font-semibold text-main mb-0.5">{p.name}</div>
                    <div className="text-[10px] text-muted">Multiple models →</div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        <RecentChats />

        {/* Tools */}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          {TOOLS.map(t => (
            <button key={t.href} onClick={() => router.push(t.href)}
              className="bg-surface2 border border-base rounded-xl p-3 text-left hover:border-brand-400 transition-colors">
              <div className="text-xl mb-2">{t.icon}</div>
              <div className="text-[11px] font-semibold text-main mb-0.5">{t.name}</div>
              <div className="text-[10px] text-muted">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Right panel — desktop only */}
      <aside className="hidden xl:flex flex-col w-[276px] border-l border-base bg-surface2 overflow-y-auto p-4 flex-shrink-0">
        <ModelSwitcher />
        <div className="mt-5 pt-5 border-t border-base"><UsageChart /></div>
      </aside>
    </div>
  );
}
