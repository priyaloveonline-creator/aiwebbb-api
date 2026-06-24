'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useStore } from '@/lib/store';
import { createBrowserSupabase } from '@/lib/supabase';
import { PROVIDERS } from '@/lib/providers';
import { v4 as uuid } from 'uuid';
import toast from 'react-hot-toast';
import type { Message, Provider, Conversation } from '@/types';
// Re-use chat components from parent page via dynamic import would bloat bundle
// Instead inline minimal versions here

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import TextareaAutosize from 'react-textarea-autosize';
import { Send, Square, ArrowLeftRight, ChevronDown, Check, Copy, ThumbsUp, ThumbsDown, X, Paperclip, Globe, Lightbulb, Mic } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export default function ConversationPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const { user, profile } = useAuth();
  const { modelCache, setActiveModel } = useStore();

  const [conv,     setConv]     = useState<Conversation | null>(null);
  const [provider, setProvider] = useState<Provider>('chatgpt');
  const [modelId,  setModelId]  = useState('gpt-4o');
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming,setStreaming] = useState(false);
  const [streamTxt,setStreamTxt] = useState('');
  const [loaded,   setLoaded]   = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !id) return;
    const sb = createBrowserSupabase();
    Promise.all([
      sb.from('conversations').select('*').eq('id', id).eq('user_id', user.id).single(),
      sb.from('messages').select('*').eq('conversation_id', id).order('created_at', { ascending: true }),
    ]).then(([{ data: c }, { data: m }]) => {
      if (c) {
        setConv(c as Conversation);
        setProvider(c.provider as Provider);
        setModelId(c.model_id ?? 'gpt-4o');
        setActiveModel(c.provider as Provider, c.model_id ?? 'gpt-4o');
      } else {
        toast.error('Conversation not found');
        router.push('/');
      }
      if (m) setMessages(m as Message[]);
      setLoaded(true);
    });
  }, [user, id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamTxt]);

  async function send(content: string) {
    if (!content.trim() || streaming || !user) return;
    const userMsg: Message = {
      id: uuid(), conversation_id: id, user_id: user.id,
      role: 'user', content, created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setStreaming(true); setStreamTxt('');

    try {
      abortRef.current = new AbortController();
      const res = await fetch('/api/chat', {
        method: 'POST', signal: abortRef.current.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: id, modelId,
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          stream: true,
        }),
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
            const p = JSON.parse(raw);
            if (p.type === 'chunk') { full += p.content; setStreamTxt(full); }
            if (p.type === 'done') {
              setMessages(prev => [...prev, {
                id: p.messageId, conversation_id: id, user_id: user.id,
                role: 'assistant', content: full, model_id: modelId,
                input_tokens: p.inputTokens, output_tokens: p.outputTokens,
                credits_used: p.creditsUsed, created_at: new Date().toISOString(),
              }]);
              setStreamTxt('');
            }
          } catch {}
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') toast.error(err.message ?? 'Error');
    } finally { setStreaming(false); }
  }

  if (!loaded) return (
    <div className="h-full flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const p = PROVIDERS[provider] ?? PROVIDERS.chatgpt;
  const modelName = modelCache[modelId]?.display_name ?? modelId;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Minimal topbar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-base bg-surface flex-shrink-0">
        <div className="flex items-center gap-2 bg-surface2 border border-base rounded-lg px-3 py-1.5 text-[12px] font-medium text-main">
          <span className="w-5 h-5 rounded-[5px] flex items-center justify-center text-[11px]" style={{ background: p.bgLight }}>{p.logo}</span>
          {p.name}
        </div>
        <div className="flex items-center gap-2 bg-surface2 border border-base rounded-lg px-3 py-1.5 text-[12px] text-main">
          {modelName}
        </div>
        <div className="ml-auto text-[11px] text-muted truncate max-w-[240px] hidden sm:block">
          {conv?.title}
        </div>
        <button onClick={() => router.push('/chat?provider=' + provider + '&model=' + modelId)}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 border border-base rounded-lg text-[11px] text-sub hover:text-brand-500 hover:border-brand-400 bg-surface2 transition-colors">
          <ArrowLeftRight size={12} /> Switch AI
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[780px] mx-auto px-4 py-5 space-y-5">
          {messages.map(msg => {
            if (msg.role === 'user') return (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-[72%]">
                  <div className="bg-brand-500/8 dark:bg-brand-500/15 border border-base rounded-[14px] rounded-br-[4px] px-4 py-2.5 text-[13.5px] text-main leading-relaxed">{msg.content}</div>
                  <div className="text-right text-[10px] text-muted mt-1">{formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })} ✓</div>
                </div>
              </div>
            );
            const mName = msg.model_id ? modelCache[msg.model_id]?.display_name ?? msg.model_id : modelName;
            return (
              <div key={msg.id} className="flex gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 mt-1" style={{ background: p.bgLight }}>{p.logo}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-medium text-sub mb-1.5">{p.name} <span className="font-normal text-muted">({mName})</span></div>
                  <div className="md">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                      code({ node, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        if (!props.inline && match) return (
                          <div className="rounded-xl overflow-hidden my-3">
                            <div className="flex items-center justify-between px-3 py-2 bg-[#1a1a2e]">
                              <span className="text-[11px] text-slate-400 font-mono">{match[1]}</span>
                              <button onClick={() => navigator.clipboard.writeText(String(children))} className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"><Copy size={11} />Copy</button>
                            </div>
                            <SyntaxHighlighter style={oneDark as any} language={match[1]} PreTag="div" customStyle={{ margin: 0, fontSize: '12px', lineHeight: '1.6' }}>
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          </div>
                        );
                        return <code className={className} {...props}>{children}</code>;
                      },
                    }}>{msg.content}</ReactMarkdown>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <button onClick={() => navigator.clipboard.writeText(msg.content)} className="p-1.5 rounded-md text-muted hover:text-main hover:bg-surface3 transition-colors"><Copy size={13} /></button>
                    <button className="p-1.5 rounded-md text-muted hover:text-main hover:bg-surface3 transition-colors"><ThumbsUp size={13} /></button>
                    <button className="p-1.5 rounded-md text-muted hover:text-main hover:bg-surface3 transition-colors"><ThumbsDown size={13} /></button>
                    <span className="ml-auto text-[10px] text-muted">
                      {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                      {msg.credits_used ? ` · ${msg.credits_used} credits` : ''}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {streaming && streamTxt && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 mt-1" style={{ background: p.bgLight }}>{p.logo}</div>
              <div className="flex-1 md text-[13.5px] leading-relaxed cursor-blink">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamTxt}</ReactMarkdown>
              </div>
            </div>
          )}
          {streaming && !streamTxt && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: p.bgLight }}>{p.logo}</div>
              <div className="flex items-center gap-1 mt-2">
                {[0, 1, 2].map(i => <div key={i} className="w-1.5 h-1.5 bg-muted rounded-full animate-dot" style={{ animationDelay: `${i * .2}s` }} />)}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="px-4 pb-3 md:pb-4 flex-shrink-0">
        <div className="max-w-[780px] mx-auto">
          <ConvInput onSend={send} onStop={() => abortRef.current?.abort()} isLoading={streaming} placeholder={`Continue chatting with ${p.name}...`} />
        </div>
      </div>
    </div>
  );
}

