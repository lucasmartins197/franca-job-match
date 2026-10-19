import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Award, Info } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  IndicacaoGestao, ProfissionalGestao, useEmpresasGestao, useIndicacoesGestao, useLiberarRecompensa, useProfissionaisGestao, usePromover,
} from "@/hooks/useGestao";
import DataTable, { Coluna } from "@/components/gestao/DataTable";
import { Chip, SelectFiltro, TituloPagina, data } from "@/components/gestao/Pecas";

interface LinhaPromo {
  id: string; nome: string; email: string; tipo: "empresa" | "freelancer";
  verificado: boolean; destaque: boolean; selos: string[]; avaliacao: number; total: number; trabalhos: number; is_demo: boolean;
}

/** Interruptor que não abre o detalhe da linha ao ser clicado. */
const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
  <span onClick={(e) => e.stopPropagation()} className="inline-flex">
    <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
  </span>
);

const Crescimento = () => {
  const navigate = useNavigate();
  const { data: empresas = [], isLoading: l1 } = useEmpresasGestao();
  const { data: pros = [], isLoading: l2 } = useProfissionaisGestao();
  const { data: indicacoes = [], isLoading: l3 } = useIndicacoesGestao();
  const promover = usePromover();
  const liberar = useLiberarRecompensa();
  const [tipo, setTipo] = useState("todos");
  const [metaFiltro, setMetaFiltro] = useState("todos");

  const linhas: LinhaPromo[] = useMemo(() => [
    ...empresas.map((e) => ({ id: e.id, nome: e.nome_empresa, email: e.email, tipo: "empresa" as const, verificado: e.verificado, destaque: e.destaque,
      selos: e.selos_extras ?? [], avaliacao: e.avaliacao_media, total: e.total_avaliacoes, trabalhos: e.contratacoes_finalizadas, is_demo: e.is_demo })),
    ...pros.map((p) => ({ id: p.id, nome: p.nome ?? "—", email: p.email, tipo: "freelancer" as const, verificado: p.verificado, destaque: p.destaque,
      selos: p.selos_extras ?? [], avaliacao: p.avaliacao_media, total: p.total_avaliacoes, trabalhos: p.trabalhos, is_demo: p.is_demo })),
  ], [empresas, pros]);

  const alterar = async (l: LinhaPromo, args: { verificado?: boolean; destaque?: boolean; selos?: string[] }, msg: string) => {
    try {
      await promover.mutateAsync({ id: l.id, ...args });
      toast.success(`${msg} — ${l.nome}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    }
  };

  const colPromo: Coluna<LinhaPromo>[] = [
    { id: "nome", titulo: "Usuário", valor: (l) => l.nome, render: (l) => <div><p className="font-semibold">{l.nome} {l.is_demo && <Chip tipo="demo">demo</Chip>}</p><p className="text-xs text-muted-foreground">{l.email}</p></div> },
    { id: "tipo", titulo: "Tipo", valor: (l) => (l.tipo === "empresa" ? "Empresa" : "Profissional") },
    { id: "nota", titulo: "Nota", valor: (l) => l.avaliacao, render: (l) => (l.total ? `${Number(l.avaliacao).toFixed(1)} (${l.total})` : "—"), alinhar: "right" },
    { id: "trabalhos", titulo: "Trabalhos", valor: (l) => l.trabalhos, alinhar: "right" },
    { id: "verificado", titulo: "Verificado", valor: (l) => l.verificado, alinhar: "center",
      render: (l) => <Toggle label="Verificado" checked={l.verificado} onChange={(v) => alterar(l, { verificado: v }, v ? "Verificado" : "Selo removido")} /> },
    { id: "destaque", titulo: "Destaque", valor: (l) => l.destaque, alinhar: "center",
      render: (l) => <Toggle label="Destaque" checked={l.destaque} onChange={(v) => alterar(l, { destaque: v }, v ? "Em destaque" : "Destaque removido")} /> },
    { id: "indicado", titulo: "Indicado pela FreLa", valor: (l) => l.selos.includes("indicado"), alinhar: "center",
      render: (l) => <Toggle label="Indicado" checked={l.selos.includes("indicado")}
        onChange={(v) => alterar(l, { selos: v ? [...l.selos.filter((s) => s !== "indicado"), "indicado"] : l.selos.filter((s) => s !== "indicado") }, v ? "Selo Indicado" : "Selo removido")} /> },
  ];

  const colIndicacoes: Coluna<IndicacaoGestao>[] = [
    { id: "indicado", titulo: "Indicado", valor: (i) => i.indicado_nome, render: (i) => <div><p className="font-semibold">{i.indicado_nome || "—"}</p><p className="text-xs text-muted-foreground">{i.indicado_email}</p></div> },
    { id: "tipo", titulo: "Tipo", valor: (i) => (i.indicado_tipo === "empresa" ? "Empresa" : "Profissional") },
    { id: "indicador", titulo: "Indicado por", valor: (i) => i.indicador_nome, render: (i) => <span>{i.indicador_nome} <span className="text-xs text-muted-foreground">({i.indicador_codigo})</span></span> },
    { id: "cadastro", titulo: "Cadastro", valor: (i) => i.cadastrado_em, render: (i) => data(i.cadastrado_em) },
    { id: "perfil", titulo: "Perfil completo", valor: (i) => i.perfil_completo, render: (i) => <Chip tipo={i.perfil_completo ? "ativo" : "inativo"}>{i.perfil_completo ? "Sim" : "Não"}</Chip> },
    { id: "pagou", titulo: "Pagou", valor: (i) => i.pagou, render: (i) => <Chip tipo={i.pagou ? "assinante" : "inativo"}>{i.pagou ? "Sim" : "Ainda não"}</Chip> },
    { id: "recompensa", titulo: "Recompensa liberada", valor: (i) => i.recompensa_liberada, alinhar: "center",
      render: (i) => <Toggle label="Recompensa liberada" checked={i.recompensa_liberada} onChange={async (v) => {
        try { await liberar.mutateAsync({ indicadoId: i.indicado_id, liberada: v }); toast.success(v ? "Recompensa liberada" : "Recompensa desfeita"); }
        catch (err) { toast.error(err instanceof Error ? err.message : "Erro"); }
      }} /> },
  ];

  const prosMeta = pros.filter((p) => {
    const total = p.trabalhos + p.meta_ajuste_trabalhos;
    return metaFiltro === "todos" || (metaFiltro === "atingida" && total >= p.meta_trabalhos) ||
      (metaFiltro === "perto" && total < p.meta_trabalhos && total >= p.meta_trabalhos * 0.6) || (metaFiltro === "ajustados" && p.meta_ajuste_trabalhos !== 0);
  });
  const colMetas: Coluna<ProfissionalGestao>[] = [
    { id: "nome", titulo: "Profissional", valor: (p) => p.nome, render: (p) => <span className="font-semibold">{p.nome}</span> },
    { id: "progresso", titulo: "Meta “Experiente”", valor: (p) => (p.trabalhos + p.meta_ajuste_trabalhos) / p.meta_trabalhos,
      render: (p) => {
        const total = p.trabalhos + p.meta_ajuste_trabalhos;
        return (
          <div className="w-44">
            <div className="flex justify-between text-xs mb-1">
              <span>{total}/{p.meta_trabalhos}</span>
              {total >= p.meta_trabalhos && <span className="inline-flex items-center gap-0.5 text-emerald-700"><Award className="h-3 w-3" /> atingida</span>}
            </div>
            <Progress value={Math.min(100, (total / p.meta_trabalhos) * 100)} className="h-1.5" />
          </div>
        );
      } },
    { id: "trabalhos", titulo: "Pelo FreLa", valor: (p) => p.trabalhos, alinhar: "right" },
    { id: "ajuste", titulo: "Ajuste manual", valor: (p) => p.meta_ajuste_trabalhos, alinhar: "right", render: (p) => (p.meta_ajuste_trabalhos ? `+${p.meta_ajuste_trabalhos}` : "—") },
    { id: "nota", titulo: "Nota", valor: (p) => p.avaliacao_media, render: (p) => (p.total_avaliacoes ? Number(p.avaliacao_media).toFixed(1) : "—"), alinhar: "right" },
  ];

  return (
    <div>
      <TituloPagina titulo="Crescimento" sub="Promova usuários, acompanhe indicações e o progresso das metas." />
      <Tabs defaultValue="promover">
        <TabsList className="mb-4">
          <TabsTrigger value="promover">Promover</TabsTrigger>
          <TabsTrigger value="indicacoes">Indicações ({indicacoes.length})</TabsTrigger>
          <TabsTrigger value="metas">Metas</TabsTrigger>
        </TabsList>

        <TabsContent value="promover">
          <DataTable
            dados={linhas.filter((l) => tipo === "todos" || l.tipo === tipo)}
            colunas={colPromo}
            chave={(l) => l.id}
            nomeExport="selos-e-destaques"
            busca={(l) => `${l.nome} ${l.email}`}
            carregando={l1 || l2}
            onLinha={(l) => navigate(`/gestao/usuario/${l.id}`)}
            ordemInicial={{ id: "nota", dir: "desc" }}
            filtros={<SelectFiltro rotulo="Tipo" valor={tipo} onChange={setTipo} opcoes={[
              { valor: "todos", label: "Empresas e profissionais" }, { valor: "empresa", label: "Empresas" }, { valor: "freelancer", label: "Profissionais" },
            ]} />}
          />
        </TabsContent>

        <TabsContent value="indicacoes" className="space-y-3">
          <p className="text-xs text-muted-foreground flex gap-1.5 rounded-xl border border-border bg-card p-3">
            <Info className="h-4 w-4 shrink-0 text-primary" />
            <span>
              Cada usuário tem um código de indicação. O cadastro já registra quem indicou quando o signUp envia o código
              (campo <code className="font-mono">indicacao</code>) — falta só a tela “Indique e Ganhe” no app para os usuários compartilharem.
            </span>
          </p>
          <DataTable
            dados={indicacoes}
            colunas={colIndicacoes}
            colunasExtrasExport={[{ titulo: "Recompensa liberada em", valor: (i) => i.recompensa_em }]}
            chave={(i) => i.indicado_id}
            nomeExport="indicacoes"
            busca={(i) => `${i.indicado_nome ?? ""} ${i.indicado_email} ${i.indicador_nome ?? ""} ${i.indicador_codigo ?? ""}`}
            placeholderBusca="Buscar indicado, indicador ou código"
            carregando={l3}
            onLinha={(i) => navigate(`/gestao/usuario/${i.indicado_id}`)}
            ordemInicial={{ id: "cadastro", dir: "desc" }}
            vazio="Nenhuma indicação registrada ainda"
          />
        </TabsContent>

        <TabsContent value="metas">
          <DataTable
            dados={prosMeta}
            colunas={colMetas}
            chave={(p) => p.id}
            nomeExport="metas-profissionais"
            busca={(p) => `${p.nome ?? ""} ${p.email}`}
            carregando={l2}
            onLinha={(p) => navigate(`/gestao/usuario/${p.id}`)}
            ordemInicial={{ id: "progresso", dir: "desc" }}
            filtros={<SelectFiltro rotulo="Meta" valor={metaFiltro} onChange={setMetaFiltro} opcoes={[
              { valor: "todos", label: "Todos" }, { valor: "perto", label: "Perto da meta (≥ 60%)" },
              { valor: "atingida", label: "Meta atingida" }, { valor: "ajustados", label: "Com ajuste manual" },
            ]} />}
          />
          <p className="text-xs text-muted-foreground mt-2">Para ajustar a meta de alguém, abra o usuário (clique na linha) e use “Salvar ajuste”.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Crescimento;
