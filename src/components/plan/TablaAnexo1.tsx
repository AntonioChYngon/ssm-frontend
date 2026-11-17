// Tabla "Plan de Mejora Continua" (Anexo 1 del cliente): la usan la captura (Captura/Auxiliar) y la consulta de la Administradora.
import { Card, DataTable, EmptyState } from "@/components/ui/Display";
import { fechaCorta } from "@/lib/reglas";
import type { IndicadorPlan, PlanDeMejora, RecomendacionPlan } from "@/lib/types";

type FilaAnexo = { indicador: IndicadorPlan; recomendacion: RecomendacionPlan };

const Lista = ({ elementos }: { elementos: string[] }) => (
  <ul style={{ margin: 0, paddingLeft: 18 }}>
    {elementos.map((e, i) => <li key={i}>{e}</li>)}
  </ul>
);

export const TablaAnexo1 = ({ plan, mensajeVacio }: { plan: PlanDeMejora; mensajeVacio: string }) => {
  const filas: FilaAnexo[] = plan.indicadores.flatMap((indicador) => indicador.recomendaciones.map((recomendacion) => ({ indicador, recomendacion })));
  return (
    <Card
      title="Plan de Mejora Continua"
      subtitle={`Anexo 1 · Licenciatura en ${plan.licenciatura} · ${plan.organismo} · Vigencia ${fechaCorta(plan.vigenciaInicio)} al ${fechaCorta(plan.vigenciaFin)}`}
    >
      {filas.length === 0 ? (
        <EmptyState titulo="Aún no hay recomendaciones" mensaje={mensajeVacio} />
      ) : (
        <DataTable<FilaAnexo>
          caption="Plan de Mejora Continua (Anexo 1)"
          rows={filas}
          rowKey={(f) => f.recomendacion.id}
          columns={[
            { header: "Categoría", width: 140, render: (f) => f.indicador.categoria.nombre },
            { header: "Indicador", width: 180, render: (f) => `${f.indicador.clave ? `${f.indicador.clave} ` : ""}${f.indicador.descripcion}` },
            { header: "Recomendación", render: (f) => f.recomendacion.descripcion },
            { header: "Acciones", render: (f) => <Lista elementos={f.recomendacion.acciones} /> },
            { header: "Metas", render: (f) => <Lista elementos={f.recomendacion.metas} /> },
            { header: "Área responsable", width: 160, render: (f) => f.recomendacion.areas.map((a) => a.nombre).join(", ") },
            { header: "Fecha de cumplimiento", width: 130, render: (f) => (
              <span>{fechaCorta(f.recomendacion.fechaCumplimiento)}{f.recomendacion.etiquetaFecha && <><br /><span className="t-small t-muted">{f.recomendacion.etiquetaFecha}</span></>}</span>
            ) },
          ]}
        />
      )}
    </Card>
  );
};
