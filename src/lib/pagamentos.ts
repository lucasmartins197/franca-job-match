/**
 * MODELO DE RECEITA DO FRELA — preparado, mas DESATIVADO.
 * Nenhuma cobrança real acontece no app hoje.
 *
 * 1) MENSALIDADE (profissional R$ 39,90 · empresa R$ 89,90)
 *    Será vendida por IN-APP PURCHASE — Apple IAP (StoreKit) / Google Play Billing —
 *    porque é assinatura de acesso ao app (regra das lojas). NÃO usar Stripe para isso.
 *    TODO (IAP):
 *      • app nativo (Capacitor/React Native) + plugin de compras (ex.: RevenueCat
 *        ou cordova-plugin-purchase) com os produtos FRELA_PRO_MENSAL / FRELA_EMPRESA_MENSAL
 *      • após a compra, enviar o recibo para uma Edge Function `validar-assinatura`
 *        que valida com Apple/Google e grava profiles.subscription_status / subscription_end
 *        (esses campos são protegidos: só o backend altera — ver SQL da Fase 3)
 *      • webhooks das lojas (renovação/cancelamento) na mesma Edge Function
 *    Ponto de entrada no app: `iniciarAssinatura()` abaixo.
 *
 * 2) TAXA DE 5% (empresa, por contratação finalizada) — Fase 4
 *    • Na finalização a empresa DECLARA o valor pago → taxa_5pct = 5% desse valor
 *      (calculado no banco). status_taxa = 'pendente'.
 *    • O profissional confirma o valor (→ 'confirmada') ou contesta (→ 'em_divergencia',
 *      fora do saldo até um ADM resolver).
 *    • As taxas ACUMULAM numa conta da empresa (saldo = pendente + confirmada não pagas).
 *    • TRAVA: saldo >= TETO_TAXAS (R$ 50) → não cria vagas nem confirma finalizações
 *      (garantido no banco por triggers, além da interface).
 *    • Renovação da assinatura bloqueada com qualquer taxa em aberto.
 *    • QUITAÇÃO: `quitarTaxas()` abaixo.
 *      TODO (STRIPE): Edge Function `criar-cobranca-taxas` cria um PaymentIntent
 *      (Pix ou cartão) com o saldo atual e devolve o QR Code / client_secret.
 *      O webhook `payment_intent.succeeded` (Edge Function com service_role) chama
 *      `select public.frela_quitar_taxas(<empresa_id>, <payment_intent_id>)`, que marca
 *      as taxas como pagas, registra em `pagamentos` e libera a conta.
 *      Hoje o ADM pode registrar um pagamento recebido manualmente (painel /admin/taxas).
 *    Como é cobrança de serviço entre empresas (não acesso ao app), roda fora das lojas.
 *
 *    Teto e porcentagem: o banco é a fonte da verdade (frela_teto_taxas /
 *    frela_taxa_percentual no SQL da Fase 4). As constantes abaixo são só o valor de
 *    reserva da interface — ao mudar, mude nos dois lugares.
 */

export const TAXA_PLATAFORMA = 0.05;

/** Saldo de taxas a partir do qual a empresa fica travada (R$). */
export const TETO_TAXAS = 50;

/** A partir de quantos % do teto mostramos o aviso "perto do limite". */
export const AVISO_TAXAS_PCT = 0.7;

export type StatusTaxa = "pendente" | "confirmada" | "em_divergencia" | "paga";

export const STATUS_TAXA: Record<StatusTaxa, { label: string; descricao: string; cls: string }> = {
  pendente: { label: "A confirmar", descricao: "Aguardando o profissional confirmar o valor", cls: "bg-amber-100 text-amber-800" },
  confirmada: { label: "Em aberto", descricao: "Valor confirmado pelos dois — entra no saldo", cls: "bg-sky-100 text-sky-800" },
  em_divergencia: { label: "Em análise", descricao: "Profissional contestou o valor — a equipe FreLa vai resolver", cls: "bg-rose-100 text-rose-800" },
  paga: { label: "Paga", descricao: "Taxa quitada", cls: "bg-emerald-100 text-emerald-800" },
};

export type TipoPlano = "freelancer" | "empresa";

export interface Plano {
  id: TipoPlano;
  /** ID do produto nas lojas (usar no IAP) */
  produtoLoja: string;
  nome: string;
  publico: string;
  preco: number;
  beneficios: string[];
}

export const PLANOS: Record<TipoPlano, Plano> = {
  freelancer: {
    id: "freelancer",
    produtoLoja: "FRELA_PRO_MENSAL",
    nome: "FreLa Pro",
    publico: "Para profissionais",
    preco: 39.9,
    beneficios: [
      "Candidaturas ilimitadas em todas as vagas de Franca",
      "Perfil em destaque para as empresas",
      "Portfólio com até 12 fotos",
      "Selo de verificação após análise da equipe",
      "Chat direto com as empresas que te contratarem",
      "Sem taxa sobre o que você recebe",
    ],
  },
  empresa: {
    id: "empresa",
    produtoLoja: "FRELA_EMPRESA_MENSAL",
    nome: "FreLa Empresa",
    publico: "Para empresas",
    preco: 89.9,
    beneficios: [
      "Publicação de vagas sem limite",
      "Currículo completo de cada candidato (portfólio, histórico, avaliações)",
      "Chat com o profissional confirmado",
      "Mapa do seu endereço para os profissionais",
      "Suporte prioritário da equipe FreLa",
    ],
  },
};

export const calcularTaxa = (valor: number) => Math.round(valor * TAXA_PLATAFORMA * 100) / 100;

export type ResultadoAssinatura = { status: "em_breve" } | { status: "ok" } | { status: "taxas_pendentes" };

/**
 * Ponto ÚNICO de início/renovação da assinatura.
 * Regra: empresa com taxas em aberto não assina/renova — precisa quitar antes.
 * TODO (IAP): depois da checagem, abrir o fluxo de compra da loja (ver topo do arquivo).
 *   A Edge Function `validar-assinatura` também deve chamar pode_renovar_assinatura()
 *   antes de ativar, para a regra valer mesmo fora do app.
 * Hoje só devolve "em_breve" — nada é cobrado.
 */
export const iniciarAssinatura = async (
  _plano: Plano,
  opts: { podeRenovar?: boolean } = {}
): Promise<ResultadoAssinatura> => {
  if (opts.podeRenovar === false) return { status: "taxas_pendentes" };
  return { status: "em_breve" };
};

export type ResultadoQuitacao = { status: "em_breve" } | { status: "redirecionar"; url: string };

/**
 * Ponto ÚNICO de quitação das taxas.
 * TODO (STRIPE): chamar a Edge Function `criar-cobranca-taxas` com o saldo e abrir o
 *   checkout (Pix / cartão). A baixa acontece no webhook (ver topo do arquivo).
 * Hoje só devolve "em_breve" — nada é cobrado.
 */
export const quitarTaxas = async (_saldo: number): Promise<ResultadoQuitacao> => {
  return { status: "em_breve" };
};
