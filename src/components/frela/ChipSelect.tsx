import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
  /** Permite adicionar opção que não está na lista. */
  allowCustom?: boolean;
}

const ChipSelect = ({ options, value, onChange, allowCustom }: Props) => {
  const [custom, setCustom] = useState("");
  const todas = [...options, ...value.filter((v) => !options.includes(v))];

  const toggle = (opt: string) =>
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);

  const addCustom = () => {
    const v = custom.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setCustom("");
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {todas.map((opt) => {
          const ativo = value.includes(opt);
          return (
            <button key={opt} type="button" onClick={() => toggle(opt)} aria-pressed={ativo}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm border transition-colors",
                ativo ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:border-primary/40"
              )}>
              {opt}
            </button>
          );
        })}
      </div>
      {allowCustom && (
        <div className="flex gap-2 mt-3">
          <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Outra..."
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
            className="flex-1 h-10 rounded-xl border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          <button type="button" onClick={addCustom} aria-label="Adicionar"
            className="w-10 h-10 rounded-xl border border-border bg-card flex items-center justify-center">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ChipSelect;
