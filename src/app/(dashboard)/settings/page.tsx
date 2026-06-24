'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useStore } from '@/lib/store';
import { createBrowserSupabase } from '@/lib/supabase';
import { Save, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { profile, refreshProfile } = useAuth();
  const { theme, toggleTheme } = useStore();
  const router = useRouter();
  const [name, setName]   = useState(profile?.full_name ?? '');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!profile) return;
    setSaving(true);
    const { error } = await createBrowserSupabase().from('profiles').update({ full_name: name }).eq('id', profile.id);
    setSaving(false);
    if (error) toast.error('Failed to save');
    else { toast.success('Profile updated!'); await refreshProfile(); }
  }

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-surface2 border border-base rounded-xl p-4 mb-4">
      <h3 className="text-[13px] font-semibold text-main mb-3">{title}</h3>
      {children}
    </div>
  );

  const Toggle = ({ defaultOn = false }: { defaultOn?: boolean }) => {
    const [on, setOn] = useState(defaultOn);
    return (
      <button onClick={() => setOn(v => !v)} className={cn('w-10 h-5 rounded-full transition-colors relative flex-shrink-0', on ? 'bg-brand-500' : 'bg-surface3')}>
        <div className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all', on ? 'left-5' : 'left-0.5')} />
      </button>
    );
  };

  return (
    <div className="h-full overflow-y-auto p-5 md:p-8">
      <div className="max-w-xl mx-auto">
        <h1 className="text-[18px] font-semibold text-main mb-6">Settings</h1>

        <Section title="Profile">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-brand-500 flex items-center justify-center text-white text-sm font-semibold">
              {(name || profile?.email || 'AI').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="text-[12px] font-medium text-main">{profile?.email}</div>
              <div className="text-[11px] text-muted capitalize">{profile?.plan} Plan</div>
            </div>
          </div>
          <label className="block text-[11px] text-sub mb-1">Display Name</label>
          <input value={name} onChange={e => setName(e.target.value)}
            className="w-full bg-surface border border-base rounded-lg px-3 py-2 text-[13px] text-main outline-none focus:border-brand-400 transition-colors mb-3" />
          <button onClick={save} disabled={saving}
            className="flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg px-3 py-2 text-[12px] font-medium transition-colors">
            <Save size={12} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </Section>

        <Section title="Appearance">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[12px] font-medium text-main">Theme</div>
              <div className="text-[11px] text-muted">Choose light or dark mode</div>
            </div>
            <div className="flex bg-surface3 rounded-lg p-0.5">
              <button onClick={() => theme === 'dark' && toggleTheme()}
                className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] transition-all', theme === 'light' ? 'bg-surface text-main shadow-sm' : 'text-muted')}>
                <Sun size={12} /> Light
              </button>
              <button onClick={() => theme === 'light' && toggleTheme()}
                className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] transition-all', theme === 'dark' ? 'bg-surface text-main shadow-sm' : 'text-muted')}>
                <Moon size={12} /> Dark
              </button>
            </div>
          </div>
        </Section>

        <Section title="Plan & Credits">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[12px] font-medium text-main capitalize">{profile?.plan ?? 'Free'} Plan</div>
              <div className="text-[11px] text-muted">
                {profile?.plan === 'free' ? 'Free forever with 8 AI models' :
                 profile?.plan === 'pro'  ? `${(profile.pro_credits_balance ?? 0).toLocaleString()} Pro credits remaining` :
                 `${(profile.plus_credits_balance ?? 0).toLocaleString()} Plus credits remaining`}
              </div>
            </div>
            <button onClick={() => router.push('/billing')}
              className="text-[11px] bg-brand-500 hover:bg-brand-600 text-white px-3 py-1.5 rounded-lg transition-colors">
              {profile?.plan === 'free' ? 'Upgrade' : 'Top Up'}
            </button>
          </div>
        </Section>

        <Section title="Privacy & Data">
          <div className="space-y-3">
            {[
              { label: 'Save chat history', desc: 'Store conversations in Supabase', on: true },
              { label: 'Usage analytics',   desc: 'Help improve AIWEBBB',           on: true },
              { label: 'Email updates',     desc: 'Product updates and tips',        on: false },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <div>
                  <div className="text-[12px] text-main">{item.label}</div>
                  <div className="text-[10px] text-muted">{item.desc}</div>
                </div>
                <Toggle defaultOn={item.on} />
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
