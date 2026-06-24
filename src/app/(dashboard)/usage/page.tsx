'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { createBrowserSupabase } from '@/lib/supabase';
import { useStore } from '@/lib/store';
import { formatCredits } from '@/lib/credits';
import { PROVIDERS } from '@/lib/providers';
import { Zap, TrendingUp, Clock, BarChart2 } from 'lucide-react';

interface Log { provider: string; model_id: string; credits_used: number; cost_usd: number; created_at: string; }

export default function UsagePage() {
  const { profile, user } = useAuth();
  const { modelCache } = useStore();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    createBrowserSupabase()
      .from('usage_logs').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(200)
      .then(({ data }) => { if (data) setLogs(data as Log[]); setLoading(false); });
  }, [user]);

  const plan = profile?.plan ?? 'free';
  const usedThisMonth = profile?.credits_used_this_month ?? 0;
  const balance = plan === 'plus' ? profile?.plus_credits_balance ?? 0 : plan === 'pro' ? profile?.pro_credits_balance ?? 0 : 0;
  const totalCostUsd = logs.reduce((s, l) => s + (l.cost_usd ?? 0), 0);

  // By provider
  const byProvider = logs.reduce<Record<string, number>>((acc, l) => {
    acc[l.provider] = (acc[l.provider] ?? 0) + l.credits_used;
    return acc;
  }, {});
  const totalUsed = Object.values(byProvider).reduce((a, b) => a + b, 0) || 1;

  // Daily last 7 days
  const days: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    days[d.toISOString().slice(0, 10)] = 0;
  }
  logs.forEach(l => { const d = l.created_at.slice(0, 10); if (d in days) days[d] += l.credits_used; });
  const dayEntries = Object.entries(days);
  const maxDay = Math.max(...dayEntries.map(([, v]) => v), 1);

  const statCards = [
    { label: 'Credits Used This Month', value: formatCredits(usedThisMonth), icon: Zap,        color: 'text-brand-500' },
    { label: 'Credits Remaining',        value: formatCredits(balance),       icon: TrendingUp, color: 'text-green-500' },
    { label: 'Total API Requests',        value: logs.length.toString(),       icon: Clock,      color: 'text-blue-500' },
    { label: 'Total API Cost (USD)',      value: `$${totalCostUsd.toFixed(4)}`, icon: BarChart2, color: 'text-amber-500' },
  ];

  return (
    <div className="h-full overflow-y-auto p-5 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-[18px] font-semibold text-main mb-5">Usage Analytics</h1>

        {plan === 'free' && (
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-5 text-[12px] text-amber-700 dark:text-amber-400">
            You're on the Free plan — credit usage tracking is available on Pro & Plus plans.
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-surface2 border border-base rounded-xl p-4">
              <Icon size={16} className={`${color} mb-2`} />
              <div className="text-[18px] font-bold text-main capitalize">{value}</div>
              <div className="text-[10px] text-muted mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Daily bar chart */}
        <div className="bg-surface2 border border-base rounded-xl p-4 mb-6">
          <h3 className="text-[13px] font-semibold text-main mb-4">Daily Credit Usage (Last 7 Days)</h3>
          <div className="flex items-end gap-2 h-28">
            {dayEntries.map(([day, val]) => {
              const pct = (val / maxDay) * 100;
              const label = new Date(day).toLocaleDateString('en', { weekday: 'short' });
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-1">
                  {val > 0 && <div className="text-[9px] text-muted">{formatCredits(val)}</div>}
                  <div className="w-full relative flex-1 flex items-end">
                    <div className="w-full bg-brand-500 rounded-t-md transition-all opacity-80" style={{ height: `${Math.max(2, pct)}%` }} />
                  </div>
                  <div className="text-[9px] text-muted">{label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Provider breakdown */}
        <div className="bg-surface2 border border-base rounded-xl p-4 mb-6">
          <h3 className="text-[13px] font-semibold text-main mb-4">Usage by Provider</h3>
          {Object.entries(PROVIDERS).filter(([id]) => id !== 'openrouter').map(([pid, prov]) => {
            const used = byProvider[pid] ?? 0;
            const pct = totalUsed > 0 ? (used / totalUsed) * 100 : 0;
            return (
              <div key={pid} className="flex items-center gap-3 mb-3 last:mb-0">
                <span className="w-5 h-5 rounded text-[11px] flex items-center justify-center flex-shrink-0" style={{ background: prov.bgLight }}>{prov.logo}</span>
                <div className="text-[12px] text-sub w-20 flex-shrink-0">{prov.name}</div>
                <div className="flex-1 h-2 bg-surface3 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="text-[11px] text-main w-20 text-right flex-shrink-0">
                  {formatCredits(used)} <span className="text-muted">({pct.toFixed(0)}%)</span>
                </div>
              </div>
            );
          })}
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-base">
            <span className="w-5 h-5 rounded text-[11px] flex items-center justify-center flex-shrink-0 bg-brand-500/10">🆓</span>
            <div className="text-[12px] text-sub w-20 flex-shrink-0">Free (OR)</div>
            <div className="flex-1 h-2 bg-surface3 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${((byProvider['openrouter'] ?? 0) / totalUsed) * 100}%` }} />
            </div>
            <div className="text-[11px] text-main w-20 text-right">{formatCredits(byProvider['openrouter'] ?? 0)}</div>
          </div>
        </div>

        {/* Recent log */}
        <div className="bg-surface2 border border-base rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-base">
            <h3 className="text-[13px] font-semibold text-main">Recent Activity</h3>
          </div>
          {loading ? (
            <div className="p-4 space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-8 bg-surface3 rounded animate-pulse" />)}</div>
          ) : logs.length === 0 ? (
            <div className="py-10 text-center text-muted text-[12px]">No usage data yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-base text-muted">
                    <th className="text-left px-4 py-2 font-medium">Provider</th>
                    <th className="text-left px-4 py-2 font-medium">Model</th>
                    <th className="text-right px-4 py-2 font-medium">Credits</th>
                    <th className="text-right px-4 py-2 font-medium">API Cost</th>
                    <th className="text-right px-4 py-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.slice(0, 25).map((log, i) => {
                    const prov = PROVIDERS[log.provider];
                    const mName = modelCache[log.model_id]?.display_name ?? log.model_id;
                    return (
                      <tr key={i} className="border-b border-base last:border-0 hover:bg-surface3/50 transition-colors">
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded text-[9px] flex items-center justify-center" style={{ background: prov?.bgLight }}>{prov?.logo}</span>
                            {prov?.name ?? log.provider}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sub truncate max-w-[120px]">{mName}</td>
                        <td className="px-4 py-2 text-right text-brand-500 font-medium">{log.credits_used}</td>
                        <td className="px-4 py-2 text-right text-muted">${(log.cost_usd ?? 0).toFixed(6)}</td>
                        <td className="px-4 py-2 text-right text-muted">
                          {new Date(log.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
