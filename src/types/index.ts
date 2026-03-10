export type JobCategory = 
  | "Bares e Restaurantes"
  | "Comércio"
  | "Eventos"
  | "Beleza e Estética"
  | "Indústria"
  | "Construção Civil"
  | "Logística"
  | "Marketing e Promoção"
  | "Serviços Gerais";

export type Skill =
  | "Garçom" | "Bartender" | "Caixa" | "Atendente" | "Vendedor"
  | "Repositor" | "Segurança" | "Recepcionista" | "Promotor"
  | "Panfleteiro" | "Auxiliar de Cozinha" | "Cozinheiro"
  | "Faxineiro" | "Porteiro" | "Carregador" | "Motorista"
  | "Ajudante Geral" | "Pedreiro" | "Pintor" | "Eletricista"
  | "Manicure" | "Cabeleireiro" | "Barbeiro";

export type JobStatus = "aberta" | "candidatos" | "confirmada" | "concluída";

export interface Company {
  id: string;
  name: string;
  category: JobCategory;
  subcategory: string;
  address: string;
  neighborhood: string;
  phone?: string;
  description: string;
  rating: number;
  reviewCount: number;
  claimed: boolean;
  imageUrl?: string;
}

export interface Freelancer {
  id: string;
  name: string;
  photo: string;
  age: number;
  phone: string;
  neighborhood: string;
  bio: string;
  skills: Skill[];
  rating: number;
  reviewCount: number;
  jobsCompleted: number;
  availability: Record<string, string[]>;
}

export interface Job {
  id: string;
  companyId: string;
  companyName: string;
  title: string;
  category: JobCategory;
  skill: Skill;
  description: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  payment: number;
  slots: number;
  slotsRemaining: number;
  neighborhood: string;
  address: string;
  status: JobStatus;
  postedAt: string;
}

export interface Application {
  id: string;
  jobId: string;
  freelancerId: string;
  status: "pendente" | "aceito" | "recusado";
  appliedAt: string;
}

export interface Review {
  id: string;
  fromId: string;
  fromName: string;
  toId: string;
  rating: number;
  comment: string;
  date: string;
}
