import {
  Package, Footprints, Wine, ChefHat, Sparkles, HardHat, ShoppingBag, Scissors,
  Briefcase, Hammer, ShieldCheck, HeartPulse, Bike, Megaphone, LucideIcon,
} from "lucide-react";

export interface Categoria {
  id: string;
  /** Nome gravado em jobs.category */
  nome: string;
  /** Nome curto para o card */
  curto: string;
  icon: LucideIcon;
  /** Classes de cor do card (tons próximos da identidade verde-petróleo) */
  cor: string;
  /** Funções sugeridas (jobs.skill) */
  funcoes: string[];
  /** Categorias antigas que caem aqui (vagas criadas antes da Fase 3) */
  legado?: string[];
}

/** Categorias de Franca/SP — capital do calçado, forte em e-commerce e comércio. */
export const CATEGORIAS: Categoria[] = [
  { id: "ecommerce", nome: "E-commerce / Logística", curto: "E-commerce", icon: Package, cor: "bg-teal-100 text-teal-800", funcoes: ["Separador de pedidos", "Embalador", "Conferente", "Estoquista", "Carregador"], legado: ["Logística"] },
  { id: "calcados", nome: "Calçados / Indústria", curto: "Calçados", icon: Footprints, cor: "bg-amber-100 text-amber-800", funcoes: ["Pespontador", "Cortador", "Montador", "Acabamento", "Auxiliar de produção"], legado: ["Indústria"] },
  { id: "eventos", nome: "Garçom / Eventos", curto: "Garçom", icon: Wine, cor: "bg-rose-100 text-rose-800", funcoes: ["Garçom", "Bartender", "Recepcionista", "Copeiro"], legado: ["Bares e Restaurantes", "Eventos"] },
  { id: "cozinha", nome: "Cozinha / Gastronomia", curto: "Cozinha", icon: ChefHat, cor: "bg-orange-100 text-orange-800", funcoes: ["Cozinheiro", "Auxiliar de Cozinha", "Chapeiro", "Pizzaiolo", "Confeiteiro"] },
  { id: "limpeza", nome: "Limpeza / Doméstica", curto: "Limpeza", icon: Sparkles, cor: "bg-sky-100 text-sky-800", funcoes: ["Faxineiro", "Diarista", "Passadeira", "Auxiliar de limpeza"] },
  { id: "construcao", nome: "Construção / Obra", curto: "Obra", icon: HardHat, cor: "bg-yellow-100 text-yellow-800", funcoes: ["Pedreiro", "Servente", "Pintor", "Eletricista", "Encanador"], legado: ["Construção Civil"] },
  { id: "vendas", nome: "Vendas / Comércio", curto: "Vendas", icon: ShoppingBag, cor: "bg-emerald-100 text-emerald-800", funcoes: ["Vendedor", "Caixa", "Repositor", "Atendente"], legado: ["Comércio"] },
  { id: "beleza", nome: "Beleza / Estética", curto: "Beleza", icon: Scissors, cor: "bg-pink-100 text-pink-800", funcoes: ["Manicure", "Cabeleireiro", "Barbeiro", "Maquiador", "Esteticista"], legado: ["Beleza e Estética"] },
  { id: "administrativo", nome: "Administrativo / Escritório", curto: "Escritório", icon: Briefcase, cor: "bg-indigo-100 text-indigo-800", funcoes: ["Auxiliar administrativo", "Recepcionista", "Digitador", "Atendimento ao cliente"] },
  { id: "gerais", nome: "Trabalhos Manuais / Gerais", curto: "Gerais", icon: Hammer, cor: "bg-stone-200 text-stone-800", funcoes: ["Ajudante Geral", "Montador de móveis", "Jardineiro", "Carregador"], legado: ["Serviços Gerais"] },
  { id: "seguranca", nome: "Segurança / Portaria", curto: "Portaria", icon: ShieldCheck, cor: "bg-slate-200 text-slate-800", funcoes: ["Porteiro", "Segurança", "Vigia", "Controlador de acesso"] },
  { id: "saude", nome: "Saúde / Cuidador", curto: "Cuidador", icon: HeartPulse, cor: "bg-red-100 text-red-800", funcoes: ["Cuidador de idosos", "Acompanhante", "Técnico de enfermagem", "Babá"] },
  { id: "entregas", nome: "Entregas / Motoboy", curto: "Entregas", icon: Bike, cor: "bg-lime-100 text-lime-800", funcoes: ["Motoboy", "Entregador", "Motorista"] },
  { id: "promotor", nome: "Promotor / Panfletagem", curto: "Promotor", icon: Megaphone, cor: "bg-violet-100 text-violet-800", funcoes: ["Promotor", "Panfleteiro", "Demonstrador", "Degustação"], legado: ["Marketing e Promoção"] },
];

const POR_NOME = new Map<string, Categoria>();
for (const c of CATEGORIAS) {
  POR_NOME.set(c.nome, c);
  c.legado?.forEach((l) => POR_NOME.set(l, c));
}

/** Categoria de uma vaga (aceita nomes antigos). */
export const categoriaDe = (nome?: string | null): Categoria | undefined => (nome ? POR_NOME.get(nome) : undefined);

/** Todas as profissões conhecidas (para o perfil do profissional). */
export const TODAS_FUNCOES = Array.from(new Set(CATEGORIAS.flatMap((c) => c.funcoes)));
