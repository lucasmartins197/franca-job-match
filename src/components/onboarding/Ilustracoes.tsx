/**
 * Ilustrações do onboarding (estilo "quadrinho" simples, SVG próprio, cores da marca).
 * Sem imagens externas: ficam nítidas em qualquer tela e pesam quase nada.
 */
const T = "#126f66"; // marca
const M = "#a7f3d0"; // menta
const A = "#fbbf24"; // âmbar
const P = "#f3c9a5"; // pele clara
const P2 = "#8d5a3b"; // pele escura
const C = "#ffffff";
const L = "#e6efed"; // linha/fundo

const Painel = ({ children }: { children: React.ReactNode }) => (
  <svg viewBox="0 0 320 260" className="w-full h-full" role="img" aria-hidden>
    <rect x="8" y="8" width="304" height="244" rx="28" fill="#f1f7f6" stroke={L} strokeWidth="3" />
    {children}
  </svg>
);

const Pessoa = ({ x, y, pele = P, roupa = T, cabelo = "#2b2b2b", escala = 1 }: { x: number; y: number; pele?: string; roupa?: string; cabelo?: string; escala?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${escala})`}>
    <rect x="-22" y="26" width="44" height="58" rx="20" fill={roupa} />
    <circle cx="0" cy="8" r="20" fill={pele} />
    <path d="M-20 4c0-14 9-22 20-22s20 8 20 22c-6-7-14-9-20-9s-14 2-20 9z" fill={cabelo} />
    <circle cx="-7" cy="10" r="2.2" fill="#2b2b2b" />
    <circle cx="7" cy="10" r="2.2" fill="#2b2b2b" />
    <path d="M-6 18q6 5 12 0" stroke="#2b2b2b" strokeWidth="2.2" fill="none" strokeLinecap="round" />
  </g>
);

const Balao = ({ x, y, w, texto, cor = C, lado = "esq" }: { x: number; y: number; w: number; texto: string; cor?: string; lado?: "esq" | "dir" }) => (
  <g>
    <rect x={x} y={y} width={w} height="34" rx="17" fill={cor} stroke={L} strokeWidth="2" />
    <path d={lado === "esq" ? `M${x + 18} ${y + 32} l-8 12 l18 -10z` : `M${x + w - 18} ${y + 32} l8 12 l-18 -10z`} fill={cor} stroke={L} strokeWidth="2" strokeLinejoin="round" />
    <rect x={x + 10} y={y + 30} width={w - 20} height="4" fill={cor} />
    <text x={x + w / 2} y={y + 22} textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="13" fill="#1f2a28">{texto}</text>
  </g>
);

/** 1 — Publique a vaga */
export const IlustraPublicar = () => (
  <Painel>
    {/* loja com toldo */}
    <rect x="30" y="92" width="120" height="120" rx="10" fill={C} stroke={L} strokeWidth="3" />
    <path d="M24 92h132l-10 -26h-112z" fill={A} />
    {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M${34 + i * 21} 66l-6 26h14l4 -26z`} fill="#fff" opacity=".55" />)}
    <rect x="48" y="150" width="34" height="62" rx="6" fill={M} />
    <rect x="96" y="120" width="40" height="30" rx="6" fill="#dbeafe" />
    <Pessoa x={210} y={120} roupa="#0f766e" />
    {/* celular com a vaga */}
    <g transform="translate(232 150) rotate(8)">
      <rect x="0" y="0" width="58" height="92" rx="12" fill="#1f2a28" />
      <rect x="5" y="9" width="48" height="74" rx="7" fill={C} />
      <rect x="10" y="16" width="26" height="6" rx="3" fill={T} />
      <rect x="10" y="28" width="38" height="4" rx="2" fill={L} />
      <rect x="10" y="36" width="30" height="4" rx="2" fill={L} />
      <rect x="10" y="54" width="38" height="18" rx="6" fill={T} />
      <text x="29" y="67" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="9" fill="#fff">Publicar</text>
    </g>
    <Balao x={150} y={30} w={150} texto="Preciso de um garçom!" lado="dir" />
  </Painel>
);

