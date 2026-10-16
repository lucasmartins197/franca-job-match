import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useMeuPerfil } from "@/hooks/usePerfil";
import { useChatRealtime } from "@/hooks/useChat";
import Logo from "@/components/frela/Logo";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import JobDetail from "./pages/JobDetail";
import JobCandidates from "./pages/JobCandidates";
import Profile from "./pages/Profile";
import ContratacaoDetail from "./pages/ContratacaoDetail";
import Notificacoes from "./pages/Notificacoes";
import CompletarPerfil from "./pages/CompletarPerfil";
import EditarPerfil from "./pages/EditarPerfil";
import PerfilPublico from "./pages/PerfilPublico";
import Conversas from "./pages/Conversas";
import Conversa from "./pages/Conversa";
import Suporte from "./pages/Suporte";
import AdminSuporte from "./pages/AdminSuporte";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 15_000, refetchOnWindowFocus: true } },
});

const Splash = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Logo size="md" className="animate-pulse" />
  </div>
);

/**
 * Rota autenticada. Por padrão também exige PERFIL COMPLETO:
 * sem foto e campos essenciais, o usuário é levado para /completar-perfil.
 */
const ProtectedRoute = ({ children, perfilIncompletoOk = false }: { children: React.ReactNode; perfilIncompletoOk?: boolean }) => {
  const { session, loading } = useAuth();
  const { isLoading: loadingPerfil, completo, data: perfil } = useMeuPerfil();

  if (loading) return <Splash />;
  if (!session) return <Navigate to="/auth" replace />;
  if (perfilIncompletoOk) return <>{children}</>;
  if (loadingPerfil && !perfil) return <Splash />;
  if (!completo) return <Navigate to="/completar-perfil" replace />;
  return <>{children}</>;
};

/** Mantém badges/listas de chat atualizados em tempo real em qualquer tela. */
const ChatRealtime = () => {
  useChatRealtime();
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner theme="light" position="top-center" />
      <BrowserRouter>
        <AuthProvider>
          <ChatRealtime />
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/completar-perfil" element={<ProtectedRoute perfilIncompletoOk><CompletarPerfil /></ProtectedRoute>} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/job/:id" element={<ProtectedRoute><JobDetail /></ProtectedRoute>} />
            <Route path="/job/:id/candidates" element={<ProtectedRoute><JobCandidates /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/perfil/editar" element={<ProtectedRoute><EditarPerfil /></ProtectedRoute>} />
            <Route path="/perfil/:id" element={<ProtectedRoute><PerfilPublico /></ProtectedRoute>} />
            <Route path="/contratacao/:id" element={<ProtectedRoute><ContratacaoDetail /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><Conversas /></ProtectedRoute>} />
            <Route path="/chat/:id" element={<ProtectedRoute><Conversa /></ProtectedRoute>} />
            <Route path="/suporte" element={<ProtectedRoute><Suporte /></ProtectedRoute>} />
            <Route path="/admin/suporte" element={<ProtectedRoute><AdminSuporte /></ProtectedRoute>} />
            <Route path="/admin/suporte/:userId" element={<ProtectedRoute><Suporte /></ProtectedRoute>} />
            <Route path="/notificacoes" element={<ProtectedRoute><Notificacoes /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
