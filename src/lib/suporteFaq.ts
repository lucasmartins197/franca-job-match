/**
 * ═══════════════════════════════════════════════════════════════════
 * CONTEÚDO DO CHAT DE SUPORTE — assistente "Vera" (IA SIMULADA)
 * ═══════════════════════════════════════════════════════════════════
 * Tudo aqui são respostas programadas: nenhuma IA externa, sem custo por mensagem.
 * Para ajustar textos, edite só este arquivo:
 *   • NOME_APP / NOME_ASSISTENTE: trocam em todas as mensagens ({app} e {assistente})
 *   • {nome}: primeiro nome do usuário (ou some, se não houver)
 *   • TOPICOS: pergunta (o botão), resposta, para quem aparece e palavras-chave
 *   • Para uma pergunta nova: copie um tópico, troque o id e os textos.
 * Palavras-chave: sem acento e minúsculas não importam (o app normaliza).
 * Uma palavra-chave com espaço ("criar vaga") vale mais que uma palavra solta.
 */

/** Nome do app nas mensagens. O conteúdo original usa "Vagu": troque aqui quando o novo nome for oficial. */
export const NOME_APP = "FreLa";
export const NOME_ASSISTENTE = "Vera";
/** Prazo de resposta do time humano (mostrado ao escalar). */
export const PRAZO_RESPOSTA = "24 horas";

export type Publico = "empresa" | "profissional" | "geral";

export interface Topico {
  id: string;
  /** Texto do botão (chip) */
  pergunta: string;
  resposta: string;
  publico: Publico;
  palavras: string[];
}

// ─────────────────────────────────────────────
// Saudação inicial
// ─────────────────────────────────────────────
export const SAUDACAO: Record<"empresa" | "profissional", string> = {
  empresa:
    "Oi{nome}! Eu sou a {assistente}, assistente do {app} 👋 Posso te ajudar com suas vagas, pagamentos, taxas ou qualquer dúvida. É só escolher abaixo ou me contar o que você precisa.",
  profissional:
    "Oi{nome}! Eu sou a {assistente}, assistente do {app} 👋 Posso te ajudar a encontrar trabalho, se candidatar, confirmar serviços e muito mais. Escolhe abaixo ou me conta sua dúvida.",
};

// ─────────────────────────────────────────────
// Mensagens do fluxo
// ─────────────────────────────────────────────
export const MENSAGENS = {
  perguntaAjudou: "Isso ajudou?",
  ajudouSim: "Que bom! Posso ajudar em mais alguma coisa?",
  ajudouNao: "Poxa, desculpa! Quer que eu chame o nosso time? Eles respondem em até {prazo}.",
  naoEntendi:
    "Hmm, não tenho certeza se entendi 🤔 Dá uma olhada nas dúvidas mais comuns aqui embaixo — ou, se preferir, falo com o nosso time pra você.",
  escalarPedido: "Sem problema! Vou encaminhar sua mensagem para o nosso time de suporte. Me conta rapidinho o que você precisa 👇",
  escalarEnviado:
    "Prontinho! Sua mensagem foi enviada para o nosso time. Você vai receber a resposta por aqui (ou no seu email) em até {prazo}. Enquanto isso, posso te ajudar com mais alguma coisa?",
  escalarErro: "Ops, não consegui enviar agora. Pode tentar de novo em instantes?",
  botaoEscalar: "Falar com o time de suporte",
};

