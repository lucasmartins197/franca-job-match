import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ChevronRight, Flag, Headset } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ContratacaoGestao, VagaGestao, useContratacoesGestao, useVagasGestao, useVisaoGeral } from "@/hooks/useGestao";
import { useProfilesByIds } from "@/hooks/useFrela";
import DataTable, { Coluna } from "@/components/gestao/DataTable";
import StatusBadge from "@/components/frela/StatusBadge";
import TaxaStatusBadge from "@/components/taxas/TaxaStatusBadge";
import { Chip, Secao, SelectFiltro, TituloPagina, brl, data } from "@/components/gestao/Pecas";
import { cn } from "@/lib/utils";

const STATUS_VAGA = [
  { id: "todas", label: "Todas" }, { id: "aberta", label: "Abertas" }, { id: "preenchida", label: "Preenchidas" },
  { id: "finalizada", label: "Finalizadas" }, { id: "cancelada", label: "Canceladas" },
];

/** Denúncias chegam pelo suporte (assunto "Quero denunciar um usuário"). */
const useDenuncias = () =>
  useQuery({
    queryKey: ["gestao", "denuncias"],
    queryFn: async () => {
      const { data: msgs, error } = await supabase
        .from("suporte_mensagens")
        .select("user_id, texto, created_at, lida_admin")
        .or("texto.ilike.%denunci%,texto.ilike.%golpe%,texto.ilike.%assédio%,texto.ilike.%fraude%")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) return [];
      return msgs;
    },
  });

