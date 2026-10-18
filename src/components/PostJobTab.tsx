import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCreateJob } from "@/hooks/useJobs";
import { useMyProfile, useTravaNovaVaga } from "@/hooks/useFrela";
import { CATEGORIAS } from "@/lib/categorias";


const PostJobTab = ({ onClose }: { onClose?: () => void }) => {
  const { user } = useAuth();
  const createJob = useCreateJob();
  const { data: profile } = useMyProfile();
  const { bloqueado, motivo } = useTravaNovaVaga();
  const { data: empresaDados } = useQuery({
    queryKey: ["empresa-dados", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("empresa_dados").select("*").eq("profile_id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const [submitted, setSubmitted] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [skill, setSkill] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");
  const [payment, setPayment] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [address, setAddress] = useState("");

  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Faça login primeiro"); return; }
    if (bloqueado) {
      toast.error(motivo === "taxas" ? "Quite as taxas em aberto para criar novas vagas." : "Confirme a finalização da contratação em andamento antes de criar uma nova vaga.");
      return;
    }
    if (!title.trim() || !category || !description.trim() || !date || !timeStart || !timeEnd || !address.trim()) {
      toast.error("Preencha todos os campos obrigatórios (*)");
      return;
    }
    const valor = Number(payment.replace(",", "."));
    if (!Number.isFinite(valor) || valor <= 0) {
      toast.error("Informe um valor maior que zero");
      return;
    }
    if (date < today) {
      toast.error("A data não pode estar no passado");
      return;
    }
    try {
      await createJob.mutateAsync({
        user_id: user.id,
        company_name: empresaDados?.nome_empresa || profile?.nome || user.user_metadata?.nome || "Empresa",
        title: title.trim(),
        category,
        skill: skill || category,
        description: description.trim(),
        date,
        time_start: timeStart,
        time_end: timeEnd,
        payment: Math.round(valor * 100) / 100,
        slots: 1,
        slots_remaining: 1,
        neighborhood: neighborhood.trim(),
        address: address.trim(),
        status: "aberta",
      });
      setSubmitted(true);
      toast.success("Vaga publicada!");
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Erro ao publicar vaga");
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold text-foreground mb-2">Vaga publicada!</h2>
          <p className="text-muted-foreground mb-6 text-sm">Você será notificado quando alguém se candidatar.</p>
          <Button onClick={() => { setSubmitted(false); onClose?.(); }} className="text-primary-foreground rounded-xl font-semibold">
            Fechar
          </Button>
        </motion.div>
      </div>
    );
  }

  if (bloqueado) {
    return (
      <div className="flex flex-col items-center text-center py-8">
        <Lock className="h-12 w-12 text-amber-500 mb-4" />
        <h2 className="font-display font-bold text-foreground mb-2">Criação de vaga bloqueada</h2>
        <p className="text-sm text-muted-foreground">
          {motivo === "taxas"
            ? "Seu saldo de taxas atingiu o limite. Quite as taxas em “Minhas taxas” para voltar a publicar vagas."
            : "Você tem uma contratação em andamento. Confirme a finalização dela no painel antes de criar uma nova vaga."}
        </p>
      </div>
    );
  }

  const field = "h-12 rounded-xl bg-card border-border text-foreground";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">Título da vaga *</label>
        <Input placeholder="Ex: Garçom para evento" value={title} onChange={(e) => setTitle(e.target.value)} className={field} />
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Categoria *</label>
          <Select value={category} onValueChange={(v) => { setCategory(v); setSkill(""); }}>
            <SelectTrigger className="h-12 rounded-xl bg-card border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>{CATEGORIAS.map((c) => <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Função</label>
          <Select value={skill} onValueChange={setSkill}>
            <SelectTrigger className="h-12 rounded-xl bg-card border-border" disabled={!category}><SelectValue placeholder={category ? "Opcional" : "Escolha a categoria"} /></SelectTrigger>
            <SelectContent>{(CATEGORIAS.find((c) => c.nome === category)?.funcoes ?? []).map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">Descrição *</label>
        <Textarea placeholder="O que o profissional vai fazer, traje, requisitos..." value={description} onChange={(e) => setDescription(e.target.value)}
          className="rounded-xl bg-card border-border text-foreground min-h-[80px]" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Valor (R$) *</label>
          <Input type="number" inputMode="decimal" min="1" step="0.01" placeholder="150" value={payment} onChange={(e) => setPayment(e.target.value)} className={field} />
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Data *</label>
          <Input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} className={field} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Início *</label>
          <Input type="time" value={timeStart} onChange={(e) => setTimeStart(e.target.value)} className={field} />
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Término *</label>
          <Input type="time" value={timeEnd} onChange={(e) => setTimeEnd(e.target.value)} className={field} />
        </div>
      </div>
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">Bairro</label>
        <Input placeholder="Ex: Centro" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} className={field} />
      </div>
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">Endereço *</label>
        <Input placeholder="Rua, número — Franca/SP" value={address} onChange={(e) => setAddress(e.target.value)} className={field} />
      </div>
      <Button type="submit" disabled={createJob.isPending}
        className="w-full h-12 rounded-xl text-primary-foreground font-semibold text-base">
        {createJob.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Publicar vaga"}
      </Button>
    </form>
  );
};

export default PostJobTab;
