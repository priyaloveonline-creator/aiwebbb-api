'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Search, Bell, Sun, Moon, Zap, ChevronDown, LogOut, User, CreditCard, Settings } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useAuth } from '@/components/providers/AuthProvider';
import { cn } from '@/lib/utils';

export function Topbar() {
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme, toggleSidebar } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const initials = (profile?.full_name || profile?.email || 'AI').slice(0,2).toUpperCase();
  const planBadge: Record<string,string> = { free:'Free', pro:'Pro', plus:'Plus' };

  return (
    <header className="h-[50px] flex items-center gap-3 px-4 border-b border-base bg-surface flex-shrink-0">
      <button onClick={toggleSidebar} className="hidden md:flex w-7 h-7 items-center justify-center rounded-md hover:bg-surface3 text-sub transition-colors">
        <Menu size={15} />
      </button>

      {/* Search */}
      <button onClick={() => router.push('/search')}
        className="flex-1 max-w-[480px] flex items-center gap-2 bg-surface2 border border-base hover:border-brand-400 rounded-lg px-3 h-8 text-muted text-[12px] transition-colors">
        <Search size={13} className="flex-shrink-0" />
        <span className="flex-1 text-left">Search models or start a new chat...</span>
        <span className="hidden md:inline text-[10px] bg-surface3 px-1.5 py-0.5 rounded">⌘K</span>
      </button>

      <div className="flex items-center gap-2 ml-auto">
        {profile?.plan === 'free' && (
          <button onClick={() => router.push('/billing')}
            className="hidden sm:flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors">
            <Zap size={11} /> Upgrade
          </button>
        )}
        <button className="relative w-7 h-7 flex items-center justify-center rounded-md border border-base bg-surface2 hover:bg-surface3 text-sub transition-colors">
          <Bell size={13} />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>
        <button onClick={toggleTheme} className="w-7 h-7 flex items-center justify-center rounded-md border border-base bg-surface2 hover:bg-surface3 text-sub transition-colors">
          {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
        </button>

        {/* Profile dropdown */}
        <div className="relative" ref={ref}>
          <button onClick={() => setOpen(o => !o)}
            className="flex items-center gap-2 hover:bg-surface3 rounded-lg px-2 py-1 transition-colors">
            <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center text-white text-[11px] font-semibold">{initials}</div>
            <div className="hidden md:block text-left">
              <div className="text-[11px] font-medium text-main leading-tight">{profile?.full_name ?? 'User'}</div>
              <div className="text-[10px] text-muted">{planBadge[profile?.plan ?? 'free']} Plan</div>
            </div>
            <ChevronDown size={12} className="hidden md:block text-muted" />
          </button>
          {open && (
            <div className="absolute right-0 top-full mt-1.5 w-52 bg-surface border border-base rounded-xl shadow-lg py-1 z-50 animate-fade-in">
              <div className="px-3 py-2 border-b border-base">
                <div className="text-[12px] font-medium text-main">{profile?.full_name}</div>
                <div className="text-[11px] text-muted truncate">{profile?.email}</div>
              </div>
              {[
                { icon:User,       label:'Profile',  href:'/settings/profile' },
                { icon:CreditCard, label:'Billing',  href:'/billing' },
                { icon:Settings,   label:'Settings', href:'/settings' },
              ].map(({ icon: Icon, label, href }) => (
                <button key={href} onClick={() => { setOpen(false); router.push(href); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-sub hover:bg-surface3 hover:text-main transition-colors">
                  <Icon size={13} />{label}
                </button>
              ))}
              <div className="border-t border-base mt-1" />
              <button onClick={signOut} className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                <LogOut size={13} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
