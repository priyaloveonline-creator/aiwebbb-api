'use client';
import { useEffect, useRef, useState, KeyboardEvent } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useStore } from '@/lib/store';
import { PROVIDERS } from '@/lib/providers';
import { cn } from '@/lib/utils';
import { v4 as uuid } from 'uuid';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import TextareaAutosize from 'react-textarea-autosize';
import {
  ArrowLeftRight, LayoutGrid, Zap, Settings2, ChevronDown,
  Check, Copy, ThumbsUp, ThumbsDown, RefreshCw, Send, Square,
  Paperclip, Globe, Lightbulb, Mic, Plus, X,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Message, Provider, ModelConfig } from '@/types';

// ── Main Chat Page ─────────────────────────────────────────────
export default function ChatPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const { user, profile } = useAuth();
  const { modelCache, activeProvider, activeModelId, setActiveModel } = useStore();

  const initProvider = (sp.get('provider') ?? activeProvider) as Provider;
  const initModel    = sp.get('model') ?? activeModelId;

  const [provider,   setProvider]   = useState<Provider>(initProvider);
  const [modelId,    setModelId]    = useState(initModel);
  const [convId,     setConvId]     = useState<string|null>(null);
  const [messages,   setMessages]   = useState<Message[]>([]);
  const [streaming,  setStreaming]   = useState(false);
  const [streamTxt,  setStreamTxt]  = useState('');
  const [switchOpen, setSwitchOpen] = useState(false);
  const abortRef = useRef<AbortController|null>(null);

  const model = modelCache[modelId];

  async function send(content: string) {
    if (!content.trim() || streaming || !user) return;

    // Plan check
    const planRank: Record<string,number> = { free:0, pro:1, plus:2 };
    if (model && planRank[profile?.plan ?? 'free'] < planRank[model.required_plan]) {
      toast.error(`This model requires ${model.required_plan} plan`);
      router.push('/billing');
      return;
    }

    const userMsg: Message = {
      id:uuid(), conversation_id:convId??'', user_id:user.id,
      role:'user', content, created_at:new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setStreaming(true); setStreamTxt('');

    try {
      abortRef.current = new AbortController();
      const res = await fetch('/api/chat', {
        method:'POST', signal:abortRef.current.signal,
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ conversationId:convId, modelId, messages:[...messages, userMsg].map(m=>({role:m.role,content:m.content})), stream:true }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }

      const reader = res.body!.getReader();
      const dec    = new TextDecoder();
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
            if (p.type==='conversation_id' && !convId) setConvId(p.id);
            if (p.type==='chunk') { full += p.content; setStreamTxt(full); }
            if (p.type==='done') {
              setMessages(prev => [...prev, {
                id:p.messageId, conversation_id:convId??'', user_id:user.id,
                role:'assistant', content:full, model_id:modelId,
                input_tokens:p.inputTokens, output_tokens:p.outputTokens,
                credits_used:p.creditsUsed, created_at:new Date().toISOString(),
              }]);
              setStreamTxt('');
            }
          } catch {}
        }
      }
    } catch(err:any) {
      if (err.name!=='AbortError') toast.error(err.message ?? 'Error');
    } finally { setStreaming(false); }
  }

  const p = PROVIDERS[provider] ?? PROVIDERS.chatgpt;
  const modelName = model?.display_name ?? modelId;

  return (
    <div className="h-full flex overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <ChatTopbar
          provider={provider} modelId={modelId} modelCache={modelCache}
          onSwitchProvider={pid => { setProvider(pid); const def={chatgpt:'gpt-4o',claude:'claude-sonnet-4-6',gemini:'gemini-2.5-flash',deepseek:'deepseek-v3.1',grok:'grok-4-3',openrouter:'openrouter/owl-alpha'}; setModelId(def[pid]??'gpt-4o'); }}
          onSwitchModel={setModelId}
          onSwitchAI={() => setSwitchOpen(o=>!o)}
          onCompare={() => router.push('/compare')}
        />

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[780px] mx-auto px-4 py-5 space-y-5">
            {messages.length === 0 && !streaming && (
              <EmptyState provider={p} modelName={modelName} onPrompt={send} />
            )}
            {messages.map(msg => <Bubble key={msg.id} msg={msg} providerMeta={p} modelCache={modelCache}/>)}
            {streaming && streamTxt && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 mt-1" style={{background:p.bgLight}}>{p.logo}</div>
                <div className="flex-1">
                  <div className="text-[11px] font-medium text-sub mb-1.5">{p.name} <span className="font-normal text-muted">({modelName})</span></div>
                  <div className="md text-[13.5px] leading-relaxed cursor-blink"><MarkdownContent content={streamTxt}/></div>
                </div>
              </div>
            )}
            {streaming && !streamTxt && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{background:p.bgLight}}>{p.logo}</div>
                <div className="flex items-center gap-1 mt-1.5">
                  {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 bg-muted rounded-full animate-dot" style={{animationDelay:`${i*.2}s`}}/>)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        <ChatInput
          onSend={send} onStop={() => abortRef.current?.abort()}
          isLoading={streaming}
          placeholder={p?.id==='openrouter'?'Ask anything (Free AI)...': `Ask anything to ${p.name}...`}
        />
      </div>

      {/* Switch AI panel */}
      {switchOpen && (
        <SwitchPanel
          currentProvider={provider} currentModelId={modelId}
          modelCache={modelCache}
          onSwitch={(pid,mid) => { setProvider(pid); setModelId(mid); setActiveModel(pid,mid); setSwitchOpen(false); toast.success(`Switched to ${modelCache[mid]?.display_name ?? mid}`); }}
          onClose={() => setSwitchOpen(false)}
        />
      )}
    </div>
  );
}

