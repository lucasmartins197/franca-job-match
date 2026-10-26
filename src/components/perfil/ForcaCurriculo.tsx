import { useNavigate } from "react-router-dom";
import { CheckCircle2, ChevronRight, Circle, FileText } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { PerfilCompleto, parseDisponibilidade, usePortfolio } from "@/hooks/usePerfil";
import { cn } from "@/lib/utils";

/**
 * Força do currículo do profissional. Os itens obrigatórios já são exigidos no
 * cadastro (e pelo selo Verificado); os extras aumentam a visibilidade.
 */
const ForcaCurriculo = ({ perfil }: { perfil: PerfilCompleto }) => {
  const navigate = useNavigate();
  const { data: fotos = [] } = usePortfolio(perfil.profile.id);
  const d = perfil.profissional;
  const disp = parseDisponibilidade(d?.disponibilidade);

  const itens = [
    { ok: !!perfil.profile.foto_url && !!perfil.profile.telefone, texto: "Foto e contato" },
    { ok: (d?.profissoes?.length ?? 0) > 0 && !!d?.bio?.trim(), texto: "Profissões e sobre você" },
    { ok: disp.dias.length > 0, texto: "Dias disponíveis (para receber avisos de vagas)" },
    { ok: (d?.experiencia?.trim().length ?? 0) >= 60, texto: "Experiência detalhada (onde e por quanto tempo)" },
    { ok: disp.periodos.length > 0, texto: "Períodos do dia" },
    { ok: fotos.length >= 3, texto: "3 fotos ou mais no portfólio" },
    { ok: !!d?.instagram || !!d?.linkedin, texto: "Instagram ou LinkedIn" },
  ];
  const feitos = itens.filter((i) => i.ok).length;
  const pct = Math.round((feitos / itens.length) * 100);
  if (pct === 100) return null;

  return (
    <button onClick={() => navigate("/perfil/editar")} className="w-full text-left bg-card border border-border rounded-2xl p-4 shadow-card">
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0"><FileText className="h-5 w-5" /></span>
        <span className="flex-1 min-w-0">
          <span className="block font-display font-bold text-foreground">Seu currículo está {pct}% forte</span>
          <span className="block text-xs text-muted-foreground">Currículos completos aparecem mais para as empresas e podem ganhar o selo Verificado.</span>
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </div>
      <Progress value={pct} className="h-2 mt-3" />
      <ul className="mt-3 space-y-1.5">
        {itens.map((i) => (
          <li key={i.texto} className={cn("flex items-center gap-2 text-xs", i.ok ? "text-muted-foreground line-through" : "text-foreground")}>
            {i.ok ? <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" /> : <Circle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
            {i.texto}
          </li>
        ))}
      </ul>
    </button>
  );
};

export default ForcaCurriculo;