/** 2 — Vagas perto de você (mapa com pins) */
export const IlustraPerto = () => (
  <Painel>
    <rect x="26" y="26" width="268" height="208" rx="22" fill="#e7f2ef" />
    <path d="M26 150c60-20 100 30 160 10s80-50 108-40" stroke="#fff" strokeWidth="14" fill="none" strokeLinecap="round" />
    <path d="M110 26c-10 60 30 110 10 208" stroke="#fff" strokeWidth="10" fill="none" />
    <path d="M220 26c10 70-20 120 0 208" stroke="#fff" strokeWidth="8" fill="none" />
    <circle cx="70" cy="70" r="16" fill={M} opacity=".8" />
    <rect x="236" y="168" width="40" height="30" rx="8" fill={M} opacity=".8" />
    {[[90, 108, "R$120"], [196, 82, "R$150", true], [238, 132, "R$200"]].map(([x, y, t, ativo]) => (
      <g key={String(t)}>
        <rect x={Number(x) - 30} y={Number(y) - 30} width="60" height="26" rx="13" fill={ativo ? T : C} stroke={ativo ? T : L} strokeWidth="2" />
        <path d={`M${Number(x) - 6} ${Number(y) - 6} l6 8 l6 -8z`} fill={ativo ? T : C} />
        <text x={Number(x)} y={Number(y) - 12} textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="12" fill={ativo ? "#fff" : "#1f2a28"}>{String(t)}</text>
      </g>
    ))}
    <circle cx="150" cy="170" r="22" fill="#2563eb" opacity=".18" />
    <circle cx="150" cy="170" r="9" fill="#2563eb" stroke="#fff" strokeWidth="4" />
    <Pessoa x={70} y={160} pele={P2} roupa="#7c3aed" cabelo="#1c1917" escala={0.8} />
    <Balao x={120} y={196} w={150} texto="Tem vaga a 800 m!" />
  </Painel>
);

/** 3 — Combine, trabalhe e avalie (código + estrelas) */
export const IlustraSeguranca = () => (
  <Painel>
    <Pessoa x={92} y={110} roupa="#0f766e" />
    <Pessoa x={228} y={110} pele={P2} roupa="#7c3aed" cabelo="#1c1917" />
    {/* código entre os dois */}
    <g transform="translate(116 52)">
      <rect x="0" y="0" width="88" height="40" rx="12" fill={C} stroke={T} strokeWidth="2.5" />
      {"4827".split("").map((d, i) => (
        <text key={i} x={14 + i * 20} y="27" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="20" fill="#1f2a28">{d}</text>
      ))}
    </g>
    <path d="M128 166q32 18 64 0" stroke={T} strokeWidth="5" fill="none" strokeLinecap="round" />
    <circle cx="160" cy="176" r="12" fill={P} />
    {/* estrelas */}
    {[0, 1, 2, 3, 4].map((i) => (
      <path key={i} transform={`translate(${96 + i * 32} 208) scale(.9)`}
        d="M12 0l3.6 7.6 8.4 1-6.2 5.8 1.6 8.2L12 18.6 4.6 22.6l1.6-8.2L0 8.6l8.4-1z" fill={A} />
    ))}
    <circle cx="44" cy="44" r="14" fill={M} />
    <path d="M37 44l5 5 9 -10" stroke={T} strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </Painel>
);

/** 4 — Comece agora */
export const IlustraComecar = () => (
  <Painel>
    {[[50, 60, A], [270, 50, M], [60, 200, "#fca5a5"], [262, 196, A], [160, 34, "#93c5fd"]].map(([x, y, c], i) => (
      <circle key={i} cx={Number(x)} cy={Number(y)} r="7" fill={String(c)} />
    ))}
    {[[90, 40], [236, 100], [80, 140], [248, 230]].map(([x, y], i) => (
      <path key={i} d={`M${x} ${y}h10M${x + 5} ${Number(y) - 5}v10`} stroke={T} strokeWidth="3" strokeLinecap="round" />
    ))}
    <g transform="translate(160 132) rotate(-20)">
      <path d="M0 -70c26 18 34 56 22 96h-44c-12-40-4-78 22-96z" fill={C} stroke={L} strokeWidth="3" />
      <circle cx="0" cy="-20" r="13" fill={M} stroke={T} strokeWidth="3" />
      <path d="M-22 10l-20 26 22 -4zM22 10l20 26 -22 -4z" fill={T} />
      <path d="M-12 26q12 40 24 0z" fill={A} />
    </g>
    <text x="160" y="236" textAnchor="middle" fontFamily="Plus Jakarta Sans, Inter, sans-serif" fontWeight="800" fontSize="22" fill="#1f2a28">Fre<tspan fill={T}>La</tspan></text>
  </Painel>
);
