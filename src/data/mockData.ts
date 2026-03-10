import { Company, Freelancer, Job, JobCategory, Skill } from "@/types";

export const CATEGORIES: { name: JobCategory; icon: string; count: number }[] = [
  { name: "Bares e Restaurantes", icon: "🍽️", count: 2840 },
  { name: "Comércio", icon: "🛍️", count: 3200 },
  { name: "Eventos", icon: "🎉", count: 580 },
  { name: "Beleza e Estética", icon: "💇", count: 1200 },
  { name: "Indústria", icon: "🏭", count: 890 },
  { name: "Construção Civil", icon: "🏗️", count: 450 },
  { name: "Logística", icon: "🚛", count: 320 },
  { name: "Marketing e Promoção", icon: "📢", count: 210 },
  { name: "Serviços Gerais", icon: "🔧", count: 680 },
];

export const SKILLS: Skill[] = [
  "Garçom", "Bartender", "Caixa", "Atendente", "Vendedor",
  "Repositor", "Segurança", "Recepcionista", "Promotor",
  "Panfleteiro", "Auxiliar de Cozinha", "Cozinheiro",
  "Faxineiro", "Porteiro", "Carregador", "Motorista",
  "Ajudante Geral", "Pedreiro", "Pintor", "Eletricista",
  "Manicure", "Cabeleireiro", "Barbeiro",
];

export const NEIGHBORHOODS = [
  "Centro", "Jardim Paulista", "Jardim Paulistano", "Vila Santa Cruz",
  "Cidade Nova", "Jardim Petráglia", "Parque Vicente Leporace",
  "Jardim Francano", "Vila Chico Júlio", "Residencial Amazonas",
  "Jardim Luiza", "Vila Aparecida", "Prolongamento Jardim Paulista",
];

export const mockCompanies: Company[] = [
  { id: "c1", name: "Choperia do Zé", category: "Bares e Restaurantes", subcategory: "Bar", address: "Rua General Osório, 1250", neighborhood: "Centro", phone: "(16) 3711-0001", description: "Choperia tradicional de Franca com ambiente descontraído e petiscos variados.", rating: 4.5, reviewCount: 128, claimed: true },
  { id: "c2", name: "Pizzaria Bella Napoli", category: "Bares e Restaurantes", subcategory: "Pizzaria", address: "Av. Major Nicácio, 2300", neighborhood: "Jardim Paulista", phone: "(16) 3711-0002", description: "As melhores pizzas artesanais de Franca desde 1998.", rating: 4.7, reviewCount: 245, claimed: true },
  { id: "c3", name: "Shopping Franca", category: "Comércio", subcategory: "Shopping", address: "Av. Paulo VI, 1020", neighborhood: "Cidade Nova", phone: "(16) 3711-0003", description: "O maior centro comercial da região de Franca.", rating: 4.2, reviewCount: 890, claimed: true },
  { id: "c4", name: "Calçados Francanos", category: "Indústria", subcategory: "Fábrica de Calçados", address: "Distrito Industrial, 500", neighborhood: "Vila Chico Júlio", phone: "(16) 3711-0004", description: "Fábrica de calçados com mais de 30 anos de tradição.", rating: 4.3, reviewCount: 67, claimed: true },
  { id: "c5", name: "Buffet Encanto", category: "Eventos", subcategory: "Buffet", address: "Rua Voluntários da Franca, 890", neighborhood: "Jardim Petráglia", phone: "(16) 3711-0005", description: "Buffet para casamentos, formaturas e eventos corporativos.", rating: 4.8, reviewCount: 312, claimed: true },
  { id: "c6", name: "Studio Hair Franca", category: "Beleza e Estética", subcategory: "Salão de Beleza", address: "Rua Campos Sales, 456", neighborhood: "Centro", phone: "(16) 3711-0006", description: "Salão de beleza completo com profissionais especializados.", rating: 4.6, reviewCount: 189, claimed: false },
  { id: "c7", name: "Construtora Franca", category: "Construção Civil", subcategory: "Construtora", address: "Av. Champagnat, 1500", neighborhood: "Jardim Francano", phone: "(16) 3711-0007", description: "Construtora especializada em obras residenciais e comerciais.", rating: 4.1, reviewCount: 45, claimed: false },
  { id: "c8", name: "TransLog Franca", category: "Logística", subcategory: "Transportadora", address: "Rod. Cândido Portinari, km 5", neighborhood: "Vila Santa Cruz", phone: "(16) 3711-0008", description: "Transportadora regional com frota moderna.", rating: 4.0, reviewCount: 34, claimed: false },
  { id: "c9", name: "Hamburgueria The Burger", category: "Bares e Restaurantes", subcategory: "Hamburgueria", address: "Rua Saldanha Marinho, 780", neighborhood: "Jardim Paulistano", phone: "(16) 3711-0009", description: "Hambúrgueres artesanais e cervejas especiais.", rating: 4.6, reviewCount: 567, claimed: true },
  { id: "c10", name: "Loja TechCell", category: "Comércio", subcategory: "Loja de Celular", address: "Rua General Osório, 900", neighborhood: "Centro", phone: "(16) 3711-0010", description: "Acessórios e assistência técnica para celulares.", rating: 4.0, reviewCount: 156, claimed: true },
  { id: "c11", name: "Bar do Mineiro", category: "Bares e Restaurantes", subcategory: "Bar", address: "Rua Monsenhor Rosa, 340", neighborhood: "Centro", phone: "(16) 3711-0011", description: "Boteco raiz com comida mineira e cerveja gelada.", rating: 4.4, reviewCount: 298, claimed: true },
  { id: "c12", name: "Agência PromoAction", category: "Marketing e Promoção", subcategory: "Agência", address: "Av. Major Nicácio, 1800", neighborhood: "Jardim Paulista", description: "Agência especializada em ações promocionais e degustação.", rating: 4.3, reviewCount: 42, claimed: true },
];

