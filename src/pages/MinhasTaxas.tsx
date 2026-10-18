import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Info, Loader2, Lock, QrCode, Receipt, Rocket } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { formatBRL, formatDate } from "@/hooks/useFrela";
import { useHistoricoTaxas, useResumoTaxas } from "@/hooks/useTaxas";
import { STATUS_TAXA, TAXA_PLATAFORMA, quitarTaxas } from "@/lib/pagamentos";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageHeader from "@/components/frela/PageHeader";
import EmptyState from "@/components/frela/EmptyState";
import TaxaStatusBadge from "@/components/taxas/TaxaStatusBadge";
import { cn } from "@/lib/utils";

const FILTROS = [
  { id: "abertas", label: "Em aberto", status: ["pendente", "confirmada", "em_divergencia"] },
  { id: "pagas", label: "Pagas", status: ["paga"] },
  { id: "todas", label: "Todas", status: ["pendente", "confirmada", "em_divergencia", "paga"] },
];

/** Conta de taxas da empresa: saldo, teto, histórico e quitação (em breve). */
const MinhasTaxas = () => {
  const navigate = useNavigate();
  const { userTipo } = useAuth();
  const { resumo, isLoading } = useResumoTaxas();
  const { data: historico = [], isLoading: loadingHist } = useHistoricoTaxas();
  const [emBreve, setEmBreve] = useState(false);
  const [quitando, setQuitando] = useState(false);

  if (userTipo && userTipo !== "empresa") {
    return (
      <div className="min-h-screen bg-background max-w-lg mx-auto">
        <PageHeader title="Minhas taxas" />
        <EmptyState icon={Receipt} titulo="Profissionais não pagam taxa" descricao="A taxa de 5% é cobrada só das empresas, por contratação finalizada." />
      </div>
    );
  }

  const pct = Math.min(100, (resumo.saldo / resumo.teto) * 100);
  const cor = resumo.bloqueado ? "text-destructive" : resumo.perto ? "text-amber-700" : "text-primary";

  const handleQuitar = async () => {
    setQuitando(true);
    const r = await quitarTaxas(resumo.saldo); // TODO (STRIPE): checkout Pix/cartão — ver src/lib/pagamentos.ts
    setQuitando(false);
    if (r.status === "redirecionar") window.location.href = r.url;
    else setEmBreve(true);
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto pb-12">
      <PageHeader title="Minhas taxas" />
      <div className="px-5 space-y-5">
        {resumo.indisponivel && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            Sistema de taxas ainda não ativado no banco (falta rodar o SQL da Fase 4).
          </div>
        )}

        {/* Saldo */}
        <section className={cn("rounded-3xl border p-5 shadow-card bg-card", resumo.bloqueado ? "border-destructive/40" : "border-border")}>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Saldo de taxas em aberto</p>
            {resumo.bloqueado ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-bold"><Lock className="h-3.5 w-3.5" /> Conta travada</span>
            ) : resumo.saldo === 0 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold"><CheckCircle2 className="h-3.5 w-3.5" /> Em dia</span>
            ) : null}
          </div>
          {isLoading ? (
            <Skeleton className="h-10 w-40 mt-2" />
          ) : (
            <p className={cn("text-4xl font-display font-extrabold mt-1", cor)}>{formatBRL(resumo.saldo)}</p>
          )}
          <Progress value={pct} className={cn("h-2.5 mt-4", resumo.bloqueado ? "[&>div]:bg-destructive" : resumo.perto ? "[&>div]:bg-amber-500" : "")} />
          <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
            <span>R$ 0</span>
            <span>Limite {formatBRL(resumo.teto)}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            {resumo.bloqueado
              ? "Você atingiu o limite. Enquanto não quitar, não é possível criar vagas nem confirmar finalizações."
              : resumo.perto
                ? `Faltam ${formatBRL(resumo.teto - resumo.saldo)} para o limite. Quite antes para não travar sua conta.`
                : "As taxas acumulam aqui e você quita quando quiser — antes de chegar ao limite."}
          </p>

          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            <div className="rounded-xl bg-amber-50 py-2">
              <p className="text-sm font-bold text-amber-900">{formatBRL(resumo.a_confirmar)}</p>
              <p className="text-[10px] text-amber-800">A confirmar</p>
            </div>
            <div className="rounded-xl bg-sky-50 py-2">
              <p className="text-sm font-bold text-sky-900">{formatBRL(resumo.confirmado)}</p>
              <p className="text-[10px] text-sky-800">Confirmado</p>
            </div>
            <div className="rounded-xl bg-rose-50 py-2">
              <p className="text-sm font-bold text-rose-900">{formatBRL(resumo.em_divergencia)}</p>
              <p className="text-[10px] text-rose-800">Em análise*</p>
            </div>
          </div>
          {resumo.em_divergencia > 0 && (
            <p className="text-[11px] text-muted-foreground mt-2">* Valores em análise não entram no saldo até a equipe resolver.</p>
          )}

          <Button onClick={handleQuitar} disabled={resumo.saldo <= 0 || quitando} className="w-full h-12 rounded-xl font-semibold text-base mt-5">
            {quitando ? <Loader2 className="h-5 w-5 animate-spin" /> : resumo.saldo > 0 ? `Quitar ${formatBRL(resumo.saldo)}` : "Nada a pagar"}
          </Button>
          <p className="text-[11px] text-muted-foreground text-center mt-2 flex items-center justify-center gap-1">
            <QrCode className="h-3 w-3" /> Pix ou cartão · total pago até hoje: {formatBRL(resumo.pago)}
          </p>
        </section>

        {/* Como funciona */}
        <section className="bg-card border border-border rounded-2xl p-4 text-sm text-muted-foreground space-y-2">
          <p className="font-display font-bold text-foreground flex items-center gap-2"><Info className="h-4 w-4 text-primary" /> Como funciona</p>
          <p>1. Ao confirmar a finalização, você informa o valor pago. A taxa é {TAXA_PLATAFORMA * 100}% desse valor.</p>
          <p>2. O profissional confirma que recebeu. Se ele contestar, a equipe FreLa analisa e ajusta.</p>
          <p>3. As taxas acumulam no saldo. Com {formatBRL(resumo.teto)} em aberto, a conta trava até a quitação.</p>
          <p>4. Para renovar a assinatura é preciso estar sem taxas em aberto.</p>
        </section>

        {/* Histórico */}
        <section>
          <h2 className="font-display font-bold text-foreground mb-2">Histórico por contratação</h2>
          <Tabs defaultValue="abertas">
            <TabsList className="w-full grid grid-cols-3 mb-3">
              {FILTROS.map((f) => <TabsTrigger key={f.id} value={f.id} className="text-xs">{f.label}</TabsTrigger>)}
            </TabsList>
            {FILTROS.map((f) => {
              const lista = historico.filter((c) => f.status.includes(c.status_taxa ?? ""));
              return (
                <TabsContent key={f.id} value={f.id}>
                  {loadingHist ? (
                    <div className="space-y-2">{[0, 1].map((i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
                  ) : lista.length === 0 ? (
                    <EmptyState icon={Receipt} titulo={f.id === "pagas" ? "Nenhuma taxa paga ainda" : "Nenhuma taxa aqui"}
                      descricao="As taxas aparecem quando você confirma a finalização de uma contratação." />
                  ) : (
                    <ul className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
                      {lista.map((c) => (
                        <li key={c.id}>
                          <button onClick={() => navigate(`/contratacao/${c.id}`)} className="w-full text-left p-3.5 flex items-center gap-3 hover:bg-muted/40">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{c.jobs?.title ?? "Contratação"}</p>
                              <p className="text-xs text-muted-foreground">
                                {c.finalizada_em ? new Date(c.finalizada_em).toLocaleDateString("pt-BR") : c.jobs ? formatDate(c.jobs.date) : ""} · serviço {formatBRL(c.valor)}
                              </p>
                              {c.status_taxa && (
                                <p className="text-[11px] text-muted-foreground mt-0.5">{STATUS_TAXA[c.status_taxa as keyof typeof STATUS_TAXA]?.descricao}</p>
                              )}
                            </div>
                            <div className="text-right shrink-0 space-y-1">
                              <p className="text-sm font-bold text-foreground">{formatBRL(c.taxa_5pct)}</p>
                              <TaxaStatusBadge status={c.status_taxa} />
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </section>
      </div>

      <Dialog open={emBreve} onOpenChange={setEmBreve}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2"><Rocket className="h-7 w-7" /></div>
            <DialogTitle className="text-center">Pagamento online em breve</DialogTitle>
            <DialogDescription className="text-center">
              Em breve você poderá quitar por Pix ou cartão direto aqui. Por enquanto, fale com a equipe FreLa para combinar o pagamento — assim que recebermos, sua conta é liberada.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEmBreve(false)} className="flex-1 h-11 rounded-xl">Fechar</Button>
            <Button onClick={() => navigate("/suporte")} className="flex-1 h-11 rounded-xl">Falar com a equipe</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MinhasTaxas;
