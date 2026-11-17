"use client";

// HU-04 · Consulta del Plan de Mejora de un ciclo (Administradora). Validar o devolver corresponde a HU-05.
import { useEffect, useState } from "react";
import { TablaAnexo1 } from "@/components/plan/TablaAnexo1";
import { Button } from "@/components/ui/Button";
import { Alert, Badge, PageTitle } from "@/components/ui/Display";
import { ApiError, obtenerPlanDelCiclo } from "@/lib/api";
import { fechaCorta } from "@/lib/reglas";
import { ESTADO_VERSION_BADGE, type PlanDeMejora } from "@/lib/types";

export const DetallePlan = ({ cicloId }: { cicloId: string }) => {
  const [plan, setPlan] = useState<PlanDeMejora | null>(null);
  const [error, setError] = useState<string>();

  useEffect(() => {
    obtenerPlanDelCiclo(cicloId)
      .then(setPlan)
      .catch((e) => setError(e instanceof ApiError ? e.message : "No pudimos cargar el plan de mejora."));
  }, [cicloId]);

  const crumbs = [{ label: "Inicio", href: "/admin/dashboard" }, { label: "Planes de mejora", href: "/admin/planes" }, { label: plan?.licenciatura ?? "Plan" }];

  if (error) {
    return (
      <>
        <PageTitle crumbs={crumbs} title="Plan de mejora" />
        <Alert tipo="error">{error}</Alert>
      </>
    );
  }

  if (!plan) {
    return (
      <>
        <PageTitle crumbs={crumbs} title="Plan de mejora" />
        <p className="t-muted" role="status">Cargando el plan de mejora…</p>
      </>
    );
  }

  const enRevision = plan.version?.estado === "EN_REVISION";

  return (
    <>
      <PageTitle
        crumbs={crumbs}
        title={`Plan de mejora · Lic. en ${plan.licenciatura}`}
        subtitle={`${plan.organismo} · Vigencia del ${fechaCorta(plan.vigenciaInicio)} al ${fechaCorta(plan.vigenciaFin)}`}
        actions={
          <>
            {plan.version
              ? <Badge estado={ESTADO_VERSION_BADGE[plan.version.estado]}>Versión {plan.version.numero} · {ESTADO_VERSION_BADGE[plan.version.estado]}</Badge>
              : <Badge estado="Pendiente">Sin captura</Badge>}
            <Button variant="peligro" icon="mensaje" disabled title="Se habilita con HU-05">Devolver con observaciones</Button>
            <Button icon="check" disabled title="Se habilita con HU-05">Validar plan</Button>
          </>
        }
      />
      <Alert tipo="info">
        {enRevision
          ? "La coordinación envió este plan a revisión. Validar o devolver con observaciones se habilita con la HU-05."
          : "Consulta de solo lectura. Validar o devolver con observaciones se habilita con la HU-05, cuando la coordinación envíe el plan a revisión."}
      </Alert>
      <TablaAnexo1 plan={plan} mensajeVacio="La coordinación todavía no captura recomendaciones para este ciclo." />
    </>
  );
};
