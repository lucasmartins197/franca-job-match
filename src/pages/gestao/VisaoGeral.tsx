import { useNavigate } from "react-router-dom";
import { AlertTriangle, BadgePercent, Briefcase, Building2, Handshake, Headset, Lock, TrendingUp, Users, Wallet } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useCrescimento, useVisaoGeral } from "@/hooks/useGestao";
import { Secao, Stat, TituloPagina, brl, pct } from "@/components/gestao/Pecas";

// Paleta validada (dataviz/validate_palette, modo claro): teal + âmbar
const COR_PROFISSIONAIS = "#0d9488";
const COR_EMPRESAS = "#d97706";

const semanaLabel = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

const VisaoGeral = () => {
  const navigate = useNavigate();
  const { data: v, isLoading, error } = useVisaoGeral();
  const { data: cresc = [] } = useCrescimento(12);

  if (error) {
    return <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">{(error as Error).message}</div>;
  }

  const mes = new Date().toLocaleDateString("pt-BR", { month: "long" });

  return (
    <div className="space-y-5">
      <TituloPagina titulo="Visão geral" sub={`Números de ${mes}. Receita é projetada — o pagamento real ainda não está ligado.`} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat titulo={`Receita projetada (${mes})`} valor={brl(v?.receita_mes)} icon={Wallet} tom="destaque" carregando={isLoading}
          sub={`MRR ${brl(v?.mrr)} + taxas ${brl(v?.taxas_mes)}`} />
        <Stat titulo="Receita acumulada (projetada)" valor={brl(v?.receita_acumulada)} icon={TrendingUp} carregando={isLoading}
          sub={`Taxas pagas ${brl(v?.taxas_pagas)} · a receber ${brl(v?.taxas_a_receber)}`} />
        <Stat titulo="Contratações no mês" valor={v?.contratacoes_mes ?? 0} icon={Handshake} carregando={isLoading}
          sub={`${v?.contratacoes_total ?? 0} no total`} />
        <Stat titulo={`Movimentado (${mes})`} valor={brl(v?.movimentado_mes)} icon={Briefcase} carregando={isLoading}
          sub={`${brl(v?.movimentado_total)} no total`} />
        <Stat titulo="Empresas ativas" valor={`${v?.empresas_ativas ?? 0} / ${v?.empresas ?? 0}`} icon={Building2} carregando={isLoading}
          sub="ativas nos últimos 30 dias / cadastradas" />
        <Stat titulo="Profissionais ativos" valor={`${v?.profissionais_ativos ?? 0} / ${v?.profissionais ?? 0}`} icon={Users} carregando={isLoading}
          sub="ativos nos últimos 30 dias / cadastrados" />
        <Stat titulo="Conversão (empresa → assinante)" valor={pct(v?.conversao)} icon={BadgePercent} carregando={isLoading}
          sub={`${v?.assinantes_empresa ?? 0} assinantes de ${v?.empresas ?? 0} empresas`} />
        <Stat titulo="MRR (assinaturas ativas)" valor={brl(v?.mrr)} icon={Wallet} carregando={isLoading}
          sub={`${v?.assinantes_empresa ?? 0} empresas × ${brl(v?.precos?.empresa)} · profissional é grátis`} />
      </div>

      {v && (v.empresas_travadas > 0 || v.divergencias > 0 || v.suporte_abertos > 0) && (
        <div className="flex flex-wrap gap-2">
          {v.empresas_travadas > 0 && (
            <button onClick={() => navigate("/gestao/financeiro")} className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-xs font-semibold text-destructive">
              <Lock className="h-3.5 w-3.5" /> {v.empresas_travadas} empresa(s) travada(s) por taxa
            </button>
          )}
          {v.divergencias > 0 && (
            <button onClick={() => navigate("/admin/taxas")} className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900">
              <AlertTriangle className="h-3.5 w-3.5" /> {v.divergencias} divergência(s) de valor
            </button>
          )}
          {v.suporte_abertos > 0 && (
            <button onClick={() => navigate("/admin/suporte")} className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary">
              <Headset className="h-3.5 w-3.5" /> {v.suporte_abertos} chamado(s) de suporte
            </button>
          )}
        </div>
      )}

      <Secao titulo="Cadastros por semana" direita={<span className="text-xs text-muted-foreground">últimas 12 semanas</span>}>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cresc.map((c) => ({ ...c, label: semanaLabel(c.semana) }))} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted))" }}
                contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }}
                labelFormatter={(l) => `Semana de ${l}`}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="profissionais" name="Profissionais" stackId="c" fill={COR_PROFISSIONAIS} stroke="hsl(var(--card))" strokeWidth={2} />
              <Bar dataKey="empresas" name="Empresas" stackId="c" fill={COR_EMPRESAS} stroke="hsl(var(--card))" strokeWidth={2} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-xs font-semibold text-primary">Ver em tabela</summary>
          <table className="w-full mt-2 text-xs">
            <thead className="text-muted-foreground"><tr><th className="text-left py-1">Semana</th><th className="text-right">Profissionais</th><th className="text-right">Empresas</th><th className="text-right">Contratações</th></tr></thead>
            <tbody>
              {cresc.map((c) => (
                <tr key={c.semana} className="border-t border-border">
                  <td className="py-1">{semanaLabel(c.semana)}</td><td className="text-right tabular-nums">{c.profissionais}</td>
                  <td className="text-right tabular-nums">{c.empresas}</td><td className="text-right tabular-nums">{c.contratacoes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </Secao>

      <div className="grid lg:grid-cols-2 gap-3">
        <Secao titulo="Vagas">
          <div className="grid grid-cols-4 gap-2 text-center">
            {([["aberta", "Abertas"], ["preenchida", "Preenchidas"], ["finalizada", "Finalizadas"], ["cancelada", "Canceladas"]] as const).map(([k, l]) => (
              <button key={k} onClick={() => navigate(`/gestao/operacao?vagas=${k}`)} className="rounded-xl bg-muted/60 py-3 hover:bg-muted">
                <p className="text-xl font-display font-bold text-foreground tabular-nums">{v?.vagas?.[k] ?? 0}</p>
                <p className="text-[11px] text-muted-foreground">{l}</p>
              </button>
            ))}
          </div>
        </Secao>
        <Secao titulo="Como os números são calculados">
          <ul className="text-xs text-muted-foreground space-y-1.5">
            <li><b className="text-foreground">Ativo:</b> teve atividade (cadastro, vaga, candidatura ou contratação) nos últimos 30 dias.</li>
            <li><b className="text-foreground">MRR:</b> empresas assinantes × {brl(v?.precos?.empresa)}. Profissionais usam o FreLa de graça e não entram na receita.</li>
            <li><b className="text-foreground">Receita do mês:</b> MRR + taxas de 5% das contratações finalizadas no mês (exceto em divergência).</li>
            <li><b className="text-foreground">Acumulada:</b> todas as taxas geradas + assinaturas registradas em pagamentos.</li>
            <li>ADMs não entram nas contagens. Use o seletor "Incluir dados demo" no topo.</li>
          </ul>
        </Secao>
      </div>
    </div>
  );
};

export default VisaoGeral;
