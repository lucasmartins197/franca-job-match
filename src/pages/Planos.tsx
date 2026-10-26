import { useState } from "react";
import { Check, Crown, Gift, Loader2, Lock, Percent, Rocket, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useResumoTaxas } from "@/hooks/useTaxas";
import { useAuth } from "@/hooks/useAuth";
import { useMeuPerfil } from "@/hooks/usePerfil";
import { formatBRL } from "@/hooks/useFrela";
import { BENEFICIOS_PROFISSIONAL, PLANOS, Plano, TAXA_PLATAFORMA, TETO_TAXAS, calcularTaxa, iniciarAssinatura } from "@/lib/pagamentos";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageHeader from "@/components/frela/PageHeader";
import { cn } from "@/lib/utils";

const EXEMPLOS = [100, 150, 250];

/** Profissional: tudo grátis. */
const PlanoProfissional = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto pb-12">
      <PageHeader title="Planos FreLa" />
      <div className="px-5 space-y-5">
        <section className="rounded-2xl bg-gradient-to-br from-primary to-brand-dim text-primary-foreground p-5 shadow-brand">
          <div className="flex items-center gap-2 text-sm font-semibold opacity-90"><Gift className="h-4 w-4" /> Para profissionais</div>
          <p className="text-3xl font-display font-extrabold mt-1">Grátis. Sempre.</p>
          <p className="text-sm opacity-90 mt-1">Você não paga assinatura nem taxa. Recebe o valor cheio combinado direto da empresa.</p>
        </section>
        <section className="bg-card border border-border rounded-3xl p-5 shadow-card">
          <ul className="space-y-2.5">
            {BENEFICIOS_PROFISSIONAL.map((b) => (
              <li key={b} className="flex gap-2.5 text-sm text-foreground">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5"><Check className="h-3.5 w-3.5" /></span>
                {b}
              </li>
            ))}
          </ul>
          <Button onClick={() => navigate("/")} className="w-full h-12 rounded-xl font-semibold text-base mt-6">Ver vagas</Button>
        </section>
        <p className="text-xs text-muted-foreground text-center px-4">
          Quem paga o FreLa são as empresas: {formatBRL(PLANOS.empresa.preco)}/mês + {TAXA_PLATAFORMA * 100}% por contratação finalizada.
        </p>
      </div>
    </div>
  );
};

/** Plano da empresa e modelo de receita. O botão de assinatura leva a "em breve" — nada é cobrado. */
const Planos = () => {
  const { userTipo } = useAuth();
  if (userTipo && userTipo !== "empresa") return <PlanoProfissional />;
  return <PlanoEmpresa />;
};

