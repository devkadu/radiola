"use client";

import { createClient } from "@/shared/lib/supabase-browser";
import { User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { createContext,useContext,useEffect,useState } from "react";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signOutNotice, setSignOutNotice] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    let authEventReceived = false;
    let identity: string | null = null;
    const updateUser = (next: User | null) => {
      if (!active) return;
      if (identity !== (next?.id ?? null)) {
        // clear() also destroys in-flight queries before another account is shown.
        queryClient.clear();
        identity = next?.id ?? null;
      }
      setUser(next);
      if (next) setSignOutNotice(null);
      setLoading(false);
    };
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (!authEventReceived) updateUser(error ? null : user);
    }).catch(() => { if (!authEventReceived) updateUser(null); });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      authEventReceived = true;
      updateUser(session?.user ?? null);
    });

    return () => { active = false; subscription.unsubscribe(); };
  }, [queryClient]);

  const signOut = async () => {
    setSignOutNotice(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      // The SDK can clear the local session even if global revocation fails.
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || session) throw error;
      setSignOutNotice("Você saiu deste dispositivo. Não foi possível confirmar a saída nos demais.");
    }
    queryClient.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
      {signOutNotice && (
        <div role="alert" className="fixed bottom-24 left-4 right-4 z-50 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 text-sm shadow-lg lg:bottom-6 lg:left-auto lg:max-w-sm">
          <p>{signOutNotice}</p>
          <button type="button" onClick={() => setSignOutNotice(null)} className="mt-2 text-[var(--yellow)]">Fechar</button>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
