'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { createBrowserSupabase } from '@/lib/supabase';
import { PROVIDERS } from '@/lib/providers';
import { formatCredits } from '@/lib/credits';
import { formatDistanceToNow } from 'date-fns';
import { MoreHorizontal, ChevronRight, Plus } from 'lucide-react';
import type { Conversation } from '@/types';

// ── Usage Chart ──────────────────────────────────────────────
const USAGE_DATA = [
  { name:'ChatGPT', pct:45, color:'#10b981' },
  { name:'Claude',  pct:25, color:'#f59e0b' },
  { name:'Gemini',  pct:15, color:'#3b82f6' },
  { name:'Others',  pct:15, color:'#6c47ff' },
];

export function UsageChart() {
  const router = useRouter();
  const { profile } = useAuth();
  const plan = profile?.plan ?? 'free';
  const credits = plan === 'plus' ? profile?.plus_credits_balance ?? 0
                : plan === 'pro'  ? profile?.pro_credits_balance  ?? 0 : 0;
  const used = profile?.credits_used_this_month ?? 0;

  const r = 32; const circ = 2 * Math.PI * r;
  let off = 0;
  const segs = USAGE_DATA.map(d => {
    const dash = (d.pct/100)*circ;
    const s = { ...d, dash, gap:circ-dash, offset:off };
    off += dash; return s;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[13px] font-semibold text-main">Monthly Usage</span>
        <span className="text-[10px] text-muted">Resets in 14 days</span>
      </div>
      {plan === 'free' ? (
        <div className="text-center py-4">
          <div className="text-[12px] text-sub mb-2">No credit tracking on Free plan</div>
          <button onClick={() => router.push('/billing')} className="text-[11px] text-brand-500 hover:underline">Upgrade to track usage →</button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 flex-shrink-0">
              <svg width="80" height="80" viewBox="0 0 80 80" style={{transform:'rotate(-90deg)'}}>
                <circle cx="40" cy="40" r={r} fill="none" stroke="var(--bg3)" strokeWidth="10"/>
                {segs.map((s,i) => (
                  <circle key={i} cx="40" cy="40" r={r} fill="none" stroke={s.color} strokeWidth="10"
                    strokeDasharray={`${s.dash} ${s.gap}`} strokeDashoffset={-s.offset} strokeLinecap="round"/>
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[12px] font-bold text-main">{formatCredits(used)}</span>
                <span className="text-[9px] text-muted">Used</span>
              </div>
            </div>
            <div className="flex-1 space-y-1.5">
              {USAGE_DATA.map(d => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{background:d.color}}/>
                  <span className="flex-1 text-[11px] text-sub">{d.name}</span>
                  <span className="text-[11px] font-medium text-main">{d.pct}%</span>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => router.push('/billing')}
            className="w-full mt-4 py-2.5 bg-gradient-to-r from-brand-500 to-brand-400 hover:from-brand-600 hover:to-brand-500 text-white rounded-xl text-[12px] font-semibold transition-all">
            Top up Credits ⚡
          </button>
        </>
      )}
    </div>
  );
}

// ── Recent Chats ─────────────────────────────────────────────
export function RecentChats() {
  const router = useRouter();
  const { user } = useAuth();
  const [chats, setChats] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    createBrowserSupabase()
      .from('conversations').select('*').eq('user_id',user.id)
      .eq('is_archived',false).order('updated_at',{ascending:false}).limit(5)
      .then(({ data }) => { if (data) setChats(data as Conversation[]); setLoading(false); });
  }, [user]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-semibold text-main">Recent Chats</h3>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/chat')}
            className="hidden md:flex items-center gap-1 text-[11px] text-brand-500 border border-brand-200 dark:border-brand-800 hover:bg-brand-500/5 px-2 py-1 rounded-lg transition-colors">
            <Plus size={11}/> New Chat
          </button>
          <button onClick={() => router.push('/history')} className="text-[11px] text-brand-500 flex items-center gap-0.5 hover:underline">
            View all <ChevronRight size={12}/>
          </button>
        </div>
      </div>
      <div className="bg-surface border border-base rounded-xl overflow-hidden">
        {loading ? (
          Array.from({length:3}).map((_,i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-base last:border-0 animate-pulse">
              <div className="w-8 h-8 rounded-lg bg-surface3"/><div className="flex-1"><div className="h-3 bg-surface3 rounded w-2/3 mb-1.5"/><div className="h-2.5 bg-surface3 rounded w-1/3"/></div>
            </div>
          ))
        ) : chats.length === 0 ? (
          <div className="py-8 text-center text-muted text-[12px]">
            No chats yet. <button onClick={() => router.push('/chat')} className="text-brand-500 hover:underline">Start one →</button>
          </div>
        ) : chats.map(chat => {
          const p = PROVIDERS[chat.provider as string] ?? PROVIDERS.chatgpt;
          return (
            <button key={chat.id} onClick={() => router.push(`/chat/${chat.id}`)}
              className="w-full flex items-center gap-3 px-4 py-3 border-b border-base last:border-0 hover:bg-surface2 transition-colors text-left group">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{background:p.bgLight}}>{p.logo}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-medium text-main truncate">{chat.title}</div>
                <div className="text-[10.5px] text-muted">{p.name} · {formatDistanceToNow(new Date(chat.updated_at),{addSuffix:true})}</div>
              </div>
              <MoreHorizontal size={15} className="text-muted opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity"/>
            </button>
          );
        })}
      </div>
    </div>
  );
}