// ── Chat Topbar ────────────────────────────────────────────────
function ChatTopbar({ provider, modelId, modelCache, onSwitchProvider, onSwitchModel, onSwitchAI, onCompare }:
  { provider:Provider; modelId:string; modelCache:Record<string,ModelConfig>; onSwitchProvider:(p:Provider)=>void; onSwitchModel:(m:string)=>void; onSwitchAI:()=>void; onCompare:()=>void }) {
  const [provOpen, setProvOpen] = useState(false);
  const [modOpen,  setModOpen]  = useState(false);
  const pRef = useRef<HTMLDivElement>(null);
  const mRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (pRef.current && !pRef.current.contains(e.target as Node)) setProvOpen(false);
      if (mRef.current && !mRef.current.contains(e.target as Node)) setModOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const p = PROVIDERS[provider] ?? PROVIDERS.chatgpt;
  const providerModels = Object.values(modelCache).filter(m => m.provider === provider && m.is_active).sort((a,b)=>a.sort_order-b.sort_order);
  const currentModel   = modelCache[modelId];

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-base bg-surface flex-shrink-0 flex-wrap">
      {/* Provider */}
      <div className="relative" ref={pRef}>
        <button onClick={() => setProvOpen(o=>!o)}
          className="flex items-center gap-2 bg-surface2 border border-base hover:border-brand-400 rounded-lg px-3 py-1.5 text-[12px] font-medium text-main transition-colors">
          <span className="w-5 h-5 rounded-[5px] flex items-center justify-center text-[11px]" style={{background:p.bgLight}}>{p.logo}</span>
          {p.name} <ChevronDown size={12} className="text-muted"/>
        </button>
        {provOpen && (
          <div className="absolute top-full mt-1.5 left-0 bg-surface border border-base rounded-xl shadow-lg py-1 z-50 min-w-[160px] animate-fade-in">
            {Object.values(PROVIDERS).filter(pr=>pr.id!=='openrouter').map(pr => (
              <button key={pr.id} onClick={() => { onSwitchProvider(pr.id); setProvOpen(false); }}
                className={cn('w-full flex items-center gap-2.5 px-3 py-2 text-[12px] transition-colors',
                  pr.id===provider ? 'text-brand-500 bg-brand-500/5' : 'text-sub hover:bg-surface3 hover:text-main')}>
                <span className="w-4 h-4 rounded text-[10px] flex items-center justify-center" style={{background:pr.bgLight}}>{pr.logo}</span>
                {pr.name}
                {pr.id===provider && <Check size={11} className="ml-auto"/>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Model */}
      <div className="relative" ref={mRef}>
        <button onClick={() => setModOpen(o=>!o)}
          className="flex items-center gap-2 bg-surface2 border border-base hover:border-brand-400 rounded-lg px-3 py-1.5 text-[12px] text-main transition-colors">
          {currentModel?.display_name ?? modelId} <ChevronDown size={12} className="text-muted"/>
        </button>
        {modOpen && (
          <div className="absolute top-full mt-1.5 left-0 bg-surface border border-base rounded-xl shadow-lg py-1 z-50 min-w-[220px] max-h-72 overflow-y-auto animate-fade-in">
            {providerModels.map(m => (
              <button key={m.id} onClick={() => { onSwitchModel(m.id); setModOpen(false); }}
                className={cn('w-full flex items-center gap-2 px-3 py-2 text-left transition-colors',
                  m.id===modelId ? 'text-brand-500 bg-brand-500/5' : 'text-sub hover:bg-surface3 hover:text-main')}>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium truncate">{m.display_name}</div>
                  <div className="text-[10px] text-muted truncate">{m.description}</div>
                </div>
                {m.id===modelId && <Check size={11} className="text-brand-500 flex-shrink-0"/>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 ml-auto">
        {[
          { icon:ArrowLeftRight, label:'Switch AI',     fn:onSwitchAI },
          { icon:LayoutGrid,     label:'Compare',       fn:onCompare },
          { icon:Zap,            label:'Smart Route',   fn:()=>{} },
          { icon:Settings2,      label:'Chat Settings', fn:()=>{} },
        ].map(({ icon:Icon, label, fn }) => (
          <button key={label} onClick={fn}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 border border-base rounded-lg text-[11px] text-sub hover:text-brand-500 hover:border-brand-400 bg-surface2 hover:bg-brand-500/5 transition-colors">
            <Icon size={12}/>{label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Message Bubble ─────────────────────────────────────────────
function Bubble({ msg, providerMeta, modelCache }: { msg:Message; providerMeta:any; modelCache:Record<string,ModelConfig> }) {
  const [copied, setCopied] = useState(false);
  async function copy() { await navigator.clipboard.writeText(msg.content); setCopied(true); setTimeout(()=>setCopied(false),2000); }

  if (msg.role==='user') return (
    <div className="flex justify-end">
      <div className="max-w-[72%]">
        <div className="bg-brand-500/8 dark:bg-brand-500/15 border border-base rounded-[14px] rounded-br-[4px] px-4 py-2.5 text-[13.5px] text-main leading-relaxed">{msg.content}</div>
        <div className="text-right text-[10px] text-muted mt-1">{formatDistanceToNow(new Date(msg.created_at),{addSuffix:true})} ✓</div>
      </div>
    </div>
  );

  const modelName = msg.model_id ? modelCache[msg.model_id]?.display_name ?? msg.model_id : providerMeta.name;

  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 mt-1" style={{background:providerMeta.bgLight}}>{providerMeta.logo}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-medium text-sub mb-1.5">{providerMeta.name} <span className="font-normal text-muted">({modelName})</span></div>
        <div className="md"><MarkdownContent content={msg.content}/></div>
        <div className="flex items-center gap-1 mt-2">
          {[{icon:copied?Check:Copy,fn:copy},{icon:ThumbsUp,fn:()=>{}},{icon:ThumbsDown,fn:()=>{}},{icon:RefreshCw,fn:()=>{}}].map(({icon:Icon,fn},i)=>(
            <button key={i} onClick={fn} className={cn('p-1.5 rounded-md transition-colors', copied&&i===0?'text-green-500':'text-muted hover:text-main hover:bg-surface3')}><Icon size={13}/></button>
          ))}
          <span className="ml-auto text-[10px] text-muted">
            {formatDistanceToNow(new Date(msg.created_at),{addSuffix:true})}
            {msg.credits_used ? ` · ${msg.credits_used} credits` : ''}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────
const STARTERS: Record<string, string[]> = {
  chatgpt:    ['Write a React component','Explain async/await','Draft a professional email','Debug this code'],
  claude:     ['Analyze this code','Write a detailed essay','Review my work','Plan a project'],
  gemini:     ['Analyze an image','Explain a concept','Search for information','Write code'],
  deepseek:   ['Write a Python function','Debug my code','Optimize this algorithm','Explain recursion'],
  grok:       ['Latest AI news','Analyze this idea','Write creative content','Build something cool'],
  openrouter: ['Help me with coding','Write an essay','Analyze my document','Explain a concept'],
};
function EmptyState({ provider, modelName, onPrompt }: { provider:any; modelName:string; onPrompt:(s:string)=>void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-4" style={{background:provider.bgLight}}>{provider.logo}</div>
      <h3 className="text-[15px] font-semibold text-main mb-1">Chat with {provider.name}</h3>
      <p className="text-[12px] text-muted mb-6">Using {modelName}</p>
      <div className="grid grid-cols-2 gap-2 max-w-sm w-full">
        {(STARTERS[provider.id]??STARTERS.chatgpt).map(s=>(
          <button key={s} onClick={()=>onPrompt(s)} className="text-left text-[11px] text-sub bg-surface2 border border-base hover:border-brand-400 hover:text-main rounded-xl px-3 py-2.5 transition-colors">{s}</button>
        ))}
      </div>
    </div>
  );
}

// ── Chat Input ─────────────────────────────────────────────────
function ChatInput({ onSend, onStop, isLoading, placeholder }: { onSend:(s:string)=>void; onStop:()=>void; isLoading:boolean; placeholder:string }) {
  const [value, setValue] = useState('');
  const [webSearch, setWebSearch] = useState(false);
  const [reasoning, setReasoning] = useState(false);
  const canSend = value.trim().length > 0;

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); if(canSend) { onSend(value); setValue(''); } }
  }

  return (
    <div className="px-4 pb-3 md:pb-4 flex-shrink-0">
      <div className="max-w-[780px] mx-auto">
        <div className={cn('bg-surface2 border rounded-xl overflow-hidden transition-colors', canSend ? 'border-brand-400' : 'border-base')}>
          <TextareaAutosize value={value} onChange={e=>setValue(e.target.value)} onKeyDown={handleKey}
            placeholder={placeholder} minRows={1} maxRows={6}
            className="w-full px-4 pt-3 pb-1 bg-transparent text-[13px] text-main placeholder:text-muted resize-none outline-none"/>
          <div className="flex items-center gap-1 px-3 pb-2.5">
            <ToolBtn icon={Paperclip} label="Attach" onClick={()=>{}}/>
            <ToolBtn icon={Globe}     label="Web Search" onClick={()=>setWebSearch(v=>!v)} active={webSearch}/>
            <ToolBtn icon={Lightbulb} label="Reason"     onClick={()=>setReasoning(v=>!v)} active={reasoning}/>
            <ToolBtn icon={Mic}       onClick={()=>{}}/>
            <div className="flex-1"/>
            {isLoading
              ? <button onClick={onStop} className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"><Square size={13} className="text-white"/></button>
              : <button onClick={()=>{if(canSend){onSend(value);setValue('');}}} disabled={!canSend}
                  className={cn('w-8 h-8 rounded-full flex items-center justify-center transition-all',canSend?'bg-brand-500 hover:bg-brand-600 text-white':'bg-surface3 text-muted cursor-not-allowed')}>
                  <Send size={13}/>
                </button>
            }
          </div>
        </div>
        <p className="text-center text-[10px] text-muted mt-1.5">AIWEBBB can make mistakes. Please verify important information.</p>
      </div>
    </div>
  );
}
function ToolBtn({icon:Icon,label,onClick,active}:{icon:any;label?:string;onClick:()=>void;active?:boolean}) {
  return (
    <button onClick={onClick} className={cn('flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] transition-colors',active?'bg-brand-500/10 text-brand-500':'text-muted hover:text-main hover:bg-surface3')}>
      <Icon size={12}/>{label&&<span className="hidden sm:inline">{label}</span>}
    </button>
  );
}

// ── Switch AI Panel ────────────────────────────────────────────
function SwitchPanel({ currentProvider, currentModelId, modelCache, onSwitch, onClose }:
  { currentProvider:Provider; currentModelId:string; modelCache:Record<string,ModelConfig>; onSwitch:(p:Provider,m:string)=>void; onClose:()=>void }) {
  return (
    <div className="w-[220px] border-l border-base bg-surface2 flex flex-col flex-shrink-0 animate-slide-up overflow-y-auto">
      <div className="flex items-center justify-between px-4 py-3 border-b border-base">
        <span className="text-[12px] font-semibold text-main">Switch AI</span>
        <button onClick={onClose} className="text-muted hover:text-main transition-colors"><X size={14}/></button>
      </div>
      <div className="p-3 space-y-2">
        {Object.values(PROVIDERS).filter(p=>p.id!=='openrouter').map(prov => {
          const models = Object.values(modelCache).filter(m=>m.provider===prov.id&&m.is_active).sort((a,b)=>a.sort_order-b.sort_order).slice(0,4);
          const isActive = prov.id === currentProvider;
          return (
            <div key={prov.id} className={cn('border rounded-xl p-2.5 transition-colors',isActive?'border-brand-400 bg-brand-500/5':'border-base')}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-5 rounded text-[11px] flex items-center justify-center" style={{background:prov.bgLight}}>{prov.logo}</span>
                <span className="text-[12px] font-medium text-main">{prov.name}</span>
                {isActive && <Check size={11} className="ml-auto text-brand-500"/>}
              </div>
              <div className="space-y-1">
                {models.map(m=>(
                  <button key={m.id} onClick={()=>onSwitch(prov.id as Provider,m.id)}
                    className={cn('w-full text-left text-[11px] px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between',
                      isActive&&m.id===currentModelId?'bg-brand-500 text-white':'text-sub hover:bg-surface3 hover:text-main')}>
                    <span className="truncate">{m.display_name}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Markdown ───────────────────────────────────────────────────
function MarkdownContent({ content }: { content:string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
      code({ node, className, children, ...props }: any) {
        const match = /language-(\w+)/.exec(className||'');
        if (!props.inline && match) {
          const [copied,setCopied] = useState(false);
          return (
            <div className="rounded-xl overflow-hidden my-3 border border-white/5">
              <div className="flex items-center justify-between px-3 py-2 bg-[#1a1a2e] border-b border-white/5">
                <span className="text-[11px] text-slate-400 font-mono">{match[1]}</span>
                <button onClick={async()=>{await navigator.clipboard.writeText(String(children));setCopied(true);setTimeout(()=>setCopied(false),2000);}}
                  className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1">
                  {copied?<Check size={11}/>:<Copy size={11}/>}{copied?'Copied':'Copy'}
                </button>
              </div>
              <SyntaxHighlighter style={oneDark as any} language={match[1]} PreTag="div"
                customStyle={{margin:0,borderRadius:0,fontSize:'12px',lineHeight:'1.6'}}>
                {String(children).replace(/\n$/,'')}
              </SyntaxHighlighter>
            </div>
          );
        }
        return <code className={className} {...props}>{children}</code>;
      },
    }}>
      {content}
    </ReactMarkdown>
  );
}
