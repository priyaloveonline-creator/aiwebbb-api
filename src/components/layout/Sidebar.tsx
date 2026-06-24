'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Home, History, Bookmark, BarChart2, Settings, GitCompare, Wrench, FolderOpen, BookOpen, CreditCard, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/lib/store';
import { useAuth } from '@/components/providers/AuthProvider';
import { PROVIDERS, PRO_PROVIDERS } from '@/lib/providers';
import { formatCredits } from '@/lib/credits';

const HUB_NAV = [
  { label:'Compare AI',      icon:GitCompare, href:'/compare' },
  { label:'AI Tools',        icon:Wrench,     href:'/tools' },
  { label:'Projects',        icon:FolderOpen, href:'/projects' },
  { label:'Prompts Library', icon:BookOpen,   href:'/prompts' },
  { label:'History',         icon:History,    href:'/history' },
  { label:'Bookmarks',       icon:Bookmark,   href:'/bookmarks' },
];

export function Sidebar() {
  const router   = useRouter();
  const pathname = usePathname();
  const { profile } = useAuth();
  const { setActiveModel } = useStore();
  const plan = profile?.plan ?? 'free';

  const credits = plan === 'plus'
    ? profile?.plus_credits_balance ?? 0
    : plan === 'pro'
    ? profile?.pro_credits_balance ?? 0
    : 0;

  function goChat(provider: string, modelId: string) {
    setActiveModel(provider as any, modelId);
    router.push(`/chat?provider=${provider}&model=${modelId}`);
  }

  return (
    <aside className="w-full h-full flex flex-col bg-surface2 border-r border-base overflow-y-auto">
      {/* Logo */}
      <div className="px-4 py-3.5 border-b border-base flex-shrink-0">
        <Link href="/" className="block">
          <div className="text-[17px] font-bold tracking-tight"><span className="text-brand-500">AI</span>WEBBB</div>
          <div className="text-[10px] text-muted mt-0.5">All AI Models. One Platform.</div>
        </Link>
      </div>

      {/* New Chat */}
      <div className="px-3 pt-3 flex-shrink-0">
        <button
          onClick={() => router.push('/chat')}
          className="w-full flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg px-3 py-2 text-[12px] font-medium transition-colors"
        >
          <span className="text-[15px]">+</span> New Chat
          <span className="ml-auto text-[10px] opacity-60">⌘K</span>
        </button>
      </div>

      {/* Home */}
      <div className="px-3 pt-2">
        <NavItem href="/" icon={Home} label="Home" active={pathname === '/'} />
      </div>

      {/* FREE Plan models */}
      {plan === 'free' && (
        <div className="px-3 pt-3">
          <div className="nav-section-label">Free AI Models</div>
          <button onClick={() => goChat('openrouter','openrouter/owl-alpha')}
            className={navItemCls(false)}>
            <ProvIcon bg="#f0edff" color="#6c47ff">🆓</ProvIcon> AIWEBBB Free
          </button>
        </div>
      )}

      {/* PRO / PLUS plan — show all 5 providers */}
      {(plan === 'pro' || plan === 'plus') && (
        <div className="px-3 pt-3">
          <div className="nav-section-label">Top AI Apps</div>
          {PRO_PROVIDERS.map(pid => {
            const p = PROVIDERS[pid];
            const defaultModels: Record<string,string> = {
              chatgpt:'gpt-4o', claude:'claude-sonnet-4-6',
              gemini:'gemini-2.5-flash', deepseek:'deepseek-v3.1', grok:'grok-4-3',
            };
            const active = pathname.startsWith('/chat') && new URLSearchParams(typeof window!=='undefined'?window.location.search:'').get('provider') === pid;
            return (
              <button key={pid} onClick={() => goChat(pid, defaultModels[pid])}
                className={navItemCls(active)}>
                <ProvIcon bg={p.bgLight} color={p.color}>{p.logo}</ProvIcon>
                {p.name}
              </button>
            );
          })}
        </div>
      )}

      {/* WEBBB Hub — Plus only */}
      <div className="px-3 pt-3">
        <div className="nav-section-label">WEBBB Hub</div>
        {plan === 'plus' ? (
          <button onClick={() => router.push('/webbb')}
            className={navItemCls(pathname === '/webbb')}>
            <ProvIcon bg="#f0edff" color="#6c47ff">⚙</ProvIcon>
            100+ AI Models
            <span className="ml-auto text-[9px] bg-brand-500 text-white px-1.5 py-0.5 rounded font-semibold">Plus</span>
          </button>
        ) : (
          <button onClick={() => router.push('/billing')}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[12.5px] text-muted hover:bg-surface3 transition-colors mb-0.5 opacity-60">
            <ProvIcon bg="#f0edff" color="#6c47ff">⚙</ProvIcon>
            100+ Models <span className="ml-auto text-[9px] border border-brand-500 text-brand-500 px-1.5 py-0.5 rounded">Upgrade</span>
          </button>
        )}
        {HUB_NAV.map(item => (
          <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} active={pathname === item.href} />
        ))}
      </div>

      <div className="flex-1" />

      {/* Credits / Upgrade */}
      <div className="px-3 pb-3 flex-shrink-0">
        {plan === 'free' ? (
          <button onClick={() => router.push('/billing')}
            className="w-full bg-gradient-to-r from-brand-500 to-brand-400 hover:from-brand-600 hover:to-brand-500 text-white rounded-xl px-3 py-2.5 text-[12px] font-semibold transition-all">
            ⚡ Upgrade to Pro
          </button>
        ) : (
          <div className="bg-surface3 border border-base rounded-xl p-3">
            <div className="text-[10px] text-muted mb-1">Credits Balance ({plan === 'plus' ? 'Plus' : 'Pro'})</div>
            <div className="flex items-center gap-1.5">
              <span className="text-[18px] font-bold text-main">{formatCredits(credits)}</span>
              <span className="text-base">🪙</span>
            </div>
            <div className="h-1 bg-surface/40 rounded-full mt-2 mb-1.5 overflow-hidden">
              <div className="h-full bg-brand-500 rounded-full w-[60%]" />
            </div>
            <button onClick={() => router.push('/billing')} className="text-[10px] text-brand-500 hover:underline flex items-center gap-0.5">
              Top up credits <ChevronRight size={10} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

function NavItem({ href, icon: Icon, label, active }: { href:string; icon:any; label:string; active:boolean }) {
  return (
    <Link href={href} className={navItemCls(active)}>
      <Icon size={14} className="flex-shrink-0" />{label}
    </Link>
  );
}
function ProvIcon({ bg, color, children }: { bg:string; color:string; children:React.ReactNode }) {
  return <span className="w-[18px] h-[18px] rounded-[5px] flex items-center justify-center text-[11px] flex-shrink-0" style={{ background:bg, color }}>{children}</span>;
}
function navItemCls(active: boolean) {
  return cn(
    'w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[12.5px] mb-0.5 transition-colors text-left',
    active ? 'bg-brand-500/10 text-brand-500 font-medium' : 'text-sub hover:bg-surface3 hover:text-main'
  );
}
