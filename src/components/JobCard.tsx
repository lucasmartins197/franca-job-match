import { MapPin, Clock, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import type { DbJob } from "@/hooks/useJobs";
import { formatBRL, formatDate } from "@/hooks/useFrela";

interface JobCardProps {
  job: DbJob;
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
      className="bg-card rounded-xl p-4 cursor-pointer border border-border hover:border-primary/30 transition-colors shadow-sm"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-foreground truncate">{job.title}</h3>
          <p className="text-sm text-muted-foreground">{job.company_name}</p>
        </div>
        <span className="ml-2 shrink-0 px-2.5 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary">
          {job.category}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3 text-sm text-muted-foreground">
        {job.neighborhood && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-primary/60" />
            {job.neighborhood}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5 text-primary/60" />
          {job.time_start} – {job.time_end}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-display font-bold text-lg text-primary">{formatBRL(job.payment)}</span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          {formatDate(job.date)}
        </span>
      </div>
    </motion.div>
  );
};

export default JobCard;
