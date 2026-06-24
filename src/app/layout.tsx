import type { Metadata } from 'next';
import './globals.css';
import { ThemeBootstrap } from '@/components/providers/ThemeBootstrap';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'AIWEBBB — One Platform. All Top AIs.',
  description: 'ChatGPT, Claude, Gemini, Grok, DeepSeek and 100+ models in one AI operating system.',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeBootstrap />
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background:'var(--toast-bg)', color:'var(--toast-tx)', border:'.5px solid var(--toast-br)', borderRadius:'10px', fontSize:'13px' },
          }}
        />
      </body>
    </html>
  );
}
