'use client';
import { useRouter, usePathname } from 'next/navigation';
import { Home, Layers, Plus, BarChart2, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const ITEMS = [
  { icon:Home,     label:'Home',    href:'/' },
  { icon:Layers,   label:'Models',  href:'/webbb' },
  { icon:Plus,     label:'Chat',    href:'/chat', center:true },
  { icon:BarChart2,label:'Usage',   href:'/usage' },
  { icon:User,     label:'Profile', href:'/settings/profile' },
];

export function MobileNav() {
  const pathname = usePathname();
  const router   = useRouter();
  return (
    <nav className="md:hidden flex items-center justify-around border-t border-base bg-surface h-16 px-2 flex-shrink-0">
      {ITEMS.map(({ icon:Icon, label, href, center }) => {
        const active = pathname === href;
        if (center) return (
          <button key={href} onClick={() => router.push(href)}
            className="w-12 h-12 rounded-full bg-brand-500 flex items-center justify-center shadow-lg -mt-4">
            <Icon size={20} className="text-white" />
          </button>
        );
        return (
          <button key={href} onClick={() => router.push(href)}
            className={cn('flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors', active ? 'text-brand-500' : 'text-muted')}>
            <Icon size={18} />
            <span className="text-[10px]">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
