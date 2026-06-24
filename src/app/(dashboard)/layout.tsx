'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/components/providers/AuthProvider';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { MobileNav } from '@/components/layout/MobileNav';
import { useStore } from '@/lib/store';

function Shell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const sidebarOpen = useStore(s => s.sidebarOpen);

  useEffect(() => {
    if (!loading && !user) router.replace('/auth');
  }, [user, loading]);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-surface gap-3">
      <span className="text-[22px] font-bold"><span className="text-brand-500">AI</span>WEBBB</span>
      <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return null;

  return (
    <div className="h-screen flex overflow-hidden bg-surface">
      <div className={`hidden md:flex flex-shrink-0 transition-all duration-200 overflow-hidden ${sidebarOpen ? 'sidebar-w' : 'w-0'}`}>
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar />
        <main className="flex-1 overflow-hidden">{children}</main>
        <MobileNav />
      </div>
    </div>
  );
}

export default function DashLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider><Shell>{children}</Shell></AuthProvider>;
}
