'use client';
import { useState } from 'react';
import { Send, X, Plus } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useAuth } from '@/components/providers/AuthProvider';
import { PROVIDERS } from '@/lib/providers';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';

interface Panel { modelId: string; provider: string; content: string; isLoading: boolean; error?: string; timeMs?: number; credits?: number; }

const DEFAULTS: Panel[] = [
  { modelId: 'gpt-4o',           provider: 'chatgpt',  content: '', isLoading: false },
  { modelId: 'claude-sonnet-4-6',provider: 'claude',   content: '', isLoading: false },
  { modelId: 'gemini-2.5-flash', provider: 'gemini',   content: '', isLoading: false },
];

export default function ComparePage() {
  const { modelCache } = useStore();
  const { profile } = useAuth();
  const [panels, setPanels] = useState<Panel[]>(DEFAULTS);
  const [prompt, setPrompt] = useState('');
  const [ran, setRan] = useState(false);

  const plan = profile?.plan ?? 'free';

  function addPanel() {
    if (panels.length >= 4) return;
    setPanels(prev => [...prev, { modelId: 'deepseek-v3.1', provider: 'deepseek', content: '', isLoading: false }]);
  }

  async function runCompare() {
    if (!prompt.trim()) return;
    if (plan === 'free') { toast.error('Compare AI requires Pro or Plus plan'); return; }
    setRan(true);
    setPanels(prev => prev.map(p => ({ ...p, content: '', isLoading: true, error: undefined, timeMs: undefined, credits: undefined })));

    panels.forEach(async (panel, i) => {
      const start = Date.now();
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ modelId: panel.modelId, messages: [{ role: 'user', content: prompt }], stream: true }),
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
        const reader = res.body!.getReader();
        const dec = new TextDecoder();
        let full = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const line of dec.decode(value).split('\n')) {
            if (!line.startsWith('data: ')) continue;
            const raw = line.slice(6);
            if (raw === '[DONE]') break;
            try {
              const d = JSON.parse(raw);
              if (d.type === 'chunk') { full += d.content; setPanels(prev => prev.map((p, j) => j === i ? { ...p, content: full } : p)); }
              if (d.type === 'done') setPanels(prev => prev.map((p, j) => j === i ? { ...p, isLoading: false, timeMs: Date.now() - start, credits: d.creditsUsed } : p));
            } catch {}
          }
        }
      } catch (err: any) {
        setPanels(prev => prev.map((p, j) => j === i ? { ...p, isLoading: false, error: err.message } : p));
      }
    });
  }

  const cols = panels.length <= 2 ? panels.length : panels.length <= 4 ? panels.length : 2;

  return (
    <div className="h-full flex flex-col overflow-hidden p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-[16px] font-semibold text-main">Compare AI</h1>
          <p className="text-[12px] text-sub">One prompt — multiple AI responses side by side</p>
        </div>
        <div className="flex items-center gap-2">
          {panels.length < 4 && (
            <button onClick={addPanel} className="flex items-center gap-1.5 text-[11px] border border-base rounded-lg px-3 py-1.5 text-sub hover:text-main hover:bg-surface3 transition-colors">
              <Plus size={12} /> Add Model
            </button>
          )}
          {plan === 'free' && (
            <span className="text-[11px] bg-amber-100 dark:bg-amber-900/20 text-amber-600 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800">
              Requires Pro plan
            </span>
          )}
        </div>
      </div>

      {/* Prompt */}
      <div className="flex gap-2 mb-4">
        <input value={prompt} onChange={e => setPrompt(e.target.value)} onKeyDown={e => e.key === 'Enter' && runCompare()}
          placeholder="Enter a prompt to compare across all selected models..."
          className="flex-1 bg-surface2 border border-base focus:border-brand-400 rounded-xl px-4 py-2.5 text-[13px] text-main placeholder:text-muted outline-none transition-colors" />
        <button onClick={runCompare} disabled={!prompt.trim() || plan === 'free'}
          className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-medium transition-colors',
            prompt.trim() && plan !== 'free' ? 'bg-brand-500 hover:bg-brand-600 text-white' : 'bg-surface3 text-muted cursor-not-allowed')}>
          <Send size={13} /> Compare
        </button>
      </div>

      {/* Panels grid */}
      <div className={`flex-1 grid gap-3 overflow-hidden`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {panels.map((panel, i) => {
          const p = PROVIDERS[panel.provider];
          const m = modelCache[panel.modelId];
          return (
            <div key={i} className="flex flex-col bg-surface2 border border-base rounded-xl overflow-hidden">
              {/* Panel header */}
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-base flex-shrink-0">
                <span className="w-6 h-6 rounded-lg flex items-center justify-center text-sm flex-shrink-0" style={{ background: p?.bgLight }}>{p?.logo}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium text-main truncate">{p?.name}</div>
                  <div className="text-[10px] text-muted truncate">{m?.display_name ?? panel.modelId}</div>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted">
                  {panel.timeMs && <span>{panel.timeMs}ms</span>}
                  {panel.credits && <span>{panel.credits}cr</span>}
                </div>
                <button onClick={() => setPanels(prev => prev.filter((_, j) => j !== i))} className="text-muted hover:text-main transition-colors ml-1">
                  <X size={13} />
                </button>
              </div>
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-3 text-[12px]">
                {panel.isLoading && !panel.content && (
                  <div className="flex gap-1 mt-2">{[0,1,2].map(j => <div key={j} className="w-1.5 h-1.5 bg-muted rounded-full animate-dot" style={{ animationDelay: `${j*.2}s` }} />)}</div>
                )}
                {panel.error && <div className="text-red-400">{panel.error}</div>}
                {panel.content && (
                  <div className={cn('md text-[12px]', panel.isLoading && 'cursor-blink')}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{panel.content}</ReactMarkdown>
                  </div>
                )}
                {!panel.content && !panel.isLoading && !ran && <div className="text-muted text-[11px] italic">Response will appear here...</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
