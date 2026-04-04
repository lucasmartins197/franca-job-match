import { Link } from "react-router-dom";

const NotFound = () => (
  <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
    <h1 className="text-6xl font-display font-extrabold gradient-gold-text mb-4">404</h1>
    <p className="text-muted-foreground mb-8">Página não encontrada</p>
    <Link to="/" className="px-6 py-3 rounded-xl gradient-gold text-background font-display font-bold shadow-gold">
      Voltar ao início
    </Link>
  </div>
);

export default NotFound;
