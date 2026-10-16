import { ReactNode } from "react";
import { Briefcase, Building2, Calendar, Clock, Instagram, Linkedin, MapPin, Phone, Star } from "lucide-react";
import { PerfilCompleto, instagramUrl, parseDisponibilidade, useContratacoesEmpresa, useHistoricoProfissional } from "@/hooks/usePerfil";
import { useAvaliacoesRecebidas, useProfilesByIds, formatDate } from "@/hooks/useFrela";
import UserAvatar from "@/components/frela/UserAvatar";
import Stars from "@/components/frela/Stars";

interface Props {
  perfil: PerfilCompleto;
  /** Mostra telefone (próprio perfil ou contratação confirmada). */
  mostrarContato?: boolean;
  /** Conteúdo extra no fim (ex.: vagas abertas da empresa). */
  children?: ReactNode;
}

const Bloco = ({ titulo, children }: { titulo: string; children: ReactNode }) => (
  <section className="bg-card border border-border rounded-2xl p-4">
    <h3 className="font-display font-bold text-foreground mb-2">{titulo}</h3>
    {children}
  </section>
);

const Chip = ({ children, ativo = true }: { children: ReactNode; ativo?: boolean }) => (
  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${ativo ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
    {children}
  </span>
);

const ProfileView = ({ perfil, mostrarContato, children }: Props) => {
  const { profile, empresa, profissional } = perfil;
  const isEmpresa = profile.tipo === "empresa";
  const { data: historico } = useHistoricoProfissional(profile.id, !isEmpresa);
  const { data: contratacoesEmpresa } = useContratacoesEmpresa(profile.id, isEmpresa);
  const { data: avaliacoes = [] } = useAvaliacoesRecebidas(profile.id);
  const { data: avaliadores = {} } = useProfilesByIds(avaliacoes.map((a) => a.de_id));

  const nomeExibido = (isEmpresa ? empresa?.nome_empresa : null) || profile.nome || (isEmpresa ? "Empresa" : "Profissional");
  const media = Number(profile.avaliacao_media ?? 0);
  const totalAval = profile.total_avaliacoes ?? 0;
  const trabalhos = isEmpresa ? contratacoesEmpresa : historico?.length;
  const disp = parseDisponibilidade(profissional?.disponibilidade);

  return (
    <div className="space-y-4">
      <section className="bg-card border border-border rounded-2xl p-5 text-center">
        <UserAvatar nome={nomeExibido} fotoUrl={profile.foto_url} size="xl" className="mx-auto mb-3" />
        <h2 className="text-xl font-display font-bold text-foreground">{nomeExibido}</h2>
        <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
          {isEmpresa && empresa?.ramo && <><Building2 className="h-3.5 w-3.5" /> {empresa.ramo} · </>}
          <MapPin className="h-3.5 w-3.5" /> {profile.cidade || "Franca"}
        </p>
        {isEmpresa && profile.nome && <p className="text-xs text-muted-foreground mt-1">Responsável: {profile.nome}</p>}

        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="rounded-xl bg-muted/60 py-2.5">
            <p className="font-display font-bold text-foreground flex items-center justify-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {totalAval > 0 ? media.toFixed(1) : "—"}
            </p>
            <p className="text-[11px] text-muted-foreground">Avaliação</p>
          </div>
          <div className="rounded-xl bg-muted/60 py-2.5">
            <p className="font-display font-bold text-foreground">{totalAval}</p>
            <p className="text-[11px] text-muted-foreground">Avaliações</p>
          </div>
          <div className="rounded-xl bg-muted/60 py-2.5">
            <p className="font-display font-bold text-foreground">{trabalhos ?? "—"}</p>
            <p className="text-[11px] text-muted-foreground">{isEmpresa ? "Contratações" : "Trabalhos"}</p>
          </div>
        </div>

        {!isEmpresa && profissional?.profissoes && profissional.profissoes.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5 mt-4">
            {profissional.profissoes.map((p) => <Chip key={p}>{p}</Chip>)}
          </div>
        )}

        {(profissional?.instagram || profissional?.linkedin || (mostrarContato && profile.telefone)) && (
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {profissional?.instagram && (
              <a href={instagramUrl(profissional.instagram)} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-sm text-foreground hover:border-primary/40">
                <Instagram className="h-4 w-4 text-pink-600" /> @{profissional.instagram}
              </a>
            )}
            {profissional?.linkedin && (
              <a href={profissional.linkedin} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-sm text-foreground hover:border-primary/40">
                <Linkedin className="h-4 w-4 text-sky-700" /> LinkedIn
              </a>
            )}
            {mostrarContato && profile.telefone && (
              <a href={`tel:${profile.telefone}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-sm text-foreground hover:border-primary/40">
                <Phone className="h-4 w-4 text-primary" /> {profile.telefone}
              </a>
            )}
          </div>
        )}
      </section>

      {isEmpresa ? (
        <Bloco titulo="Sobre a empresa">
          <div className="space-y-1.5 text-sm text-muted-foreground">
            {empresa?.endereco && <p className="flex gap-2"><MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" /> {empresa.endereco}</p>}
            {empresa?.ramo && <p className="flex gap-2"><Building2 className="h-4 w-4 text-primary shrink-0 mt-0.5" /> {empresa.ramo}</p>}
            {empresa?.cnpj && <p className="flex gap-2"><Briefcase className="h-4 w-4 text-primary shrink-0 mt-0.5" /> CNPJ {empresa.cnpj}</p>}
          </div>
        </Bloco>
      ) : (
        <>
          {profissional?.bio && (
            <Bloco titulo="Sobre">
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{profissional.bio}</p>
            </Bloco>
          )}
          {profissional?.experiencia && (
            <Bloco titulo="Experiência">
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{profissional.experiencia}</p>
            </Bloco>
          )}
          {profissional?.disponibilidade && (
            <Bloco titulo="Disponibilidade">
              <div className="flex flex-wrap gap-1.5">
                {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => <Chip key={d} ativo={disp.dias.includes(d)}>{d}</Chip>)}
              </div>
              {disp.periodos.length > 0 && (
                <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1.5"><Clock className="h-4 w-4" /> {disp.periodos.join(", ")}</p>
              )}
              {disp.obs && <p className="text-sm text-muted-foreground mt-1">{disp.obs}</p>}
            </Bloco>
          )}
          <Bloco titulo="Histórico no FreLa">
            {!historico || historico.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ainda não concluiu trabalhos pelo FreLa.</p>
            ) : (
              <ul className="divide-y divide-border">
                {historico.map((h) => (
                  <li key={h.contratacao_id} className="py-2.5 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{h.titulo}</p>
                      {h.nota ? <Stars value={h.nota} size="sm" /> : <span className="text-xs text-muted-foreground">sem nota</span>}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      {h.empresa} · <Calendar className="h-3 w-3" /> {formatDate(h.data)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Bloco>
        </>
      )}

      {children}

      <Bloco titulo="Avaliações recebidas">
        {avaliacoes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma avaliação ainda.</p>
        ) : (
          <ul className="space-y-3">
            {avaliacoes.slice(0, 20).map((a) => {
              const autor = avaliadores[a.de_id];
              return (
                <li key={a.id} className="flex gap-3">
                  <UserAvatar nome={autor?.nome} fotoUrl={autor?.foto_url} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{autor?.nome || "Usuário"}</p>
                      <span className="text-xs text-muted-foreground shrink-0">{new Date(a.created_at).toLocaleDateString("pt-BR")}</span>
                    </div>
                    <Stars value={a.nota} size="sm" />
                    {a.comentario && <p className="text-sm text-muted-foreground mt-1">"{a.comentario}"</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Bloco>
    </div>
  );
};

export default ProfileView;