// ─────────────────────────────────────────────
// Dúvidas (botões + respostas + palavras-chave)
// ─────────────────────────────────────────────
export const TOPICOS: Topico[] = [
  // ── EMPRESA ──
  {
    id: "criar-vaga",
    publico: "empresa",
    pergunta: "Como criar uma vaga?",
    resposta:
      "Criar uma vaga é rápido! Toque em \"Criar vaga\", preencha o título, a descrição do que precisa, o VALOR que vai pagar, a data, o horário e o local. Pronto — sua vaga aparece para os profissionais da região na hora. Lembrando: o valor é obrigatório, para o profissional saber quanto vai receber.",
    palavras: ["criar vaga", "nova vaga", "publicar", "anunciar", "anuncio", "postar vaga", "abrir vaga", "cadastrar vaga"],
  },
  {
    id: "assinatura",
    publico: "empresa",
    pergunta: "Como funciona a assinatura?",
    resposta:
      "A assinatura do {app} para empresas é de R$ 89,90 por mês e dá acesso a publicar vagas e contratar profissionais quando quiser. É cobrada mensalmente e você pode gerenciar no seu perfil.",
    palavras: ["assinatura", "assinar", "plano", "mensalidade", "89", "89,90", "cancelar assinatura", "renovar"],
  },
  {
    id: "taxa",
    publico: "empresa",
    pergunta: "O que é a taxa de 5%?",
    resposta:
      "A cada contratação concluída, o {app} cobra uma taxa de 5% sobre o valor do serviço. Por exemplo: se você pagou R$ 100 ao profissional, a taxa é R$ 5. Essa taxa é o que mantém a plataforma funcionando e garante segurança para os dois lados.",
    palavras: ["taxa", "5%", "5 %", "cinco por cento", "cobranca", "cobrar", "cobrado", "porcentagem", "quitar", "saldo de taxas", "pagar", "pagamento"],
  },
  {
    id: "confirmar-servico",
    publico: "empresa",
    pergunta: "Como confirmo que o serviço foi feito?",
    resposta:
      "Quando o trabalho terminar, toque em \"Serviço realizado\" e informe o valor pago. O app gera um CÓDIGO de 4 dígitos. Você passa esse código ao profissional, que digita no app dele para confirmar. Assim que ele confirma, o serviço é finalizado e todos ficam protegidos.",
    palavras: ["codigo", "confirmar", "confirmacao", "servico realizado", "finalizar", "terminou", "concluir servico", "gerar codigo"],
  },
  {
    id: "trava-vaga",
    publico: "empresa",
    pergunta: "Por que não consigo criar uma nova vaga?",
    resposta:
      "Isso acontece em dois casos: (1) você tem um serviço anterior ainda não confirmado — finalize-o primeiro com o código; ou (2) suas taxas acumuladas chegaram ao limite de R$ 50 — basta quitar para liberar. É uma forma de manter tudo em dia. Precisa de ajuda para regularizar?",
    palavras: ["nao consigo", "por que nao", "nao consigo criar", "nao consigo publicar", "travado", "travada", "trava", "bloqueado", "bloqueada", "bloqueio", "limite", "nao deixa", "liberar"],
  },
  {
    id: "escolher-candidato",
    publico: "empresa",
    pergunta: "Como escolho um candidato?",
    resposta:
      "Na sua vaga, você vê todos os candidatos com foto, experiência, avaliações e histórico. Toque em um para ver o perfil completo. Quando decidir, é só aceitar — os outros candidatos são avisados automaticamente.",
    palavras: ["candidato", "candidatos", "escolher", "aceitar", "contratar", "selecionar", "recusar"],
  },
  {
    id: "indique-ganhe",
    publico: "empresa",
    pergunta: "Como funciona o Indique e Ganhe?",
    resposta:
      "No seu perfil há a seção \"Indique e Ganhe\". Você compartilha seu código com outra empresa. Quando ela se cadastra e assina o {app}, você ganha R$ 50 de desconto nas suas taxas. Quanto mais indicar, mais economiza!",
    palavras: ["indicar", "indique", "indicacao", "ganhar desconto", "desconto", "convidar", "codigo de indicacao", "credito"],
  },

  // ── PROFISSIONAL ──
  {
    id: "gratis",
    publico: "profissional",
    pergunta: "O {app} é grátis para mim?",
    resposta:
      "Sim! Para profissionais o {app} é 100% gratuito. Você se cadastra, monta seu perfil, se candidata às vagas e recebe seus trabalhos — tudo sem pagar nada.",
    palavras: ["gratis", "gratuito", "de graca", "pago", "preciso pagar", "tenho que pagar", "custa", "quanto custa", "taxa", "cobranca", "cobrar", "assinatura"],
  },
  {
    id: "candidatar",
    publico: "profissional",
    pergunta: "Como me candidato a uma vaga?",
    resposta:
      "No seu feed aparecem as vagas da sua região e da sua área. Toque na vaga para ver os detalhes (valor, local, horário, empresa) e toque em \"Candidatar-se\". A empresa recebe sua candidatura e, se te escolher, você é avisado na hora.",
    palavras: ["candidatar", "candidato", "candidatura", "aplicar", "me inscrever", "inscricao", "quero trabalhar", "pegar vaga", "vaga"],
  },
  {
    id: "pagamento-trabalho",
    publico: "profissional",
    pergunta: "Como recebo o pagamento do trabalho?",
    resposta:
      "O pagamento do serviço é combinado e pago diretamente pela empresa, do jeito que vocês acertarem. O {app} conecta você à empresa e registra tudo com segurança (incluindo o código de confirmação ao fim do serviço).",
    palavras: ["pagar", "pagamento", "receber", "recebo", "dinheiro", "pix", "quando recebo", "valor", "me pagar"],
  },
  {
    id: "codigo",
    publico: "profissional",
    pergunta: "Como funciona o código de confirmação?",
    resposta:
      "Quando você termina o serviço, a empresa te passa um código de 4 dígitos. Você digita esse código no app para confirmar que esteve lá e concluiu o trabalho. Isso protege você e a empresa, e libera a avaliação.",
    palavras: ["codigo", "confirmar", "confirmacao", "4 digitos", "quatro digitos", "digitar codigo", "codigo errado"],
  },
  {
    id: "vagas-aparecem",
    publico: "profissional",
    pergunta: "Como as vagas aparecem para mim?",
    resposta:
      "As vagas aparecem conforme a sua REGIÃO (perto de você) e a sua DISPONIBILIDADE e profissões cadastradas no seu perfil. Por isso, quanto mais completo o seu currículo, mais vagas certas chegam até você. Você também recebe aviso quando sai uma vaga no seu dia disponível.",
    palavras: ["vagas aparecem", "nao aparece vaga", "poucas vagas", "nenhuma vaga", "regiao", "perto", "disponibilidade", "aviso", "notificacao", "mapa", "localizacao"],
  },
  {
    id: "selo-indicado",
    publico: "profissional",
    pergunta: "Como ganho o selo \"Indicado\"?",
    resposta:
      "O selo Indicado é dado a quem conclui 10 trabalhos com boa avaliação (nota 4,5 ou mais). Com ele, você aparece em destaque e na frente nas recomendações para as empresas. Dá uma olhada nas \"Suas metas\" no perfil para ver quanto falta!",
    palavras: ["selo", "indicado", "meta", "metas", "destaque", "verificado"],
  },
  {
    id: "melhorar-perfil",
    publico: "profissional",
    pergunta: "Como melhoro meu perfil?",
    resposta:
      "Capriche no currículo: adicione foto, suas profissões, experiência, uma boa descrição, disponibilidade e fotos de trabalhos (portfólio). Perfis completos ganham o selo Verificado e aparecem melhor para as empresas.",
    palavras: ["perfil", "curriculo", "melhorar", "portfolio", "foto", "experiencia", "completar perfil"],
  },

  // ── GERAIS (os dois) ──
  {
    id: "como-funciona",
    publico: "geral",
    pergunta: "Como funciona o {app}?",
    resposta:
      "O {app} conecta empresas que precisam de trabalhadores com profissionais prontos para trabalhar, na sua região. A empresa publica a vaga, o profissional se candidata, combinam o serviço, realizam o trabalho e se avaliam. Simples, rápido e com reputação.",
    palavras: ["como funciona", "o que e", "pra que serve", "para que serve", "explica", "funciona"],
  },
  {
    id: "seguranca",
    publico: "geral",
    pergunta: "É seguro?",
    resposta:
      "Sim. Cada serviço tem código de confirmação, avaliação dos dois lados e histórico. Isso cria confiança: empresas veem a reputação dos profissionais e vice-versa. Quanto mais você usa, mais forte fica a sua reputação.",
    palavras: ["seguro", "seguranca", "confiavel", "confianca", "golpe", "fraude", "medo"],
  },
  {
    id: "avaliacao",
    publico: "geral",
    pergunta: "Como funciona a avaliação?",
    resposta:
      "Ao fim de cada serviço confirmado, empresa e profissional se avaliam com estrelas (1 a 5) e um comentário. É obrigatório e ajuda toda a comunidade a saber com quem está lidando.",
    palavras: ["avaliacao", "avaliar", "estrela", "estrelas", "nota", "comentario", "reputacao"],
  },
  {
    id: "senha",
    publico: "geral",
    pergunta: "Esqueci minha senha",
    resposta:
      "Sem problema! Na tela de entrada, toque em \"Esqueci minha senha\", informe seu email e você receberá um link para criar uma nova senha.",
    palavras: ["senha", "esqueci", "redefinir", "nao consigo entrar", "login", "entrar", "acessar conta"],
  },
];

