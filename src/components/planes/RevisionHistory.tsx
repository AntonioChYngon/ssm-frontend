import { Card } from "@/components/ui/Display";
import type { RecomendacionPlan, RevisionResumen } from "@/lib/types";

export const HistorialRevisiones = ({
  revisiones,
  recomendaciones,
}: {
  revisiones: RevisionResumen[];
  recomendaciones: RecomendacionPlan[];
}) => {
  if (revisiones.length === 0) return null;

  const nombreRecomendacion = new Map(recomendaciones.map((r) => [r.id, `Recomendación ${r.numero}`]));
  return (
    <Card title="Historial de revisiones" subtitle={`${revisiones.length} iteración(es) registrada(s), de la más antigua a la más reciente.`}>
      <ol className="stack" style={{ margin: 0, paddingLeft: 22, gap: 16 }}>
        {revisiones.map((revision, i) => (
          <li key={revision.id ?? `${revision.fecha}-${i}`}>
            <div className="row row--responsive" style={{ gap: 8 }}>
              <strong>{revision.decision === "DEVUELTO" ? "Devuelto" : "Validado"}</strong>
              <span className="t-small t-muted">{revision.fecha} · {revision.revisor}</span>
            </div>
            {revision.comentario && <p style={{ margin: "6px 0 0" }}>{revision.comentario}</p>}
            {!!revision.observaciones?.length && (
              <ul className="stack" style={{ margin: "6px 0 0", paddingLeft: 20, gap: 4 }}>
                {revision.observaciones.map((observacion, j) => (
                  <li key={`${observacion.recomendacionId ?? "general"}-${j}`} className="t-small">
                    <span className="t-medium">{observacion.recomendacionId ? nombreRecomendacion.get(observacion.recomendacionId) ?? "Recomendación" : "Observación general"}:</span>{" "}
                    {observacion.comentario}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </Card>
  );
};
