import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

type UserTipo = "freelancer" | "empresa";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userTipo: UserTipo | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  userTipo: null,
  loading: true,
  signOut: async () => {},
});

const normalizeUserTipo = (value: unknown): UserTipo | null => {
  if (value === "freelancer" || value === "empresa") {
    return value;
  }

  return null;
};

const getFallbackUserTipo = (user: User): UserTipo => {
  return normalizeUserTipo(user.user_metadata?.tipo) ?? "freelancer";
};

const getFallbackUserName = (user: User) => {
  const nome = user.user_metadata?.nome;
  return typeof nome === "string" && nome.trim() ? nome.trim() : null;
};

const ensureUserProfile = async (user: User): Promise<UserTipo> => {
  const fallbackTipo = getFallbackUserTipo(user);

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("tipo")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const existingTipo = normalizeUserTipo(profile?.tipo);
  if (existingTipo) {
    return existingTipo;
  }

  const { data: savedProfile, error: upsertError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email ?? "",
        nome: getFallbackUserName(user),
        tipo: fallbackTipo,
      },
      { onConflict: "id" }
    )
    .select("tipo")
    .single();

  if (upsertError) {
    throw upsertError;
  }

  return normalizeUserTipo(savedProfile?.tipo) ?? fallbackTipo;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userTipo, setUserTipo] = useState<UserTipo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const syncAuthState = async (nextSession: Session | null) => {
      if (!isMounted) return;

      setLoading(true);
      setSession(nextSession);

      const nextUser = nextSession?.user ?? null;
      setUser(nextUser);

      if (!nextUser) {
        setUserTipo(null);
        setLoading(false);
        return;
      }

      try {
        const tipo = await ensureUserProfile(nextUser);
        if (!isMounted) return;
        setUserTipo(tipo);
      } catch (error) {
        console.error("Erro ao sincronizar perfil do usuário", error);
        if (!isMounted) return;
        setUserTipo(getFallbackUserTipo(nextUser));
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void syncAuthState(nextSession);
    });

    void supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      void syncAuthState(initialSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Erro ao sair da conta", error);
      setLoading(false);
      return;
    }

    setSession(null);
    setUser(null);
    setUserTipo(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ session, user, userTipo, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
