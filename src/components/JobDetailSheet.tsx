import { Job } from "@/types";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Banknote, Users, Calendar, Building2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface JobDetailSheetProps {
  job: Job | null;
  onClose: () => void;
}

const JobDetailSheet = ({ job, onClose }: JobDetailSheetProps) => {
  const [applied, setApplied] = useState(false);

  const handleApply = () => {
    setApplied(true);
    toast.success("Candidatura enviada!", {
      description: `Você se candidatou para "${job?.title}"`,
    });
  };

  const handleClose = () => {
    setApplied(false);
    onClose();
  };

  if (!job) return null;

  return (
    <Sheet open={!!job} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto p-0">
        <div className="p-6">
          <SheetHeader className="text-left mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-brand-blue-light text-primary font-semibold border-0">
                {job.skill}
              </Badge>
              <Badge variant="outline" className="text-brand-green border-brand-green font-semibold">
                {job.status === "aberta" ? "Aberta" : job.status}
              </Badge>
            </div>
            <SheetTitle className="text-xl font-extrabold">{job.title}</SheetTitle>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span className="font-medium">{job.companyName}</span>
            </div>
          </SheetHeader>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <InfoBox icon={<Calendar className="h-4 w-4 text-primary" />} label="Data" value={new Date(job.date).toLocaleDateString("pt-BR")} />
            <InfoBox icon={<Clock className="h-4 w-4 text-primary" />} label="Horário" value={`${job.timeStart} – ${job.timeEnd}`} />
            <InfoBox icon={<Banknote className="h-4 w-4 text-brand-green" />} label="Pagamento" value={`R$${job.payment}`} highlight />
            <InfoBox icon={<Users className="h-4 w-4 text-primary" />} label="Vagas" value={`${job.slotsRemaining} de ${job.slots}`} />
          </div>

          <div className="mb-6">
            <h3 className="font-bold text-foreground mb-2">Descrição</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{job.description}</p>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <MapPin className="h-4 w-4 text-primary" />
            <span>{job.address}, {job.neighborhood}</span>
          </div>

          {applied ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-3 py-4"
            >
              <CheckCircle2 className="h-12 w-12 text-brand-green" />
              <p className="font-bold text-foreground">Candidatura enviada!</p>
              <p className="text-sm text-muted-foreground text-center">A empresa será notificada e entrará em contato.</p>
            </motion.div>
          ) : (
            <Button
              onClick={handleApply}
              className="w-full h-14 rounded-2xl bg-gradient-brand text-primary-foreground font-bold text-lg shadow-brand hover:opacity-90 transition-opacity"
              size="lg"
            >
              Candidatar-se • R${job.payment}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

const InfoBox = ({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) => (
  <div className="bg-muted/50 rounded-xl p-3">
    <div className="flex items-center gap-1.5 mb-1">
      {icon}
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
    <span className={`font-bold text-sm ${highlight ? "text-brand-green" : "text-foreground"}`}>{value}</span>
  </div>
);

export default JobDetailSheet;