// ═══════════════════════════════════════════════════════════════════
// Lógica (não precisa mexer para editar textos)
// ═══════════════════════════════════════════════════════════════════

export type TipoUsuario = "empresa" | "profissional";

export const normalizar = (t: string) =>
  t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

/** Troca {app}, {assistente}, {prazo} e {nome}. */
export const preencher = (texto: string, nome?: string | null) =>
  texto
    .replace(/\{app\}/g, NOME_APP)
    .replace(/\{assistente\}/g, NOME_ASSISTENTE)
    .replace(/\{prazo\}/g, PRAZO_RESPOSTA)
    .replace(/\{nome\}/g, nome?.trim() ? `, ${nome.trim().split(/\s+/)[0]}` : "");

/** Tópicos que o usuário vê: os do seu tipo primeiro, depois os gerais. */
export const topicosPara = (tipo: TipoUsuario) => [
  ...TOPICOS.filter((t) => t.publico === tipo),
  ...TOPICOS.filter((t) => t.publico === "geral"),
];

const contem = (texto: string, chave: string) => {
  const k = normalizar(chave);
  if (!k) return false;
  // palavra inteira (evita "taxa" casar dentro de outra palavra); símbolos como "5%" casam direto
  if (/^[\w ]+$/.test(k)) return new RegExp(`(^|[^a-z0-9])${k.replace(/ /g, "\\s+")}([^a-z0-9]|$)`).test(texto);
  return texto.includes(k);
};

/**
 * Detecta a intenção de um texto livre por palavras-chave.
 * Pontua cada tópico do tipo do usuário (+ gerais): expressões com várias
 * palavras valem mais. Devolve o melhor tópico ou null se nada bater.
 */
export const detectarIntencao = (texto: string, tipo: TipoUsuario): Topico | null => {
  const t = normalizar(texto);
  if (t.length < 2) return null;
  let melhor: { topico: Topico; pontos: number } | null = null;
  for (const topico of topicosPara(tipo)) {
    let pontos = 0;
    for (const p of topico.palavras) {
      if (contem(t, p)) pontos += normalizar(p).split(" ").length > 1 ? 3 : 1;
    }
    // o próprio texto do botão também conta (ex.: usuário digitou a pergunta)
    if (normalizar(preencher(topico.pergunta)).replace(/[?"]/g, "") === t.replace(/[?"]/g, "")) pontos += 10;
    // empate: vale o tópico do tipo do usuário (vem antes na lista)
    if (pontos > 0 && (!melhor || pontos > melhor.pontos)) melhor = { topico, pontos };
  }
  return melhor?.topico ?? null;
};
