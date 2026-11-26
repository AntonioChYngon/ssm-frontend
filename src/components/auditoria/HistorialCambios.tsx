"use client";

// HU-03 · Línea de tiempo de modificaciones de una recomendación (para el Administrador): quién cambió qué campo,
// cuándo, con qué rol (Captura o Auxiliar) y de qué valor a cuál. Se carga al abrirla.
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Display";
import { ApiError, historialRecomendacion } from "@/lib/api";
import { fechaHoraLegible } from "@/lib/reglas-informe";
import { ROL_LABEL, type EventoAuditoria, type Rol } from "@/lib/types";

export const rolLegible = (rol: string) => ROL_LABEL[rol as Rol] ?? rol;

/** "Estado: En revisión → Aprobado", "porcentaje · Informe 2027-1: 40 → 60". */
export const Cambio = ({ evento }: { evento: EventoAuditoria }) => {
  if (evento.anterior === null && evento.nuevo === null) return null;
  return (
    <span className="t-small muted-box" style={{ padding: "4px 10px", alignSelf: "flex-start", wordBreak: "break-word" }}>
      <span className="t-medium">{evento.campo}:</span>{" "}
      {evento.anterior !== null && <><del className="t-muted">{evento.anterior}</del>{" → "}</>}
      {evento.nuevo ?? <span className="t-muted">(vacío)</span>}
    </span>
  );
};

export const HistorialCambios = ({ recomendacionId, numero }: { recomendacionId: string; numero: number }) => {
  const [abierto, setAbierto] = useState(false);
  const [eventos, setEventos] = useState<EventoAuditoria[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const alternar = () => {
    const abrir = !abierto;
    setAbierto(abrir);
    if (abrir && eventos === null) {
      historialRecomendacion(recomendacionId)
        .then(setEventos)
        .catch((e) => setError(e instanceof ApiError ? e.message : "No pudimos cargar el historial."));
    }
  };

  return (
    <div className="stack" style={{ gap: 8 }}>
      <div>
        <Button variant="texto" icon={abierto ? "chevron-abajo" : "reloj"} aria-expanded={abierto} onClick={alternar}>
          {abierto ? "Ocultar historial de cambios" : `Historial de cambios de la recomendación ${numero}`}
        </Button>
      </div>
      {abierto && (
        <div className="stack muted-box" style={{ gap: 10 }}>
          {error && <span className="t-danger" role="alert">{error}</span>}
          {!error && eventos === null && <span className="t-muted">Cargando historial…</span>}
          {eventos?.length === 0 && <span className="t-muted">Sin cambios registrados.</span>}
          {eventos && eventos.length > 0 && (
            <ol className="stack" style={{ margin: 0, paddingLeft: 20, gap: 10 }}>
              {eventos.map((e) => (
                <li key={e.id}>
                  <div className="row row--wrap" style={{ gap: 8 }}>
                    <time className="t-small t-muted" dateTime={e.fecha}>{fechaHoraLegible(e.fecha)}</time>
                    <span className="t-medium">{e.usuario.nombre}</span>
                    <Tag neutral>{rolLegible(e.rol)}</Tag>
                  </div>
                  <div className="stack" style={{ gap: 4, marginTop: 4 }}>
                    <span>{e.accion}</span>
                    <Cambio evento={e} />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
};
