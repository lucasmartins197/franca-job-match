import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogOut, Plus, ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useMyJobs, useCreateJob } from "@/hooks/useJobs";
import { CATEGORIES, SKILLS, NEIGHBORHOODS } from "@/data/mockData";
import { motion } from "framer-motion";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: myJobs = [], isLoading } = useMyJobs();
  const createJob = useCreateJob();
  const [showForm, setShowForm] = useState(false);

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

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const resetForm = () => {
    setTitle(""); setCategory(""); setSkill(""); setDescription("");
    setDate(""); setTimeStart(""); setTimeEnd(""); setPayment("");
    setSlots("1"); setNeighborhood(""); setAddress("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title || !category || !skill || !date || !timeStart || !timeEnd || !payment) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    try {
      await createJob.mutateAsync({
        user_id: user.id,
        company_name: user.user_metadata?.nome || "Empresa",
        title,
        category,
        skill,
        description,
        date,
        time_start: timeStart,
        time_end: timeEnd,
        payment: Number(payment),
        slots: Number(slots),
        slots_remaining: Number(slots),
        neighborhood,
        address,
        status: "aberta",
      });
      toast.success("Vaga publicada com sucesso!");
      resetForm();
      setShowForm(false);
    } catch {
      toast.error("Erro ao publicar vaga");
    }
  };

  if (showForm) {
    return (
      <div className="min-h-screen bg-background max-w-lg mx-auto pb-8">
        <div className="bg-gradient-hero px-5 pt-12 pb-6 rounded-b-3xl">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowForm(false)} className="w-9 h-9 rounded-xl bg-primary-foreground/15 flex items-center justify-center">
              <ArrowLeft className="h-5 w-5 text-primary-foreground" />
            </button>
            <h1 className="text-xl font-extrabold text-primary-foreground">Nova Vaga</h1>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="px-5 mt-6 space-y-4">
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
          <Button type="submit" disabled={createJob.isPending} className="w-full h-14 rounded-2xl bg-gradient-brand text-primary-foreground font-bold text-lg shadow-brand" size="lg">
            {createJob.isPending ? "Publicando..." : "Publicar Vaga"}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto pb-8">
      <div className="bg-gradient-hero px-5 pt-12 pb-8 rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-extrabold text-primary-foreground">ELOOPS</h1>
          <button onClick={handleSignOut} className="w-10 h-10 bg-primary-foreground/15 rounded-xl flex items-center justify-center">
            <LogOut className="h-5 w-5 text-primary-foreground" />
          </button>
        </div>
        <p className="text-primary-foreground/70 text-sm">Painel da Empresa</p>
      </div>

      <div className="px-5 mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-card">
            <div className="text-2xl mb-1">📋</div>
            <div className="text-2xl font-extrabold text-foreground">{myJobs.length}</div>
            <div className="text-xs text-muted-foreground font-medium">Vagas ativas</div>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-card">
            <div className="text-2xl mb-1">👥</div>
            <div className="text-2xl font-extrabold text-foreground">0</div>
            <div className="text-xs text-muted-foreground font-medium">Candidatos</div>
          </div>
        </div>

        <Button onClick={() => setShowForm(true)} className="w-full h-14 rounded-2xl bg-gradient-brand text-primary-foreground font-bold text-lg shadow-brand" size="lg">
          <Plus className="mr-2 h-5 w-5" /> Nova Vaga
        </Button>

        {myJobs.length === 0 && !isLoading && (
          <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-card text-center">
            <div className="text-4xl mb-3">🚀</div>
            <h3 className="font-bold text-foreground mb-1">Comece agora</h3>
            <p className="text-sm text-muted-foreground">Publique sua primeira vaga e encontre profissionais qualificados.</p>
          </div>
        )}

        {myJobs.map((job) => (
          <motion.div key={job.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-4 border border-border/50 shadow-card">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-foreground">{job.title}</h3>
                <p className="text-sm text-muted-foreground">{job.category} • {job.skill}</p>
              </div>
              <span className="text-xs bg-brand-green-light text-brand-green font-semibold px-2 py-1 rounded-lg">{job.status}</span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span>📅 {new Date(job.date).toLocaleDateString("pt-BR")}</span>
              <span>💰 R${job.payment}</span>
              <span>👥 {job.slots_remaining}/{job.slots}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
