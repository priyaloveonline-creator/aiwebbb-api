'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile, Conversation, Message, Provider, ModelConfig } from '@/types';

interface AppState {
  // Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;

  // User
  profile: UserProfile | null;
  setProfile: (p: UserProfile | null) => void;

  // Models cache (loaded once from DB)
  modelCache: Record<string, ModelConfig>;
  setModelCache: (m: Record<string, ModelConfig>) => void;

  // Active provider / model
  activeProvider: Provider;
  activeModelId: string;
  setActiveModel: (provider: Provider, modelId: string) => void;

  // Conversations
  conversations: Conversation[];
  setConversations: (c: Conversation[]) => void;
  upsertConversation: (c: Conversation) => void;
  removeConversation: (id: string) => void;

  // Messages per conversation
  messages: Record<string, Message[]>;
  setMessages: (convId: string, msgs: Message[]) => void;
  appendMessage: (convId: string, msg: Message) => void;

  // Streaming
  isStreaming: boolean;
  streamContent: string;
  setIsStreaming: (v: boolean) => void;
  appendStream: (chunk: string) => void;
  clearStream: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'light',
      toggleTheme: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),

      sidebarOpen: true,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

      profile: null,
      setProfile: (p) => set({ profile: p }),

      modelCache: {},
      setModelCache: (m) => set({ modelCache: m }),

      activeProvider: 'chatgpt',
      activeModelId: 'gpt-4o',
      setActiveModel: (provider, modelId) => set({ activeProvider: provider, activeModelId: modelId }),

      conversations: [],
      setConversations: (conversations) => set({ conversations }),
      upsertConversation: (c) => set((s) => {
        const idx = s.conversations.findIndex(x => x.id === c.id);
        if (idx >= 0) {
          const next = [...s.conversations];
          next[idx] = c;
          return { conversations: next };
        }
        return { conversations: [c, ...s.conversations] };
      }),
      removeConversation: (id) => set((s) => ({ conversations: s.conversations.filter(c => c.id !== id) })),

      messages: {},
      setMessages: (convId, msgs) => set((s) => ({ messages: { ...s.messages, [convId]: msgs } })),
      appendMessage: (convId, msg) => set((s) => ({
        messages: { ...s.messages, [convId]: [...(s.messages[convId] ?? []), msg] },
      })),

      isStreaming: false,
      streamContent: '',
      setIsStreaming: (v) => set({ isStreaming: v }),
      appendStream: (chunk) => set((s) => ({ streamContent: s.streamContent + chunk })),
      clearStream: () => set({ isStreaming: false, streamContent: '' }),
    }),
    {
      name: 'aiwebbb-v2',
      partialize: (s) => ({ theme: s.theme, sidebarOpen: s.sidebarOpen, activeProvider: s.activeProvider, activeModelId: s.activeModelId }),
    }
  )
);
