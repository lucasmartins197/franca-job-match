import { useNavigate } from "react-router-dom";
import { ChevronRight, Crown, Edit2, Headset, Loader2, LogOut, LayoutDashboard, Receipt, Scale, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useHistoricoProfissional, useMeuPerfil } from "@/hooks/usePerfil";
import MetasCard from "@/components/perfil/MetasCard";
import ForcaCurriculo from "@/components/perfil/ForcaCurriculo";
import IndiqueGanhe from "@/components/perfil/IndiqueGanhe";
import ExcluirConta from "@/components/perfil/ExcluirConta";
import ProfileView from "@/components/perfil/ProfileView";
import { useSuporteNaoLidas } from "@/hooks/useSuporte";

/** Meu perfil (aba Perfil do profissional e /profile da empresa). */
const ProfileTab = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: perfil, isLoading } = useMeuPerfil();
  const suporteNaoLidas = useSuporteNaoLidas();
  const { data: historico } = useHistoricoProfissional(user?.id, perfil?.profile.tipo === "freelancer");

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (isLoading || !perfil) {
    return <div className="flex justify-center pt-24"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="pb-24 pt-6 px-5 space-y-4">
      {perfil.profile.is_admin && (
        <button onClick={() => navigate("/gestao")}
          className="w-full flex items-center gap-3 p-4 rounded-2xl bg-primary text-primary-foreground text-left shadow-card">
          <span className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0"><LayoutDashboard className="h-5 w-5" /></span>
          <span className="flex-1 min-w-0">
            <span className="block font-display font-bold">Painel de Gestão</span>
            <span className="block text-xs opacity-90">Números, usuários, financeiro e exportação</span>
          </span>
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
      {perfil.profile.tipo === "freelancer" && <MetasCard profile={perfil.profile} trabalhos={historico?.length ?? 0} />}
      {perfil.profile.tipo === "freelancer" && <ForcaCurriculo perfil={perfil} />}
      {perfil.profile.tipo === "empresa" && (
        <IndiqueGanhe codigo={perfil.profile.codigo_indicacao} nomeEmpresa={perfil.empresa?.nome_empresa || perfil.profile.nome || "Minha empresa"} />
      )}
      <ProfileView perfil={perfil} mostrarContato />
      <Button onClick={() => navigate("/perfil/editar")} className="w-full h-12 rounded-xl font-semibold">
        <Edit2 className="h-4 w-4 mr-2" /> Editar perfil
      </Button>

      <nav className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden shadow-card">
        {[
          { to: "/taxas", icon: Receipt, titulo: "Minhas taxas", sub: "Saldo da taxa de 5% e histórico", badge: 0, mostrar: perfil.profile.tipo === "empresa" },
          { to: "/planos", icon: Crown, titulo: "Meu plano", sub: perfil.profile.subscription_status === "active" ? "Assinatura ativa" : "Lançamento gratuito · ver planos", badge: 0, mostrar: perfil.profile.tipo === "empresa" },
          { to: "/suporte", icon: Headset, titulo: "Falar com a equipe", sub: "Dúvidas, problemas ou sugestões", badge: perfil.profile.is_admin ? 0 : suporteNaoLidas, mostrar: true },
          { to: "/admin/taxas", icon: Scale, titulo: "Taxas e divergências (ADM)", sub: "Resolver valores contestados e registrar pagamentos", badge: 0, mostrar: !!perfil.profile.is_admin },
          { to: "/admin/suporte", icon: ShieldCheck, titulo: "Atendimento (ADM)", sub: "Responder chamados de suporte", badge: suporteNaoLidas, mostrar: !!perfil.profile.is_admin },
        ].filter((i) => i.mostrar).map((item) => (
          <button key={item.to} onClick={() => navigate(item.to)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50">
            <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0"><item.icon className="h-5 w-5" /></span>
            <span className="flex-1 min-w-0">
              <span className="block font-semibold text-foreground">{item.titulo}</span>
              <span className="block text-xs text-muted-foreground">{item.sub}</span>
            </span>
            {item.badge > 0 && <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-destructive text-white text-[11px] font-bold flex items-center justify-center">{item.badge}</span>}
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </nav>

      <p className="text-xs text-center text-muted-foreground">{user?.email}</p>
      <Button onClick={handleSignOut} variant="outline"
        className="w-full h-12 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10">
        <LogOut className="h-4 w-4 mr-2" /> Sair da conta
      </Button>
      <p className="text-xs text-center text-muted-foreground space-x-3">
        <button onClick={() => navigate("/termos")} className="underline decoration-dotted">Termos de Uso</button>
        <button onClick={() => navigate("/privacidade")} className="underline decoration-dotted">Privacidade</button>
      </p>
      <ExcluirConta />
    </div>
  );
};

export default ProfileTab;
