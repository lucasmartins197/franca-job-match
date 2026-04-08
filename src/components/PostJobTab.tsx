import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useCreateJob } from "@/hooks/useJobs";

const CATEGORIES = [
  "Bares e Restaurantes", "Eventos", "Comércio", "Beleza e Estética",
  "Logística", "Indústria", "Construção Civil", "Marketing e Promoção", "Serviços Gerais",
];

const PostJobTab = ({ onClose }: { onClose?: () => void }) => {
  const { user } = useAuth();
  const createJob = useCreateJob();
  const [submitted, setSubmitted] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");
  const [payment, setPayment] = useState("");
  const [address, setAddress] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Faça login primeiro"); return; }
    if (!title || !category || !date || !timeStart || !payment) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    try {
      await createJob.mutateAsync({
        user_id: user.id,
        company_name: user.user_metadata?.nome || "Empresa",
        title, category, skill: category, description, date,
        time_start: timeStart, time_end: timeEnd || timeStart,
        payment: Number(payment), slots: 1, slots_remaining: 1,
        neighborhood: "Franca", address, status: "aberta",
      });
      setSubmitted(true);
      toast.success("Vaga publicada!");
    } catch {
      toast.error("Erro ao publicar vaga");
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold text-foreground mb-2">Vaga Publicada!</h2>
          <p className="text-muted-foreground mb-6 text-sm">Freelancers serão notificados.</p>
          <Button onClick={() => { setSubmitted(false); onClose?.(); }} className="gradient-brand text-primary-foreground rounded-xl font-display font-bold">
            Fechar
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">Título da vaga *</label>
        <Input placeholder="Ex: Garçom para evento" value={title} onChange={(e) => setTitle(e.target.value)}
          className="h-12 rounded-xl bg-card border-border text-foreground" />
      </div>
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">Categoria *</label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-12 rounded-xl bg-card border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">Descrição</label>
        <Textarea placeholder="Descreva a vaga..." value={description} onChange={(e) => setDescription(e.target.value)}
          className="rounded-xl bg-card border-border text-foreground min-h-[80px]" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Valor (R$) *</label>
          <Input type="number" placeholder="250" value={payment} onChange={(e) => setPayment(e.target.value)}
            className="h-12 rounded-xl bg-card border-border text-foreground" />
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Data *</label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="h-12 rounded-xl bg-card border-border text-foreground" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Início *</label>
          <Input type="time" value={timeStart} onChange={(e) => setTimeStart(e.target.value)}
            className="h-12 rounded-xl bg-card border-border text-foreground" />
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Término</label>
          <Input type="time" value={timeEnd} onChange={(e) => setTimeEnd(e.target.value)}
            className="h-12 rounded-xl bg-card border-border text-foreground" />
        </div>
      </div>
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">Endereço</label>
        <Input placeholder="Rua, número" value={address} onChange={(e) => setAddress(e.target.value)}
          className="h-12 rounded-xl bg-card border-border text-foreground" />
      </div>
      <Button type="submit" disabled={createJob.isPending}
        className="w-full h-14 rounded-xl gradient-brand text-primary-foreground font-display font-bold text-lg shadow-brand hover:opacity-90 transition-opacity">
        {createJob.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Publicar Vaga"}
      </Button>
    </form>
  );
};

export default PostJobTab;
