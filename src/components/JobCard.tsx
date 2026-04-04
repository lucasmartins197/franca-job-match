import { Job } from "@/types";
import { MapPin, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface JobCardProps {
  job: Job;
  index?: number;
  onClick?: () => void;
}

const JobCard = ({ job, index = 0, onClick }: JobCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) onClick();
    else navigate(`/job/${job.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      onClick={handleClick}
      className="bg-card rounded-xl p-4 cursor-pointer border border-border hover:border-gold/20 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-foreground truncate">{job.title}</h3>
          <p className="text-sm text-muted-foreground">{job.companyName}</p>
        </div>
        <span className="ml-2 shrink-0 px-2.5 py-1 rounded-md text-xs font-medium bg-gold/10 text-gold">
          {job.category}
        </span>
      </div>
      <div className="flex items-center gap-4 mb-3 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 text-gold/60" />
          {job.neighborhood}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5 text-gold/60" />
          {job.timeStart} – {job.timeEnd}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-display font-bold text-lg text-gold">R${job.payment}</span>
        <span className="text-xs text-muted-foreground">{new Date(job.date).toLocaleDateString("pt-BR")}</span>
      </div>
    </motion.div>
  );
};

export default JobCard;
