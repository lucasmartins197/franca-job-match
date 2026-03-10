import { Job } from "@/types";
import { MapPin, Clock, Banknote, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface JobCardProps {
  job: Job;
  index?: number;
  onClick?: () => void;
}

const JobCard = ({ job, index = 0, onClick }: JobCardProps) => {
  const timeAgo = () => {
    const now = new Date();
    const posted = new Date(job.postedAt);
    const diffH = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60));
    if (diffH < 1) return "Agora";
    if (diffH < 24) return `${diffH}h atrás`;
    return `${Math.floor(diffH / 24)}d atrás`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      onClick={onClick}
      className="bg-card rounded-2xl p-4 shadow-card hover:shadow-card-hover transition-shadow cursor-pointer border border-border/50"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground truncate">{job.title}</h3>
          <p className="text-sm text-muted-foreground">{job.companyName}</p>
        </div>
        <Badge variant="secondary" className="ml-2 shrink-0 bg-brand-blue-light text-primary font-semibold text-xs">
          {job.skill}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          <span className="truncate">{job.neighborhood}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5 text-primary" />
          <span>{job.timeStart} – {job.timeEnd}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Banknote className="h-4 w-4 text-brand-green" />
          <span className="font-bold text-brand-green">R${job.payment}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>{job.slotsRemaining}/{job.slots}</span>
          </div>
          <span className="text-xs text-muted-foreground">{timeAgo()}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default JobCard;
