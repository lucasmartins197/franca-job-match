const SIZES = { sm: "text-xl", md: "text-3xl", lg: "text-5xl" };

/** Marca FreLa: "Fre" em tinta + "La" na cor da marca. */
const Logo = ({ size = "md", className = "" }: { size?: keyof typeof SIZES; className?: string }) => (
  <span className={`font-display font-extrabold tracking-tight ${SIZES[size]} ${className}`}>
    <span className="text-foreground">Fre</span>
    <span className="text-primary">La</span>
  </span>
);

export default Logo;