const PlanoEmpresa = () => {
  const { data: perfil } = useMeuPerfil();
  const [emBreve, setEmBreve] = useState<Plano | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [taxasPendentes, setTaxasPendentes] = useState(false);
  const { resumo: taxas } = useResumoTaxas();
  const navigate = useNavigate();
  const plano = PLANOS.empresa;
  const assinante = perfil?.profile.subscription_status === "active";

  const assinar = async () => {
    setCarregando(true);
    // Empresa com taxas em aberto não assina/renova (regra da Fase 4)
    const r = await iniciarAssinatura(plano, { podeRenovar: taxas.pode_renovar }); // TODO (IAP)
    setCarregando(false);
    if (r.status === "taxas_pendentes") setTaxasPendentes(true);
    else if (r.status === "em_breve") setEmBreve(plano);
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto pb-12">
      <PageHeader title="Planos FreLa" />
      <div className="px-5 space-y-5">
        <section className="rounded-2xl bg-gradient-to-br from-primary to-brand-dim text-primary-foreground p-5 shadow-brand">
          <div className="flex items-center gap-2 text-sm font-semibold opacity-90"><Rocket className="h-4 w-4" /> Seu acesso hoje</div>
          <p className="text-2xl font-display font-extrabold mt-1">{assinante ? plano.nome : "Lançamento gratuito"}</p>
          <p className="text-sm opacity-90 mt-1">
            {assinante
              ? `Ativo${perfil?.profile.subscription_end ? ` até ${new Date(perfil.profile.subscription_end).toLocaleDateString("pt-BR")}` : ""}.`
              : "Durante o lançamento em Franca, todos os recursos estão liberados sem custo."}
          </p>
        </section>


        <section className="relative bg-card border-2 border-primary rounded-3xl p-5 shadow-card">
          <span className="absolute -top-3 left-5 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">Seu plano</span>
          <div className="flex items-center gap-2 text-primary"><Crown className="h-5 w-5" /><span className="font-display font-bold">{plano.nome}</span></div>
          <div className="flex items-end gap-1 mt-3">
            <span className="text-4xl font-display font-extrabold text-foreground">{formatBRL(plano.preco)}</span>
            <span className="text-muted-foreground mb-1">/mês</span>
          </div>
          <ul className="mt-5 space-y-2.5">
            {plano.beneficios.map((b) => (
              <li key={b} className="flex gap-2.5 text-sm text-foreground">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5"><Check className="h-3.5 w-3.5" /></span>
                {b}
              </li>
            ))}
          </ul>
          {!taxas.pode_renovar && (
            <button onClick={() => navigate("/taxas")} className="w-full mt-5 rounded-xl border border-amber-300 bg-amber-50 p-3 text-left text-xs text-amber-900 flex gap-2">
              <Lock className="h-4 w-4 shrink-0" />
              <span>Você tem taxas em aberto. Para assinar ou renovar, quite-as primeiro em <b>Minhas taxas</b>.</span>
            </button>
          )}
          <Button onClick={assinar} disabled={carregando} className="w-full h-12 rounded-xl font-semibold text-base mt-6">
            {carregando ? <Loader2 className="h-5 w-5 animate-spin" /> : `Assinar ${plano.nome}`}
          </Button>
          <p className="text-[11px] text-muted-foreground text-center mt-2 flex items-center justify-center gap-1">
            <Smartphone className="h-3 w-3" /> Assinatura pela App Store / Google Play. Cancele quando quiser.
          </p>
        </section>

                  <section className="bg-card border border-border rounded-2xl p-5 shadow-card">
            <div className="flex items-center gap-2">
              <span className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center"><Percent className="h-5 w-5" /></span>
              <div>
                <p className="font-display font-bold text-foreground">Taxa de {TAXA_PLATAFORMA * 100}% por contratação</p>
                <p className="text-xs text-muted-foreground">Só quando o serviço é finalizado. Sem contratação, sem taxa.</p>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-border overflow-hidden text-sm">
              <div className="grid grid-cols-3 bg-muted/60 px-3 py-2 text-xs font-semibold text-muted-foreground">
                <span>Valor do serviço</span><span className="text-center">Taxa FreLa</span><span className="text-right">Profissional recebe</span>
              </div>
              {EXEMPLOS.map((v) => (
                <div key={v} className="grid grid-cols-3 px-3 py-2 border-t border-border">
                  <span className="font-medium">{formatBRL(v)}</span>
                  <span className="text-center text-amber-800">{formatBRL(calcularTaxa(v))}</span>
                  <span className="text-right font-semibold text-primary">{formatBRL(v)}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              A taxa acumula numa conta de taxas da empresa (até {formatBRL(TETO_TAXAS)}) e é quitada por Pix/cartão, fora da assinatura — o profissional recebe o valor cheio combinado.
            </p>
          </section>

        <section>
          <h2 className="font-display font-bold text-foreground mb-2">Perguntas frequentes</h2>
          <Accordion type="single" collapsible className="bg-card border border-border rounded-2xl px-4">
            <AccordionItem value="1">
              <AccordionTrigger className="text-sm text-left">Preciso pagar agora?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">Não. No lançamento em Franca o FreLa está liberado. Avisaremos com antecedência antes de qualquer cobrança.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="2">
              <AccordionTrigger className="text-sm text-left">Como vou pagar a assinatura?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">Pela própria loja do seu celular (App Store ou Google Play), com renovação mensal e cancelamento a qualquer momento.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="3">
              <AccordionTrigger className="text-sm text-left">O profissional paga taxa sobre o que recebe?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">Não. Para o profissional o FreLa é grátis. A taxa de 5% é da empresa e só existe quando o serviço é confirmado com o código.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="4" className="border-b-0">
              <AccordionTrigger className="text-sm text-left">Como o profissional recebe pelo serviço?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">Diretamente da empresa, no valor combinado na vaga. O FreLa conecta, organiza e dá segurança com perfis e avaliações.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </div>

      <Dialog open={taxasPendentes} onOpenChange={setTaxasPendentes}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-2"><Lock className="h-7 w-7" /></div>
            <DialogTitle className="text-center">Quite as taxas para renovar</DialogTitle>
            <DialogDescription className="text-center">
              Você tem {formatBRL(taxas.saldo + taxas.em_divergencia)} em taxas em aberto. A assinatura só pode ser renovada com a conta de taxas em dia.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => navigate("/taxas")} className="w-full h-11 rounded-xl">Ver minhas taxas</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={!!emBreve} onOpenChange={(o) => !o && setEmBreve(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2"><Rocket className="h-7 w-7" /></div>
            <DialogTitle className="text-center">Assinaturas em breve</DialogTitle>
            <DialogDescription className="text-center">
              O {emBreve?.nome} será assinado direto pela App Store / Google Play. Enquanto isso, aproveite o FreLa liberado durante o lançamento — nada será cobrado.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setEmBreve(null)} className="w-full h-11 rounded-xl">Entendi</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Planos;
