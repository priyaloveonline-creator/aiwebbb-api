'use client';
import { useEffect } from 'react';
import { useStore } from '@/lib/store';

export function ThemeBootstrap() {
  const theme = useStore(s => s.theme);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  return null;
}
