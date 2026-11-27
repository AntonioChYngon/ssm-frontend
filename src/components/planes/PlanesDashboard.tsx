"use client";

// Planes de Mejora en los dashboards: lista con su estado actual y resumen por estado.
import { useEffect, useState } from "react";
import { LinkButton } from "@/components/ui/Button";
import { Donut, Legend } from "@/components/ui/Charts";
import { Alert, Badge, Card, DataTable, EmptyState, Progress, Stepper } from "@/components/ui/Display";
import { ApiError, listarPlanes } from "@/lib/api";
import { ESTADO_PLAN_BADGE, type EstadoPlan, type PlanResumen } from "@/lib/types";

type Vista = "admin" | "licenciatura";

const usePlanes = () => {
  const [planes, setPlanes] = useState<PlanResumen[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    listarPlanes()
      .then(setPlanes)
      .catch((e) => setError(e instanceof ApiError ? e.message : "No pudimos cargar los planes de mejora."));
  }, []);
  return { planes, error };
};

const ESTADOS: { estado: EstadoPlan; color: string }[] = [
  { estado: "APROBADO", color: "var(--color-success)" },
  { estado: "EN_REVISION", color: "var(--color-primary)" },
  { estado: "DEVUELTO", color: "var(--color-danger)" },
  { estado: "BORRADOR", color: "var(--color-gray-400)" },
];

/** Todos los planes creados con su estado (Borrador, En validación, Validado, Devuelto). */
export const TablaPlanes = ({ vista }: { vista: Vista }) => {
  const { planes, error } = usePlanes();
  const admin = vista === "admin";
  // La lista viene del ciclo más reciente al más antiguo: el primero es el vigente; los demás se consultan en el histórico.
  const cicloActual = planes?.[0]?.cicloId;

  return (
    <Card
      title="Planes de mejora"
      subtitle={admin ? "Todos los planes registrados por las licenciaturas, con su estado actual." : "Planes de tu licenciatura y su estado actual."}
      actions={admin ? <LinkButton href="/admin/planes" variant="texto" icon="chevron-derecha">Ver todos</LinkButton> : undefined}
    >
      {error && <Alert tipo="error">{error}</Alert>}
      {!planes && !error && <p className="t-muted" style={{ margin: 0 }}>Cargando planes…</p>}
      {planes?.length === 0 && (
        <EmptyState titulo="Aún no hay planes" mensaje={admin ? "Cuando una licenciatura guarde su plan aparecerá aquí." : "Guarda tu primera recomendación para crear el plan."} icon="documento"
          action={admin ? undefined : <LinkButton href="/licenciatura/plan" icon="editar">Capturar plan</LinkButton>} />
      )}
      {planes && planes.length > 0 && (
        <DataTable<PlanResumen>
          caption="Planes de mejora y su estado"
          rows={planes}
          rowKey={(p) => p.id}
          columns={[
            ...(admin ? [{ header: "Licenciatura", render: (p: PlanResumen) => <span className="t-medium">{p.licenciatura}</span> }] : []),
            { header: "Organismo", width: 120, render: (p) => p.organismo },
            { header: "Ciclo", width: 110, render: (p) => p.ciclo },
            { header: "Recomend.", width: 100, render: (p) => p.recomendaciones },
            { header: "Avance", width: 170, render: (p) => <Progress value={p.avance} width={90} /> },
            { header: "Estado", width: 150, render: (p) => <Badge estado={ESTADO_PLAN_BADGE[p.estado]} /> },
            { header: "Actualizado", width: 120, render: (p) => p.actualizado },
            {
              header: "Acción",
              width: 140,
              render: (p) =>
                admin ? (
                  p.estado === "EN_REVISION"
                    ? <LinkButton href={`/admin/planes/${p.id}`} icon="check">Revisar</LinkButton>
                    : <LinkButton href={`/admin/planes/${p.id}`} variant="contorno" icon="ver">Ver</LinkButton>
                ) : p.cicloId !== cicloActual ? (
                  <LinkButton href={`/licenciatura/historico?cicloId=${p.cicloId}`} variant="contorno" icon="ver">Ver</LinkButton>
                ) : (
                  <LinkButton href="/licenciatura/plan" variant="contorno" icon={p.estado === "BORRADOR" || p.estado === "DEVUELTO" ? "editar" : "ver"}>
                    {p.estado === "BORRADOR" || p.estado === "DEVUELTO" ? "Editar" : "Ver"}
                  </LinkButton>
                ),
            },
          ]}
        />
      )}
    </Card>
  );
};

/** Dashboard global: conteo de planes por estado. */
export const EstadosPlanesDonut = () => {
  const { planes } = usePlanes();
  const segmentos = ESTADOS.map(({ estado, color }) => ({ label: ESTADO_PLAN_BADGE[estado], valor: planes?.filter((p) => p.estado === estado).length ?? 0, color }));
  return (
    <Card title="Estado de los planes" className="side-340">
      <Donut segmentos={segmentos} centro={String(planes?.length ?? 0)} subtitulo="planes" />
      <div className="stack" style={{ gap: 10 }}>
        {segmentos.map((s) => <Legend key={s.label} color={s.color} label={s.label} valor={s.valor} />)}
      </div>
    </Card>
  );
};

const PASOS = ["Borrador", "En validación", "Validado"];
const PASO: Record<EstadoPlan, number> = { BORRADOR: 0, DEVUELTO: 0, EN_REVISION: 1, APROBADO: 2 };
const MENSAJE: Record<EstadoPlan, { tipo: "info" | "advertencia" | "exito"; texto: string }> = {
  BORRADOR: { tipo: "info", texto: "Tu plan está en borrador. Cuando termines de capturarlo, envíalo a validación." },
  EN_REVISION: { tipo: "info", texto: "Tu plan está en validación por la Administración. Te avisaremos aquí cuando cambie de estado." },
  DEVUELTO: { tipo: "advertencia", texto: "La Administración devolvió tu plan con observaciones. Corrígelo y vuelve a enviarlo." },
  APROBADO: { tipo: "exito", texto: "Tu plan fue validado." },
};

/** Dashboard de licenciatura: estado del plan más reciente. */
export const EstadoMiPlan = () => {
  const { planes } = usePlanes();
  const actual = planes?.[0];
  if (!actual) return null;
  return (
    <>
      <Alert tipo={MENSAJE[actual.estado].tipo}>{MENSAJE[actual.estado].texto}</Alert>
      <Card title={`Estado del plan · Ciclo ${actual.ciclo}`} actions={<Badge estado={ESTADO_PLAN_BADGE[actual.estado]} />}>
        <Stepper pasos={PASOS} actual={PASO[actual.estado]} />
      </Card>
    </>
  );
};
