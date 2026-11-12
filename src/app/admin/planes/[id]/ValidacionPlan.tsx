"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert, Badge, Card, PageTitle, Progress } from "@/components/ui/Display";
import { Checkbox, TextAreaField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { ChipGroup, ConfirmModal } from "@/components/ui/Interactive";
import { resolverPlan } from "@/lib/api";
import { RECOMENDACIONES } from "@/lib/mock-data";
import type { PlanResumen } from "@/lib/types";

type Accion = "validar" | "devolver";

export const ValidacionPlan = ({ plan }: { plan: PlanResumen }) => {
  const router = useRouter();
  const [modal, setModal] = useState<Accion | null>(null);
  const [observaciones, setObservaciones] = useState<Record<string, string>>(
    Object.fromEntries(RECOMENDACIONES.map((r) => [r.id, r.observacion ?? ""])),
  );
  const conObservacion = Object.values(observaciones).filter((o) => o.trim()).length;

  const confirmar = async (motivo?: string) => {
    if (!modal) return;
    await resolverPlan(plan.id, modal, motivo);
    setModal(null);
    router.push("/admin/planes");
  };

  return (
    <>
      <PageTitle
        crumbs={[{ label: "Inicio", href: "/admin/dashboard" }, { label: "Planes de mejora", href: "/admin/planes" }, { label: plan.licenciatura }]}
        title={`Plan de mejora · Lic. en ${plan.licenciatura}`}
        subtitle={`Organismo: ${plan.organismo} · Ciclo ${plan.ciclo} · Actualizado el ${plan.actualizado}`}
        actions={<><Button variant="peligro" icon="mensaje" onClick={() => setModal("devolver")}>Devolver con observaciones</Button><Button icon="check" onClick={() => setModal("validar")}>Validar plan</Button></>}
      />
      <div className="row row--top row--responsive" style={{ gap: 24 }}>
        <div className="stack grow">
          <ChipGroup label="Secciones del plan" options={[`Recomendaciones (${plan.recomendaciones})`, "Hitos (18)", "Evidencias (24)", "Historial"]} />
          {RECOMENDACIONES.map((r) => {
            const tieneObs = Boolean(observaciones[r.id]?.trim());
            return (
              <Card key={r.id}>
                <div className="row" style={{ gap: 12 }}>
                  <span className="stepper__dot" style={{ background: "var(--color-primary)", color: "var(--color-white)" }}>{r.numero}</span>
                  <div className="grow">
                    <div className="t-medium">Recomendación {r.numero}</div>
                    <div className="t-small t-muted">Categoría: {r.categoria}</div>
                  </div>
                  <Badge estado={tieneObs ? "Devuelto" : "Validado"}>{tieneObs ? "Con observación" : "Sin observaciones"}</Badge>
                </div>
                <p style={{ margin: 0 }}>{r.texto}</p>
                <div className="row row--wrap t-small t-muted" style={{ gap: 24 }}>
                  <span className="row" style={{ gap: 6 }}><Icon name="usuario" size={18} />{r.responsable}</span>
                  <span className="row" style={{ gap: 6 }}><Icon name="objetivo" size={18} />{r.hitos} hitos · {r.esperadoAlCorte}% esperado al corte</span>
                  <span className="row" style={{ gap: 6 }}><Icon name="carpeta" size={18} />Evidencias adjuntas</span>
                </div>
                <TextAreaField
                  label="Observación para esta recomendación (opcional)"
                  placeholder="Escribe una observación…"
                  value={observaciones[r.id] ?? ""}
                  onChange={(e) => setObservaciones((prev) => ({ ...prev, [r.id]: e.target.value }))}
                  rows={2}
                />
              </Card>
            );
          })}
        </div>
        <aside className="stack side-340">
          <Card title="Resumen del plan">
            {[["Estado", <Badge key="e" estado="En revisión" />], ["Recomendaciones", String(plan.recomendaciones)], ["Hitos configurados", "18"], ["Evidencias", "24 PDF"], ["Observaciones", String(conObservacion)]].map(([k, v]) => (
              <div key={String(k)} className="row"><span className="t-muted grow">{k}</span><span className="t-medium">{v}</span></div>
            ))}
            <div className="stack" style={{ gap: 6 }}>
              <span className="t-small t-muted">Avance global</span>
              <Progress value={plan.avance} width={240} />
            </div>
          </Card>
          <Card title="Antes de validar" style={{ gap: 4 }}>
            <Checkbox label="Recomendaciones con hitos" defaultChecked />
            <Checkbox label="Fechas dentro del ciclo" defaultChecked />
            <Checkbox label="Evidencias legibles en PDF" defaultChecked />
            <Checkbox label="Responsables asignados" />
          </Card>
          <Alert tipo="advertencia">Si devuelves el plan, el Capturista recibirá tus observaciones por correo y en la app.</Alert>
        </aside>
      </div>
      <ConfirmModal
        open={modal !== null}
        tipo={modal ?? "validar"}
        titulo={modal === "devolver" ? "¿Devolver este plan con observaciones?" : "¿Validar este plan de mejora?"}
        mensaje={modal === "devolver"
          ? `El plan regresará al Capturista para su corrección junto con ${conObservacion} observación(es) por recomendación. Indica el motivo general.`
          : `Al validar, el plan de ${plan.licenciatura} quedará bloqueado para edición y se notificará al Capturista. Esta acción no se puede deshacer.`}
        confirmLabel={modal === "devolver" ? "Sí, devolver plan" : "Sí, validar plan"}
        onCancel={() => setModal(null)}
        onConfirm={confirmar}
      />
    </>
  );
};