export const mockFreelancers: Freelancer[] = [
  { id: "f1", name: "Lucas Oliveira", photo: "", age: 24, phone: "(16) 99900-0001", neighborhood: "Centro", bio: "Garçom experiente com 4 anos de atuação em eventos e restaurantes de Franca.", skills: ["Garçom", "Bartender", "Auxiliar de Cozinha"], rating: 4.8, reviewCount: 47, jobsCompleted: 52, availability: { seg: ["manhã", "tarde"], ter: ["manhã", "tarde"], qua: ["manhã", "tarde"], qui: ["manhã", "tarde", "noite"], sex: ["noite"], sab: ["manhã", "tarde", "noite"], dom: ["manhã"] } },
  { id: "f2", name: "Ana Santos", photo: "", age: 28, phone: "(16) 99900-0002", neighborhood: "Jardim Paulista", bio: "Promotora e recepcionista com experiência em eventos corporativos.", skills: ["Promotor", "Recepcionista", "Atendente"], rating: 4.9, reviewCount: 63, jobsCompleted: 71, availability: { seg: ["manhã", "tarde"], ter: ["manhã", "tarde"], qua: ["manhã", "tarde"], qui: ["manhã", "tarde"], sex: ["manhã", "tarde", "noite"], sab: ["manhã", "tarde", "noite"], dom: [] } },
  { id: "f3", name: "Pedro Henrique", photo: "", age: 22, phone: "(16) 99900-0003", neighborhood: "Cidade Nova", bio: "Vendedor e caixa com experiência no comércio de Franca.", skills: ["Vendedor", "Caixa", "Repositor"], rating: 4.5, reviewCount: 28, jobsCompleted: 33, availability: { seg: ["tarde", "noite"], ter: ["tarde", "noite"], qua: ["tarde", "noite"], qui: ["tarde", "noite"], sex: ["tarde", "noite"], sab: ["manhã", "tarde", "noite"], dom: ["manhã", "tarde"] } },
  { id: "f4", name: "Mariana Costa", photo: "", age: 30, phone: "(16) 99900-0004", neighborhood: "Jardim Petráglia", bio: "Cozinheira especializada em buffets e eventos de grande porte.", skills: ["Cozinheiro", "Auxiliar de Cozinha"], rating: 4.7, reviewCount: 89, jobsCompleted: 95, availability: { seg: ["manhã", "tarde"], ter: ["manhã", "tarde"], qua: [], qui: ["manhã", "tarde"], sex: ["manhã", "tarde", "noite"], sab: ["manhã", "tarde", "noite"], dom: [] } },
  { id: "f5", name: "Carlos Eduardo", photo: "", age: 35, phone: "(16) 99900-0005", neighborhood: "Vila Santa Cruz", bio: "Segurança patrimonial e porteiro com curso de vigilante.", skills: ["Segurança", "Porteiro"], rating: 4.6, reviewCount: 41, jobsCompleted: 48, availability: { seg: ["noite"], ter: ["noite"], qua: ["noite"], qui: ["noite"], sex: ["noite"], sab: ["noite"], dom: ["noite"] } },
  { id: "f6", name: "Julia Ferreira", photo: "", age: 26, phone: "(16) 99900-0006", neighborhood: "Jardim Francano", bio: "Manicure e cabeleireira com atendimento domiciliar.", skills: ["Manicure", "Cabeleireiro"], rating: 4.9, reviewCount: 112, jobsCompleted: 130, availability: { seg: ["manhã", "tarde"], ter: ["manhã", "tarde"], qua: ["manhã", "tarde"], qui: ["manhã", "tarde"], sex: ["manhã", "tarde"], sab: ["manhã"], dom: [] } },
];

