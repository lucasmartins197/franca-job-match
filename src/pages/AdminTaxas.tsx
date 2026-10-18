import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Loader2, Lock, Receipt, Scale, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { formatBRL, useProfilesByIds } from "@/hooks/useFrela";
import { useIsAdmin } from "@/hooks/useSuporte";
import { useDivergencias, useRegistrarPagamentoTaxas, useResolverDivergencia, useSaldosEmpresas } from "@/hooks/useTaxas";
import { calcularTaxa } from "@/lib/pagamentos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import PageHeader from "@/components/frela/PageHeader";
import EmptyState from "@/components/frela/EmptyState";
import UserAvatar from "@/components/frela/UserAvatar";
import { cn } from "@/lib/utils";

/** Painel ADM: divergências de valor e saldos de taxas por empresa. */
const AdminTaxas = () => {
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();
  const { data: divergencias = [], isLoading: loadingDiv } = useDivergencias(isAdmin);
  const { data: saldos = [], isLoading: loadingSaldos } = useSaldosEmpresas(isAdmin);
  const { data: perfis = {} } = useProfilesByIds(divergencias.flatMap((d) => [d.empresa_id, d.profissional_id]));
  const resolver = useResolverDivergencia();
  const registrar = useRegistrarPagamentoTaxas();
  const [valores, setValores] = useState<Record<string, string>>({});
  const [pagando, setPagando] = useState<{ id: string; nome: string; saldo: number } | null>(null);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background max-w-lg mx-auto">
        <PageHeader title="Taxas (ADM)" />
        <EmptyState icon={ShieldAlert} titulo="Área restrita à equipe FreLa" />
      </div>
    );
  }

  const handleResolver = async (id: string, valor: number) => {
    if (!Number.isFinite(valor) || valor <= 0) {
      toast.error("Valor final inválido");
      return;
    }
    try {
      await resolver.mutateAsync({ contratacaoId: id, valorFinal: valor });
      toast.success(`Divergência resolvida em ${formatBRL(valor)}. As duas partes foram avisadas.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao resolver");
    }
  };

  const handleRegistrar = async () => {
    if (!pagando) return;
    try {
      const total = await registrar.mutateAsync({ empresaId: pagando.id });
      toast.success(`Pagamento de ${formatBRL(total)} registrado. Conta de ${pagando.nome} liberada.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao registrar pagamento");
    } finally {
      setPagando(null);
    }
  };

  const totalAberto = saldos.reduce((s, x) => s + Number(x.saldo), 0);
  const travadas = saldos.filter((x) => x.bloqueado).length;

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto pb-12">
      <PageHeader title="Taxas e divergências" />
      <div className="px-5">
        <div className="grid grid-cols-3 gap-2 mb-5 text-center">
          <div className="rounded-2xl bg-card border border-border p-3">
            <p className="font-display font-bold text-foreground">{formatBRL(totalAberto)}</p>
            <p className="text-[10px] text-muted-foreground">A receber</p>
          </div>
          <div className="rounded-2xl bg-card border border-border p-3">
            <p className="font-display font-bold text-rose-700">{divergencias.length}</p>
            <p className="text-[10px] text-muted-foreground">Divergências</p>
          </div>
          <div className="rounded-2xl bg-card border border-border p-3">
            <p className="font-display font-bold text-destructive">{travadas}</p>
            <p className="text-[10px] text-muted-foreground">Contas travadas</p>
          </div>
        </div>

        <Tabs defaultValue="divergencias">
          <TabsList className="w-full grid grid-cols-2 mb-4">
            <TabsTrigger value="divergencias">Divergências ({divergencias.length})</TabsTrigger>
            <TabsTrigger value="saldos">Saldos por empresa</TabsTrigger>
          </TabsList>

          <TabsContent value="divergencias" className="space-y-3">
            {loadingDiv ? (
              <Skeleton className="h-48 rounded-2xl" />
            ) : divergencias.length === 0 ? (
              <EmptyState icon={CheckCircle2} titulo="Nenhuma divergência" descricao="Quando um profissional contestar o valor declarado pela empresa, aparece aqui." />
            ) : (
              divergencias.map((c) => {
                const emp = perfis[c.empresa_id];
                const pro = perfis[c.profissional_id];
                const outro = valores[c.id] ?? "";
                return (
                  <article key={c.id} className="bg-card border border-rose-200 rounded-2xl p-4 shadow-card">
                    <button onClick={() => navigate(`/contratacao/${c.id}`)} className="text-left w-full">
                      <p className="font-display font-bold text-foreground">{c.jobs?.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Finalizada em {c.finalizada_em ? new Date(c.finalizada_em).toLocaleDateString("pt-BR") : "—"}
                      </p>
                    </button>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <div className="rounded-xl bg-muted/60 p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <UserAvatar nome={c.jobs?.company_name} fotoUrl={emp?.foto_url} size="sm" className="h-6 w-6 text-[10px] rounded-md" />
                          <span className="text-xs text-muted-foreground truncate">Empresa</span>
                        </div>
                        <p className="font-display font-bold text-foreground">{formatBRL(c.valor)}</p>
                        <p className="text-[10px] text-muted-foreground">declarou ter pago</p>
                      </div>
                      <div className="rounded-xl bg-rose-50 p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <UserAvatar nome={pro?.nome} fotoUrl={pro?.foto_url} size="sm" className="h-6 w-6 text-[10px] rounded-md" />
                          <span className="text-xs text-rose-800 truncate">Profissional</span>
                        </div>
                        <p className="font-display font-bold text-rose-900">{formatBRL(c.valor_contestado)}</p>
                        <p className="text-[10px] text-rose-800">diz ter recebido</p>
                      </div>
                    </div>
                    {c.motivo_divergencia && (
                      <p className="text-sm text-muted-foreground mt-3 italic">"{c.motivo_divergencia}" — {pro?.nome}</p>
                    )}
                    <p className="text-xs font-semibold text-muted-foreground mt-4 mb-2 flex items-center gap-1"><Scale className="h-3.5 w-3.5" /> Definir valor final</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" disabled={resolver.isPending} onClick={() => handleResolver(c.id, Number(c.valor))} className="h-auto py-2 rounded-xl flex-col">
                        <span className="text-xs text-muted-foreground">Valor da empresa</span>
                        <span className="font-semibold">{formatBRL(c.valor)}</span>
                      </Button>
                      <Button variant="outline" disabled={resolver.isPending || !Number(c.valor_contestado)} onClick={() => handleResolver(c.id, Number(c.valor_contestado))} className="h-auto py-2 rounded-xl flex-col">
                        <span className="text-xs text-muted-foreground">Valor do profissional</span>
                        <span className="font-semibold">{formatBRL(c.valor_contestado)}</span>
                      </Button>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Input type="number" inputMode="decimal" min="1" step="0.01" placeholder="Outro valor" value={outro}
                        onChange={(e) => setValores((v) => ({ ...v, [c.id]: e.target.value }))} className="h-10 rounded-xl" />
                      <Button disabled={!outro || resolver.isPending} onClick={() => handleResolver(c.id, Number(outro.replace(",", ".")))} className="h-10 rounded-xl shrink-0">
                        {resolver.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
                      </Button>
                    </div>
                    {outro && Number(outro) > 0 && (
                      <p className="text-[11px] text-muted-foreground mt-1">Taxa resultante: {formatBRL(calcularTaxa(Number(outro)))}</p>
                    )}
                  </article>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="saldos">
            {loadingSaldos ? (
              <Skeleton className="h-48 rounded-2xl" />
            ) : saldos.length === 0 ? (
              <EmptyState icon={Receipt} titulo="Nenhuma taxa ainda" descricao="Os saldos aparecem quando as empresas finalizam contratações." />
            ) : (
              <ul className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
                {saldos.map((x) => (
                  <li key={x.empresa_id} className="p-3.5 flex items-center gap-3">
                    <button onClick={() => navigate(`/perfil/${x.empresa_id}`)} className="flex-1 min-w-0 text-left">
                      <p className="font-semibold text-foreground truncate flex items-center gap-1.5">
                        {x.bloqueado && <Lock className="h-3.5 w-3.5 text-destructive shrink-0" />} {x.nome_empresa}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Pago {formatBRL(x.pago)}
                        {Number(x.a_confirmar) > 0 ? ` · ${formatBRL(x.a_confirmar)} a confirmar` : ""}
                        {Number(x.em_divergencia) > 0 ? ` · ${formatBRL(x.em_divergencia)} em análise` : ""}
                      </p>
                    </button>
                    <div className="text-right shrink-0">
                      <p className={cn("font-display font-bold", x.bloqueado ? "text-destructive" : "text-foreground")}>{formatBRL(x.saldo)}</p>
                      {Number(x.saldo) > 0 && (
                        <button onClick={() => setPagando({ id: x.empresa_id, nome: x.nome_empresa, saldo: Number(x.saldo) })}
                          className="text-xs font-semibold text-primary">
                          Registrar pagamento
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-[11px] text-muted-foreground mt-3 flex gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Use "Registrar pagamento" só depois de receber (ex.: Pix direto). Quando o Stripe estiver ativo, a baixa será automática.
            </p>
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={!!pagando} onOpenChange={(o) => !o && setPagando(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Registrar pagamento de {pagando ? formatBRL(pagando.saldo) : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              Todas as taxas em aberto de {pagando?.nome} serão marcadas como pagas e a conta será liberada. Confirme que o valor foi recebido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRegistrar}>Registrar pagamento</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminTaxas;
