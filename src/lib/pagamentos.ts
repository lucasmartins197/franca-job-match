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
 * 2) TAXA DE 5% (empresa, por contratação finalizada)
 *    Calculada quando a empresa aceita o candidato → contratacoes.taxa_5pct.
 *    Cobrada no BACKEND, fora da interface do app (não é transação na tela).
 *    TODO (TAXA): Edge Function `cobrar-taxa`, disparada quando contratacoes.status
 *    vira 'finalizada' (ver useFinalizarContratacao em src/hooks/useFrela.ts):
 *      • cobra a empresa (boleto/Pix/cartão via gateway, fatura mensal consolidada etc.)
 *      • registra em `pagamentos` { tipo: 'taxa_5pct', valor, contratacao_id, status }
 *      • marca contratacoes.taxa_cobrada = true quando o gateway confirmar
 */

export const TAXA_PLATAFORMA = 0.05;

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

export type ResultadoAssinatura = { status: "em_breve" } | { status: "ok" };

/**
 * Ponto ÚNICO de início da assinatura.
 * TODO (IAP): substituir pelo fluxo de compra da loja (ver comentário no topo do arquivo).
 * Hoje só devolve "em_breve" — nada é cobrado.
 */
export const iniciarAssinatura = async (_plano: Plano): Promise<ResultadoAssinatura> => {
  return { status: "em_breve" };
};