export const mockJobs: Job[] = [
  { id: "j1", companyId: "c1", companyName: "Choperia do Zé", title: "Garçom para sexta à noite", category: "Bares e Restaurantes", skill: "Garçom", description: "Precisamos de garçom experiente para atender nosso salão na sexta-feira. Uniforme fornecido. Refeição inclusa.", date: "2026-03-14", timeStart: "18:00", timeEnd: "02:00", payment: 150, slots: 2, slotsRemaining: 1, neighborhood: "Centro", address: "Rua General Osório, 1250", status: "aberta", postedAt: "2026-03-10T08:00:00" },
  { id: "j2", companyId: "c5", companyName: "Buffet Encanto", title: "Auxiliar de cozinha para casamento", category: "Eventos", skill: "Auxiliar de Cozinha", description: "Casamento para 200 pessoas. Precisamos de auxílio na montagem, preparo e limpeza da cozinha.", date: "2026-03-15", timeStart: "14:00", timeEnd: "23:00", payment: 200, slots: 3, slotsRemaining: 3, neighborhood: "Jardim Petráglia", address: "Rua Voluntários da Franca, 890", status: "aberta", postedAt: "2026-03-09T14:00:00" },
  { id: "j3", companyId: "c3", companyName: "Shopping Franca", title: "Promotor para ação de Páscoa", category: "Marketing e Promoção", skill: "Promotor", description: "Ação promocional de Páscoa no shopping. Distribuição de brindes e interação com clientes. Fantasia fornecida.", date: "2026-03-20", timeStart: "10:00", timeEnd: "18:00", payment: 180, slots: 5, slotsRemaining: 4, neighborhood: "Cidade Nova", address: "Av. Paulo VI, 1020", status: "aberta", postedAt: "2026-03-10T10:00:00" },
  { id: "j4", companyId: "c9", companyName: "Hamburgueria The Burger", title: "Caixa para fim de semana", category: "Bares e Restaurantes", skill: "Caixa", description: "Precisamos de caixa com experiência para sábado e domingo. Sistema PDV já instalado.", date: "2026-03-15", timeStart: "17:00", timeEnd: "00:00", payment: 130, slots: 1, slotsRemaining: 1, neighborhood: "Jardim Paulistano", address: "Rua Saldanha Marinho, 780", status: "aberta", postedAt: "2026-03-10T09:30:00" },
  { id: "j5", companyId: "c10", companyName: "Loja TechCell", title: "Vendedor para semana de promoção", category: "Comércio", skill: "Vendedor", description: "Semana de promoção de celulares. Precisamos de vendedor com boa comunicação e experiência em eletrônicos.", date: "2026-03-17", timeStart: "09:00", timeEnd: "18:00", payment: 120, slots: 2, slotsRemaining: 2, neighborhood: "Centro", address: "Rua General Osório, 900", status: "aberta", postedAt: "2026-03-10T07:00:00" },
  { id: "j6", companyId: "c4", companyName: "Calçados Francanos", title: "Carregador para expedição", category: "Indústria", skill: "Carregador", description: "Auxiliar na expedição de mercadorias. Carga e descarga de caixas de calçados. Necessário disposição física.", date: "2026-03-13", timeStart: "07:00", timeEnd: "16:00", payment: 140, slots: 4, slotsRemaining: 2, neighborhood: "Vila Chico Júlio", address: "Distrito Industrial, 500", status: "candidatos", postedAt: "2026-03-08T06:00:00" },
  { id: "j7", companyId: "c11", companyName: "Bar do Mineiro", title: "Bartender para happy hour", category: "Bares e Restaurantes", skill: "Bartender", description: "Happy hour especial com drinks autorais. Procuramos bartender criativo e com experiência em coquetelaria.", date: "2026-03-14", timeStart: "16:00", timeEnd: "23:00", payment: 170, slots: 1, slotsRemaining: 1, neighborhood: "Centro", address: "Rua Monsenhor Rosa, 340", status: "aberta", postedAt: "2026-03-10T11:00:00" },
  { id: "j8", companyId: "c12", companyName: "Agência PromoAction", title: "Panfleteiro para ação na rua", category: "Marketing e Promoção", skill: "Panfleteiro", description: "Distribuição de panfletos no centro de Franca. Uniforme e material fornecidos. Pagamento no mesmo dia.", date: "2026-03-12", timeStart: "08:00", timeEnd: "14:00", payment: 80, slots: 6, slotsRemaining: 6, neighborhood: "Centro", address: "Av. Major Nicácio, 1800", status: "aberta", postedAt: "2026-03-10T12:00:00" },
];
