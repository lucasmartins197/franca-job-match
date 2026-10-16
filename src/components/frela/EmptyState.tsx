import { ReactNode } from "react";
import { Inbox, LucideIcon } from "lucide-react";

interface Props {
  icon?: LucideIcon;
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
}

/** Estado vazio padrão ("nada aqui ainda"). */
const EmptyState = ({ icon: Icon = Inbox, titulo, descricao, acao }: Props) => (
  <div className="flex flex-col items-center text-center py-14 px-6">
    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
      <Icon className="h-8 w-8 text-primary" />
    </div>
    <p className="font-display font-bold text-foreground">{titulo}</p>
    {descricao && <p className="text-sm text-muted-foreground mt-1 max-w-xs">{descricao}</p>}
    {acao && <div className="mt-5">{acao}</div>}
  </div>
);

export default EmptyState;