function ConvInput({ onSend, onStop, isLoading, placeholder }: { onSend: (s: string) => void; onStop: () => void; isLoading: boolean; placeholder: string }) {
  const [value, setValue] = useState('');
  const canSend = value.trim().length > 0;
  return (
    <div className={cn('bg-surface2 border rounded-xl overflow-hidden transition-colors', canSend ? 'border-brand-400' : 'border-base')}>
      <TextareaAutosize value={value} onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (canSend) { onSend(value); setValue(''); } } }}
        placeholder={placeholder} minRows={1} maxRows={6}
        className="w-full px-4 pt-3 pb-1 bg-transparent text-[13px] text-main placeholder:text-muted resize-none outline-none" />
      <div className="flex items-center px-3 pb-2.5 gap-1">
        <button className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] text-muted hover:text-main hover:bg-surface3 transition-colors"><Paperclip size={12} /><span className="hidden sm:inline">Attach</span></button>
        <button className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] text-muted hover:text-main hover:bg-surface3 transition-colors"><Globe size={12} /><span className="hidden sm:inline">Search</span></button>
        <div className="flex-1" />
        {isLoading
          ? <button onClick={onStop} className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center"><Square size={13} className="text-white" /></button>
          : <button onClick={() => { if (canSend) { onSend(value); setValue(''); } }} disabled={!canSend}
            className={cn('w-8 h-8 rounded-full flex items-center justify-center transition-all', canSend ? 'bg-brand-500 hover:bg-brand-600 text-white' : 'bg-surface3 text-muted cursor-not-allowed')}>
            <Send size={13} />
          </button>
        }
      </div>
    </div>
  );
}
