import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

type UserTipo = "freelancer" | "empresa";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userTipo: UserTipo | null;
  roles: string[];
  loading: boolean;
  signOut: () => Promise<void>;
  refreshAuthState: () => Promise<{ session: Session | null; user: User | null; userTipo: UserTipo | null }>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  userTipo: null,
  roles: [],
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
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshAuthState = useCallback(async () => {
    try {
      const {
        data: { session: nextSession },
      } = await supabase.auth.getSession();

      const nextUser = nextSession?.user ?? null;
      let resolvedTipo: UserTipo | null = null;
      let resolvedRoles: string[] = [];

      if (nextUser) {
        try {
          resolvedTipo = await ensureUserProfile(nextUser);
        } catch (error) {
          console.error("Erro ao sincronizar perfil do usuário", error);
          resolvedTipo = getUserTipoFromMetadata(nextUser) ?? "freelancer";
        }

        try {
          const { data: rolesData, error: rolesError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", nextUser.id);

          if (!rolesError && rolesData) {
            resolvedRoles = rolesData.map((r) => r.role);
          }
        } catch (rolesError) {
          console.error("Erro ao buscar roles", rolesError);
        }
      }

      setSession(nextSession);
      setUser(nextUser);
      setUserTipo(resolvedTipo);
      setRoles(resolvedRoles);
      setLoading(false);

      return { session: nextSession, user: nextUser, userTipo: resolvedTipo };
    } catch (error) {
      console.error("Erro ao buscar sessão", error);
      setSession(null);
      setUser(null);
      setUserTipo(null);
      setRoles([]);
      setLoading(false);
      return { session: null, user: null, userTipo: null };
    }
  }, []);

  // Safety timeout: force loading to false after 3 seconds
  useEffect(() => {
    if (!loading) return;
    const timeoutId = setTimeout(() => {
      console.warn("Auth loading timed out after 3s, forcing isLoading to false.");
      setLoading(false);
    }, 3000);
    return () => clearTimeout(timeoutId);
  }, [loading]);

  useEffect(() => {
    let isMounted = true;

    const applySession = (nextSession: Session | null) => {
      if (!isMounted) return;
      const nextUser = nextSession?.user ?? null;
      setSession(nextSession);
      setUser(nextUser);
      setUserTipo(getUserTipoFromMetadata(nextUser));
      setRoles([]);
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
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Erro ao sair da conta", error);
      }
    } catch (error) {
      console.error("Erro inesperado ao sair", error);
    } finally {
      setSession(null);
      setUser(null);
      setUserTipo(null);
      setRoles([]);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, userTipo, roles, loading, signOut, refreshAuthState }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
