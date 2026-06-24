'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createBrowserSupabase } from '@/lib/supabase';
import { useStore } from '@/lib/store';

export default function AuthPage() {
  const router = useRouter();
  const sb = createBrowserSupabase();
  const theme = useStore(s => s.theme);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    sb.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/'); else setChecking(false);
    });
    const { data: { subscription } } = sb.auth.onAuthStateChange((_e, session) => {
      if (session) router.replace('/');
    });
    return () => subscription.unsubscribe();
  }, []);

  if (checking) return (
    <div className="h-screen flex items-center justify-center bg-surface">
      <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const dark = theme === 'dark';

  return (
    <div className="h-screen flex bg-surface overflow-hidden">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[55%] bg-surface2 border-r border-base p-12">
        <div>
          <div className="text-2xl font-bold tracking-tight">
            <span className="text-brand-500">AI</span>WEBBB
          </div>
          <div className="text-[11px] text-muted mt-0.5">All AI Models. One Platform.</div>
        </div>
        <div>
          <h2 className="text-[38px] font-bold text-main leading-[1.15] mb-3">
            One Platform.<br /><span className="text-brand-500">All Top AIs.</span>
          </h2>
          <p className="text-sub text-[14px] mb-6 max-w-xs leading-relaxed">
            Chat with ChatGPT, Claude, Gemini, Grok, DeepSeek and 100+ models — one account, one subscription.
          </p>
          <div className="flex flex-wrap gap-2 mb-8">
            {['ChatGPT','Claude','Gemini','Grok','DeepSeek','+ 100 more'].map(n => (
              <span key={n} className="px-3 py-1 bg-surface3 border border-base rounded-full text-[12px] text-sub">{n}</span>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'AI Providers', value: '5+' },
              { label: 'Models', value: '100+' },
              { label: 'Plans', value: 'Free · Pro · Plus' },
            ].map(s => (
              <div key={s.label} className="bg-surface border border-base rounded-xl p-3">
                <div className="text-[18px] font-bold text-brand-500">{s.value}</div>
                <div className="text-[11px] text-muted">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-[11px] text-muted">© 2026 AIWEBBB. All rights reserved.</div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-[360px]">
          <div className="text-center mb-7">
            <div className="text-xl font-bold mb-1"><span className="text-brand-500">AI</span>WEBBB</div>
            <h3 className="text-[22px] font-semibold text-main">Welcome back</h3>
            <p className="text-sub text-[13px] mt-1">Sign in to access all AI models</p>
          </div>
          <Auth
            supabaseClient={sb}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#6c47ff', brandAccent: '#4a2fcf',
                    inputBackground:           dark ? '#161618' : '#f7f7f8',
                    inputBorder:               dark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)',
                    inputText:                 dark ? '#f0f0f0' : '#0a0a0a',
                    inputPlaceholder:          dark ? '#606068' : '#9a9a9a',
                    defaultButtonBackground:   dark ? '#1e1e22' : '#f0f0f2',
                    defaultButtonBackgroundHover: dark ? '#26262c' : '#e8e8ea',
                    defaultButtonText:         dark ? '#f0f0f0' : '#0a0a0a',
                    dividerBackground:         dark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)',
                  },
                  radii: { borderRadiusButton: '8px', inputBorderRadius: '8px' },
                  fontSizes: { baseBodySize: '13px', baseInputSize: '13px' },
                },
              },
            }}
            providers={['google', 'github']}
            redirectTo={`${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`}
            socialLayout="horizontal"
          />
          <p className="text-center text-[11px] text-muted mt-5">
            By signing in you agree to our{' '}
            <span className="text-brand-500 cursor-pointer hover:underline">Terms</span> &{' '}
            <span className="text-brand-500 cursor-pointer hover:underline">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
}
