import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, SKILLS, NEIGHBORHOODS } from "@/data/mockData";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useCreateJob } from "@/hooks/useJobs";

const PostJobTab = () => {
  const { user } = useAuth();
  const createJob = useCreateJob();
  const [submitted, setSubmitted] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [skill, setSkill] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");
  const [payment, setPayment] = useState("");
  const [slots, setSlots] = useState("1");
  const [neighborhood, setNeighborhood] = useState("");
  const [address, setAddress] = useState("");

  const resetForm = () => {
    setTitle(""); setCategory(""); setSkill(""); setDescription("");
    setDate(""); setTimeStart(""); setTimeEnd(""); setPayment("");
    setSlots("1"); setNeighborhood(""); setAddress("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Faça login primeiro"); return; }
    if (!title || !category || !skill || !date || !timeStart || !timeEnd || !payment) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    try {
      await createJob.mutateAsync({
        user_id: user.id,
        company_name: user.user_metadata?.nome || "Empresa",
        title, category, skill, description, date,
        time_start: timeStart, time_end: timeEnd,
        payment: Number(payment), slots: Number(slots),
        slots_remaining: Number(slots), neighborhood, address, status: "aberta",
      });
      setSubmitted(true);
      resetForm();
      toast.success("Vaga publicada com sucesso!");
    } catch {
      toast.error("Erro ao publicar vaga");
    }
  };

  if (submitted) {
    return (
      <div className="pb-20 pt-12 px-5 flex flex-col items-center justify-center min-h-[70vh]">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <CheckCircle2 className="h-20 w-20 text-brand-green mx-auto mb-4" />
          <h2 className="text-2xl font-extrabold text-foreground mb-2">Vaga Publicada!</h2>
          <p className="text-muted-foreground mb-6">Freelancers serão notificados sobre sua vaga.</p>
          <Button onClick={() => setSubmitted(false)} className="bg-gradient-brand text-primary-foreground rounded-xl shadow-brand">Publicar outra vaga</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pb-20 pt-12 px-5">
      <h1 className="text-2xl font-extrabold text-foreground mb-1">Publicar Vaga</h1>
      <p className="text-muted-foreground text-sm mb-6">Encontre freelancers para seu negócio</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label className="text-sm font-semibold">Título da vaga *</Label>
          <Input placeholder="Ex: Garçom para evento" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 rounded-xl h-12" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm font-semibold">Categoria *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-1 rounded-xl h-12"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{CATEGORIES.map((c) => (<SelectItem key={c.name} value={c.name}>{c.icon} {c.name}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-semibold">Habilidade *</Label>
            <Select value={skill} onValueChange={setSkill}>
              <SelectTrigger className="mt-1 rounded-xl h-12"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{SKILLS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label className="text-sm font-semibold">Descrição</Label>
          <Textarea placeholder="Descreva a vaga..." value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 rounded-xl min-h-[100px]" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm font-semibold">Data *</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 rounded-xl h-12" />
          </div>
          <div>
            <Label className="text-sm font-semibold">Pagamento (R$) *</Label>
            <Input type="number" placeholder="150" value={payment} onChange={(e) => setPayment(e.target.value)} className="mt-1 rounded-xl h-12" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm font-semibold">Início *</Label>
            <Input type="time" value={timeStart} onChange={(e) => setTimeStart(e.target.value)} className="mt-1 rounded-xl h-12" />
          </div>
          <div>
            <Label className="text-sm font-semibold">Término *</Label>
            <Input type="time" value={timeEnd} onChange={(e) => setTimeEnd(e.target.value)} className="mt-1 rounded-xl h-12" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm font-semibold">Vagas</Label>
            <Input type="number" value={slots} onChange={(e) => setSlots(e.target.value)} className="mt-1 rounded-xl h-12" />
          </div>
          <div>
            <Label className="text-sm font-semibold">Bairro</Label>
            <Select value={neighborhood} onValueChange={setNeighborhood}>
              <SelectTrigger className="mt-1 rounded-xl h-12"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{NEIGHBORHOODS.map((n) => (<SelectItem key={n} value={n}>{n}</SelectItem>))}</SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label className="text-sm font-semibold">Endereço</Label>
          <Input placeholder="Rua, número" value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1 rounded-xl h-12" />
        </div>
        <Button type="submit" disabled={createJob.isPending} className="w-full h-14 rounded-2xl bg-gradient-brand text-primary-foreground font-bold text-lg shadow-brand hover:opacity-90 transition-opacity mt-4" size="lg">
          {createJob.isPending ? "Publicando..." : "Publicar Vaga"}
        </Button>
      </form>
    </div>
  );
};

export default PostJobTab;