const Operacao = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const filtroVaga = params.get("vagas") ?? "todas";
  const [filtroContr, setFiltroContr] = useState("todas");
  const { data: v } = useVisaoGeral();
  const { data: vagas = [], isLoading: lv } = useVagasGestao();
  const { data: contratacoes = [], isLoading: lc } = useContratacoesGestao();
  const { data: denuncias = [] } = useDenuncias();
  const { data: denunciantes = {} } = useProfilesByIds(denuncias.map((d) => d.user_id));

  const contagem = (s: string) => (s === "todas" ? vagas.length : vagas.filter((x) => x.status === s).length);

  const colVagas: Coluna<VagaGestao>[] = [
    { id: "titulo", titulo: "Vaga", valor: (x) => x.titulo, render: (x) => <div className="max-w-[240px]"><p className="font-semibold truncate">{x.titulo}</p><p className="text-xs text-muted-foreground truncate">{x.empresa}</p></div> },
    { id: "data", titulo: "Data", valor: (x) => x.data, render: (x) => data(x.data) },
    { id: "categoria", titulo: "Categoria", valor: (x) => x.categoria },
    { id: "valor", titulo: "Valor", valor: (x) => x.valor, render: (x) => brl(x.valor), alinhar: "right" },
    { id: "cand", titulo: "Candidaturas", valor: (x) => x.candidaturas, alinhar: "right",
      render: (x) => <span>{x.candidaturas}{x.candidaturas_pendentes ? <span className="text-xs text-muted-foreground"> ({x.candidaturas_pendentes} pend.)</span> : null}</span> },
    { id: "profissional", titulo: "Profissional", valor: (x) => x.profissional },
    { id: "status", titulo: "Status", valor: (x) => x.status, render: (x) => <span className="inline-flex items-center gap-1"><StatusBadge status={x.status} />{x.is_demo && <Chip tipo="demo">demo</Chip>}</span> },
  ];

  const colContr: Coluna<ContratacaoGestao>[] = [
    { id: "criada", titulo: "Criada", valor: (c) => c.criada_em, render: (c) => data(c.criada_em) },
    { id: "vaga", titulo: "Vaga", valor: (c) => c.vaga, render: (c) => <span className="block max-w-[200px] truncate">{c.vaga}</span> },
    { id: "empresa", titulo: "Empresa", valor: (c) => c.empresa },
    { id: "profissional", titulo: "Profissional", valor: (c) => c.profissional },
    { id: "valor", titulo: "Valor", valor: (c) => c.valor, render: (c) => brl(c.valor), alinhar: "right" },
    { id: "status", titulo: "Status", valor: (c) => c.status, render: (c) => <StatusBadge status={c.status} /> },
    { id: "taxa", titulo: "Taxa", valor: (c) => c.taxa, render: (c) => <span className="inline-flex items-center gap-1.5">{brl(c.taxa)}<TaxaStatusBadge status={c.status_taxa} /></span>, alinhar: "right" },
  ];

  const atalhos = [
    { titulo: "Divergências de taxa", valor: v?.divergencias ?? 0, icon: AlertTriangle, to: "/admin/taxas", desc: "Valores contestados pelos profissionais", alerta: (v?.divergencias ?? 0) > 0 },
    { titulo: "Chamados de suporte", valor: v?.suporte_abertos ?? 0, icon: Headset, to: "/admin/suporte", desc: "Conversas com mensagem não lida", alerta: (v?.suporte_abertos ?? 0) > 0 },
    { titulo: "Denúncias", valor: denuncias.filter((d) => !d.lida_admin).length, icon: Flag, to: "#denuncias", desc: "Mensagens de suporte com denúncia", alerta: denuncias.some((d) => !d.lida_admin) },
  ];

  return (
    <div className="space-y-5">
      <TituloPagina titulo="Operação" sub="Vagas, contratações e o que precisa de ação da equipe." />

      <div className="grid sm:grid-cols-3 gap-3">
        {atalhos.map((a) => (
          <button key={a.titulo} onClick={() => (a.to.startsWith("#") ? document.querySelector(a.to)?.scrollIntoView({ behavior: "smooth" }) : navigate(a.to))}
            className={cn("text-left rounded-2xl border p-4 bg-card shadow-card flex items-center gap-3", a.alerta ? "border-amber-300" : "border-border")}>
            <span className={cn("w-10 h-10 rounded-xl flex items-center justify-center", a.alerta ? "bg-amber-100 text-amber-800" : "bg-primary/10 text-primary")}><a.icon className="h-5 w-5" /></span>
            <span className="flex-1">
              <span className="block text-2xl font-display font-bold text-foreground leading-none">{a.valor}</span>
              <span className="block text-sm font-semibold text-foreground mt-1">{a.titulo}</span>
              <span className="block text-xs text-muted-foreground">{a.desc}</span>
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      <section>
        <h2 className="font-display font-bold text-foreground mb-3">Vagas</h2>
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3">
          {STATUS_VAGA.map((s) => (
            <button key={s.id} onClick={() => setParams(s.id === "todas" ? {} : { vagas: s.id }, { replace: true })}
              className={cn("shrink-0 h-9 px-3.5 rounded-full text-sm font-medium border",
                filtroVaga === s.id ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border")}>
              {s.label} <span className="opacity-70">({contagem(s.id)})</span>
            </button>
          ))}
        </div>
        <DataTable
          dados={vagas.filter((x) => filtroVaga === "todas" || x.status === filtroVaga)}
          colunas={colVagas}
          colunasExtrasExport={[
            { titulo: "Empresa", valor: (x) => x.empresa }, { titulo: "Função", valor: (x) => x.funcao },
            { titulo: "Horário", valor: (x) => x.horario }, { titulo: "Bairro", valor: (x) => x.bairro },
            { titulo: "Criada em", valor: (x) => x.created_at }, { titulo: "Demo", valor: (x) => x.is_demo },
          ]}
          chave={(x) => x.id}
          nomeExport={`vagas-${filtroVaga}`}
          busca={(x) => `${x.titulo} ${x.empresa} ${x.categoria}`}
          placeholderBusca="Buscar vaga, empresa ou categoria"
          carregando={lv}
          onLinha={(x) => navigate(`/job/${x.id}`)}
          ordemInicial={{ id: "data", dir: "desc" }}
        />
      </section>

      <section>
        <h2 className="font-display font-bold text-foreground mb-3">Contratações</h2>
        <DataTable
          dados={contratacoes.filter((c) => filtroContr === "todas" || c.status === filtroContr)}
          colunas={colContr}
          colunasExtrasExport={[
            { titulo: "Finalizada em", valor: (c) => c.finalizada_em }, { titulo: "Status da taxa", valor: (c) => c.status_taxa },
            { titulo: "Valor contestado (R$)", valor: (c) => c.valor_contestado }, { titulo: "Demo", valor: (c) => c.is_demo },
          ]}
          chave={(c) => c.id}
          nomeExport="contratacoes"
          busca={(c) => `${c.vaga} ${c.empresa} ${c.profissional ?? ""}`}
          placeholderBusca="Buscar vaga, empresa ou profissional"
          carregando={lc}
          onLinha={(c) => navigate(`/contratacao/${c.id}`)}
          ordemInicial={{ id: "criada", dir: "desc" }}
          filtros={<SelectFiltro rotulo="Status da contratação" valor={filtroContr} onChange={setFiltroContr} opcoes={[
            { valor: "todas", label: "Todas" },
            { valor: "em_andamento", label: `Em andamento (${contratacoes.filter((c) => c.status === "em_andamento").length})` },
            { valor: "finalizada", label: `Finalizadas (${contratacoes.filter((c) => c.status === "finalizada").length})` },
          ]} />}
        />
      </section>

      <div id="denuncias">
        <Secao titulo="Moderação (denúncias)">
          <p className="text-xs text-muted-foreground mb-3">
            Denúncias chegam pelo suporte (assunto “Quero denunciar um usuário” ou mensagens com “denúncia”, “golpe”, “fraude”, “assédio”).
            Abra a conversa para responder e, se necessário, retire selos/destaque do usuário denunciado.
          </p>
          {denuncias.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma denúncia por enquanto.</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {denuncias.map((d, i) => (
                <li key={i} className="py-2.5 flex items-start gap-3 cursor-pointer" onClick={() => navigate(`/admin/suporte/${d.user_id}`)}>
                  <Flag className={cn("h-4 w-4 mt-0.5 shrink-0", d.lida_admin ? "text-muted-foreground" : "text-destructive")} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{denunciantes[d.user_id]?.nome ?? "Usuário"} <span className="text-xs text-muted-foreground">· {data(d.created_at)}</span></p>
                    <p className="text-muted-foreground truncate">{d.texto}</p>
                  </div>
                  {!d.lida_admin && <Chip tipo="travada">nova</Chip>}
                </li>
              ))}
            </ul>
          )}
        </Secao>
      </div>
    </div>
  );
};

export default Operacao;
