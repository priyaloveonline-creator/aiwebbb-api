'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Trash2, Archive, Pin, MoreHorizontal } from 'lucide-react';
import { createBrowserSupabase } from '@/lib/supabase';
import { useAuth } from '@/components/providers/AuthProvider';
import { PROVIDERS } from '@/lib/providers';
import { formatDistanceToNow } from 'date-fns';
import type { Conversation } from '@/types';
import toast from 'react-hot-toast';

export default function HistoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [chats, setChats]   = useState<Conversation[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    createBrowserSupabase()
      .from('conversations').select('*').eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .then(({ data }) => { if (data) setChats(data as Conversation[]); setLoading(false); });
  }, [user]);

  const filtered = chats.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));

  async function deleteConv(id: string) {
    const sb = createBrowserSupabase();
    await sb.from('conversations').delete().eq('id', id);
    setChats(prev => prev.filter(c => c.id !== id));
    toast.success('Deleted');
  }

  return (
    <div className="h-full overflow-y-auto p-5">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-[18px] font-semibold text-main mb-4">Chat History</h1>
        <div className="relative mb-4">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations..."
            className="w-full bg-surface2 border border-base focus:border-brand-400 rounded-xl pl-9 pr-4 py-2.5 text-[13px] text-main placeholder:text-muted outline-none transition-colors" />
        </div>

        {loading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-surface2 border border-base rounded-xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted text-[13px]">
            {search ? `No chats matching "${search}"` : 'No conversations yet.'}
          </div>
        ) : (
          <div className="bg-surface border border-base rounded-xl overflow-hidden">
            {filtered.map(chat => {
              const p = PROVIDERS[chat.provider as string] ?? PROVIDERS.chatgpt;
              return (
                <button key={chat.id} onClick={() => router.push(`/chat/${chat.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-3 border-b border-base last:border-0 hover:bg-surface2 transition-colors text-left group">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ background: p?.bgLight }}>{p?.logo}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] font-medium text-main truncate">{chat.title}</div>
                    <div className="text-[10.5px] text-muted">
                      {p?.name} · {chat.message_count} messages · {formatDistanceToNow(new Date(chat.updated_at), { addSuffix: true })}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={e => { e.stopPropagation(); }} className="p-1.5 rounded-md text-muted hover:text-main hover:bg-surface3 transition-colors"><Pin size={12} /></button>
                    <button onClick={e => { e.stopPropagation(); }} className="p-1.5 rounded-md text-muted hover:text-main hover:bg-surface3 transition-colors"><Archive size={12} /></button>
                    <button onClick={e => { e.stopPropagation(); deleteConv(chat.id); }} className="p-1.5 rounded-md text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 size={12} /></button>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
