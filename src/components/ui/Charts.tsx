import type { CSSProperties } from "react";

export type Segmento = { valor: number; color: string; label: string };

// Dona con conic-gradient: sin dependencias de gráficas.
export const Donut = ({ segmentos, size = 200, centro, subtitulo }: { segmentos: Segmento[]; size?: number; centro: string; subtitulo: string }) => {
  const total = segmentos.reduce((suma, s) => suma + s.valor, 0);
  let acumulado = 0;
  const stops = segmentos
    .map((s) => {
      const inicio = (acumulado / total) * 100;
      acumulado += s.valor;
      return `${s.color} ${inicio}% ${(acumulado / total) * 100}%`;
    })
    .join(", ");
  const descripcion = segmentos.map((s) => `${s.label}: ${s.valor}`).join(", ");
  return (
    <div role="img" aria-label={`${centro} ${subtitulo}. ${descripcion}`} style={{ width: size, height: size, borderRadius: "50%", background: `conic-gradient(${stops})`, display: "grid", placeItems: "center", margin: "0 auto" }}>
      <div style={{ width: size * 0.64, height: size * 0.64, borderRadius: "50%", background: "var(--color-white)", display: "grid", placeItems: "center", textAlign: "center" }}>
        <div>
          <div className="t-h1">{centro}</div>
          <div className="t-small t-muted">{subtitulo}</div>
        </div>
      </div>
    </div>
  );
};

export const Legend = ({ color, label, valor }: { color: string; label: string; valor?: string | number }) => (
  <div className="row t-small" style={{ gap: 8 }}>
    <span style={{ width: 12, height: 12, borderRadius: "50%", background: color, flex: "0 0 auto" }} />
    <span className="grow">{label}</span>
    {valor !== undefined && <span className="t-body t-medium">{valor}</span>}
  </div>
);

// Barra horizontal con marcador del % esperado.
export const BarraEsperada = ({ real, esperado, width = 420 }: { real: number; esperado: number; width?: number }) => {
  const color = real < esperado - 10 ? "var(--color-danger)" : real < esperado ? "var(--color-warning)" : "var(--color-primary)";
  return (
    <span style={{ position: "relative", display: "inline-block", width, height: 14, borderRadius: 7, background: "var(--color-gray-50)" } as CSSProperties} aria-hidden>
      <span style={{ position: "absolute", inset: "0 auto 0 0", width: `${real}%`, borderRadius: 7, background: color }} />
      <span style={{ position: "absolute", top: -5, left: `calc(${esperado}% - 2px)`, width: 4, height: 24, borderRadius: 2, background: "var(--color-accent)" }} />
    </span>
  );
};

export const BarraApilada = ({ partes, width = 340 }: { partes: Segmento[]; width?: number }) => {
  const total = partes.reduce((suma, p) => suma + p.valor, 0);
  return (
    <span className="row" style={{ gap: 2, width, height: 20, borderRadius: 6, overflow: "hidden", flex: "0 0 auto" }} aria-hidden>
      {partes.filter((p) => p.valor > 0).map((p) => (
        <span key={p.label} style={{ height: "100%", width: `${(p.valor / total) * 100}%`, background: p.color }} />
      ))}
    </span>
  );
};
