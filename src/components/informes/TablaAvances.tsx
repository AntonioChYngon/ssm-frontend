"use client";

// Bloque Informe · Una tarjeta por recomendación: metas, % esperado al corte contra % reportado, observaciones y evidencias.
// Base: modo lectura (HU-08). Las líneas agregan sus controles sin tocar este archivo:
//   - línea A (HU-07): `editor` reemplaza el % y las observaciones por campos editables; `accionesEvidencia` y `pieEvidencias`.
//   - línea B (HU-08): `pie` agrega el campo de observación del Administrador por recomendación.
import type { ReactNode } from "react";
import { Alert, Badge, Card, EmptyState, Progress } from "@/components/ui/Display";
import { fechaLegible } from "@/lib/reglas-informe";
import type { AvanceDetalle, EvidenciaInforme } from "@/lib/types";
import { ListaEvidencias } from "./ListaEvidencias";

const Dato = ({ titulo, children }: { titulo: string; children: ReactNode }) => (
  <div className="stack" style={{ gap: 2 }}>
    <span className="t-small t-medium t-muted">{titulo}</span>
    <div>{children}</div>
  </div>
);

/** Rezago: reportado por debajo de lo que el plan comprometía al corte. Solo informativo. */
export const conRezago = (a: AvanceDetalle) => a.esperadoAlCorte !== null && a.porcentaje !== null && a.porcentaje < a.esperadoAlCorte;

const Comparacion = ({ avance }: { avance: AvanceDetalle }) => (
  <div className="grid-2" style={{ gap: 16 }}>
    <Dato titulo="% esperado al corte">
      {avance.esperadoAlCorte === null ? <span className="t-muted">Sin metas vencidas al corte</span> : <span className="t-medium">{avance.esperadoAlCorte}%</span>}
    </Dato>
    <Dato titulo="% reportado">
      {avance.porcentaje === null ? (
        <span className="t-danger">Sin capturar</span>
      ) : (
        <div className="row" style={{ gap: 8 }}>
          <Progress value={avance.porcentaje} width={160} />
          {conRezago(avance) && <Badge estado="Pendiente">Por debajo de lo esperado</Badge>}
        </div>
      )}
    </Dato>
  </div>
);

type Props = {
  avances: AvanceDetalle[];
  /** Línea A: controles editables del % y las observaciones de una recomendación (reemplazan la vista de lectura). */
  editor?: (avance: AvanceDetalle) => ReactNode;
  /** Línea A: controles por evidencia (p. ej. "Quitar"). */
  accionesEvidencia?: (avance: AvanceDetalle, evidencia: EvidenciaInforme) => ReactNode;
  /** Línea A: debajo de las evidencias ("Subir archivo", "Agregar enlace", cola de subidas). */
  pieEvidencias?: (avance: AvanceDetalle) => ReactNode;
  /** Línea B: al final de la tarjeta (observación del Administrador). */
  pie?: (avance: AvanceDetalle) => ReactNode;
  /** Muestra la observación de la última devolución como aviso (coordinación y Administrador). */
  mostrarObservacionRevision?: boolean;
};

export const TablaAvances = ({ avances, editor, accionesEvidencia, pieEvidencias, pie, mostrarObservacionRevision = true }: Props) => {
  if (avances.length === 0) {
    return <EmptyState titulo="Sin recomendaciones" mensaje="El plan aprobado no tiene recomendaciones que reportar." icon="documento" />;
  }
  return (
    <div className="stack">
      {avances.map((a) => (
        <Card key={a.recomendacionId} style={{ gap: 16 }}>
          <div className="row" style={{ gap: 12 }}>
            <span className="stepper__dot" style={{ background: "var(--color-primary)", color: "var(--color-white)" }}>{a.numero}</span>
            <div className="grow">
              <div className="t-medium">Recomendación {a.numero}</div>
              <div className="t-small t-muted">Categoría: {a.categoria} · Cumplimiento: {fechaLegible(a.fechaCumplimiento)}</div>
            </div>
            {a.porcentaje === 100 && <Badge estado="Completado">100 %</Badge>}
          </div>
          <Dato titulo="Indicador">{a.indicador}</Dato>
          <Dato titulo="Recomendación">{a.recomendacion}</Dato>
          <Dato titulo="Metas del plan">
            {a.metas.length ? (
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {a.metas.map((m, i) => (
                  <li key={`${m.descripcion}-${i}`}>
                    {m.descripcion}
                    <span className="t-small t-muted"> · {fechaLegible(m.fechaCompromiso)}{m.porcentajeEsperado !== null ? ` · ${m.porcentajeEsperado}% esperado` : ""}</span>
                  </li>
                ))}
              </ul>
            ) : <span className="t-muted">Sin metas</span>}
          </Dato>
          {mostrarObservacionRevision && a.observacionRevision && (
            <Alert tipo="advertencia">Observación de la Administración: {a.observacionRevision}</Alert>
          )}
          {editor ? editor(a) : (
            <>
              <Comparacion avance={a} />
              <Dato titulo="Observaciones de la coordinación">
                {a.observaciones ? <p style={{ margin: 0, whiteSpace: "pre-line" }}>{a.observaciones}</p> : <span className="t-muted">Sin observaciones</span>}
              </Dato>
            </>
          )}
          <Dato titulo={a.evidenciaObligatoria ? "Evidencias (obligatoria al 100 %)" : "Evidencias"}>
            <ListaEvidencias
              evidencias={a.evidencias}
              vacio={a.evidenciaObligatoria ? <span className="t-danger">Falta evidencia: la recomendación está al 100 %.</span> : undefined}
              acciones={accionesEvidencia ? (e) => accionesEvidencia(a, e) : undefined}
            />
            {pieEvidencias?.(a)}
          </Dato>
          {pie?.(a)}
        </Card>
      ))}
    </div>
  );
};
