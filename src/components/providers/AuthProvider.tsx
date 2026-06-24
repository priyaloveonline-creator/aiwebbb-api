'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { createBrowserSupabase } from '@/lib/supabase';
import { useStore } from '@/lib/store';
import type { UserProfile } from '@/types';

interface Ctx {
  user: User | null; session: Session | null;
  profile: UserProfile | null; loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}
const AuthCtx = createContext<Ctx>({ user:null, session:null, profile:null, loading:true, signOut:async()=>{}, refreshProfile:async()=>{} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const sb = createBrowserSupabase();
  const setProfile = useStore(s => s.setProfile);
  const setModelCache = useStore(s => s.setModelCache);
  const [user, setUser]       = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setLocalProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchModels() {
    const { data } = await sb.from('model_configs').select('*').eq('is_active', true);
    if (data) {
      const map: Record<string, any> = {};
      data.forEach(m => { map[m.id] = m; });
      setModelCache(map);
    }
  }

  async function fetchProfile(uid: string) {
    const { data } = await sb.from('profiles').select('*').eq('id', uid).single();
    if (data) { setLocalProfile(data as UserProfile); setProfile(data as UserProfile); }
  }

  async function refreshProfile() {
    if (user) await fetchProfile(user.id);
  }

  useEffect(() => {
    fetchModels();
    sb.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s); setUser(s?.user ?? null);
      if (s?.user) fetchProfile(s.user.id);
      setLoading(false);
    });
    const { data: { subscription } } = sb.auth.onAuthStateChange((_e, s) => {
      setSession(s); setUser(s?.user ?? null);
      if (s?.user) fetchProfile(s.user.id);
      else { setLocalProfile(null); setProfile(null); }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function signOut() { await sb.auth.signOut(); setLocalProfile(null); setProfile(null); }

  return (
    <AuthCtx.Provider value={{ user, session, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthCtx.Provider>
  );
}
export const useAuth = () => useContext(AuthCtx);
