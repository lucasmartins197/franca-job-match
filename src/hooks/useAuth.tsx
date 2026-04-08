import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

type UserTipo = "freelancer" | "empresa";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userTipo: UserTipo | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshAuthState: () => Promise<{ session: Session | null; user: User | null; userTipo: UserTipo | null }>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  userTipo: null,
  loading: true,
  signOut: async () => {},
  refreshAuthState: async () => ({ session: null, user: null, userTipo: null }),
});

const normalizeUserTipo = (value: unknown): UserTipo | null => {
  if (value === "freelancer" || value === "empresa") {
    return value;
  }

  return null;
};

const getUserTipoFromMetadata = (user: User | null) => {
  return normalizeUserTipo(user?.user_metadata?.tipo);
};

const getFallbackUserName = (user: User) => {
  const nome = user.user_metadata?.nome;
  return typeof nome === "string" && nome.trim() ? nome.trim() : null;
};

const ensureUserProfile = async (user: User): Promise<UserTipo> => {
  const metadataTipo = getUserTipoFromMetadata(user);

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("tipo")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const profileTipo = normalizeUserTipo(profile?.tipo);
  if (profileTipo) {
    return profileTipo;
  }

  const fallbackTipo = metadataTipo ?? "freelancer";

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

  const refreshAuthState = useCallback(async () => {
    const {
      data: { session: nextSession },
    } = await supabase.auth.getSession();

    const nextUser = nextSession?.user ?? null;
    const metadataTipo = getUserTipoFromMetadata(nextUser);
    let resolvedTipo = metadataTipo;

    if (nextUser) {
      try {
        resolvedTipo = await ensureUserProfile(nextUser);
      } catch (error) {
        console.error("Erro ao sincronizar perfil do usuário", error);
        resolvedTipo = metadataTipo ?? "freelancer";
      }
    }

    setSession(nextSession);
    setUser(nextUser);
    setUserTipo(resolvedTipo ?? null);
    setLoading(false);

    return {
      session: nextSession,
      user: nextUser,
      userTipo: resolvedTipo ?? null,
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const applySession = (nextSession: Session | null) => {
      if (!isMounted) return;

      const nextUser = nextSession?.user ?? null;
      setSession(nextSession);
      setUser(nextUser);
      setUserTipo(getUserTipoFromMetadata(nextUser));
      setLoading(false);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      applySession(nextSession);
      if (nextSession?.user) {
        void refreshAuthState();
      }
    });

    void refreshAuthState();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [refreshAuthState]);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Erro ao sair da conta", error);
      return;
    }

    setSession(null);
    setUser(null);
    setUserTipo(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, userTipo, loading, signOut, refreshAuthState }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
