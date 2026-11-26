"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Button, LinkButton } from "@/components/ui/Button";
import { HistorialCambios } from "@/components/auditoria/HistorialCambios";
import { HistorialRevisiones } from "@/components/planes/RevisionHistory";
import { Alert, Badge, Card, EmptyState, PageTitle, Progress } from "@/components/ui/Display";
import { TextAreaField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { ConfirmModal } from "@/components/ui/Interactive";
import { ApiError, devolverPlan, obtenerPlan, validarPlan } from "@/lib/api";
import { ESTADO_PLAN_BADGE, type PlanDetalle } from "@/lib/types";

type Accion = "validar" | "devolver";

const fechaLegible = (iso: string | null) => (iso ? iso.split("-").reverse().join("/") : "Sin fecha");

const Dato = ({ titulo, children }: { titulo: string; children: ReactNode }) => (
  <div className="stack" style={{ gap: 2 }}>
    <span className="t-small t-medium t-muted">{titulo}</span>
    <div>{children}</div>
  </div>
);

const Revision = ({ ok, texto }: { ok: boolean; texto: string }) => (
  <div className="row" style={{ gap: 8 }}>
    <Icon name={ok ? "check" : "alerta"} size={18} className={ok ? "t-success" : "t-danger"} label={ok ? "Cumple" : "No cumple"} />
    <span>{texto}</span>
  </div>
);

export const ValidacionPlan = ({ id }: { id: string }) => {
  const router = useRouter();
  const [plan, setPlan] = useState<PlanDetalle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<Accion | null>(null);
  const [observaciones, setObservaciones] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    obtenerPlan(id)
      .then(setPlan)
      .catch((e) => setError(e instanceof ApiError ? e.message : "No pudimos cargar el plan."));
  }, [id]);

  if (error && !plan) {
    return <EmptyState titulo="No pudimos abrir el plan" mensaje={error} icon="alerta" action={<LinkButton href="/admin/planes" variant="contorno">Volver a la lista</LinkButton>} />;
  }
  if (!plan) return <p className="t-muted">Cargando plan…</p>;

  const recs = plan.recomendacionesDetalle;
  const enValidacion = plan.estado === "EN_REVISION";
  const conObservacion = Object.values(observaciones).filter((o) => o.trim()).length;
  const metasConfiguradas = recs.flatMap((r) => r.metas).filter((m) => m.fechaCompromiso && m.porcentajeEsperado !== null).length;
  const totalMetas = recs.flatMap((r) => r.metas).length;

  const confirmar = async (motivo?: string) => {
    if (!modal) return;
    setEnviando(true);
    try {
      if (modal === "validar") await validarPlan(plan.id);
      else {
        await devolverPlan(plan.id, {
          motivo: motivo ?? "",
          observaciones: Object.entries(observaciones).filter(([, c]) => c.trim()).map(([recomendacionId, comentario]) => ({ recomendacionId, comentario: comentario.trim() })),
        });
      }
      setModal(null);
      router.push("/admin/planes");
    } catch (e) {
      setModal(null);
      setError(e instanceof ApiError ? e.message : "No pudimos completar la operación. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <PageTitle
        crumbs={[{ label: "Inicio", href: "/admin/dashboard" }, { label: "Planes de mejora", href: "/admin/planes" }, { label: plan.licenciatura }]}
        title={`Plan de mejora · Lic. en ${plan.licenciatura}`}
        subtitle={`Organismo: ${plan.organismo} · Ciclo ${plan.ciclo} · Actualizado el ${plan.actualizado}`}
        actions={enValidacion ? (
          <>
            <Button variant="peligro" icon="mensaje" disabled={enviando} onClick={() => setModal("devolver")}>Devolver con observaciones</Button>
            <Button icon="check" disabled={enviando} onClick={() => setModal("validar")}>Validar plan</Button>
          </>
        ) : undefined}
      />
      {error && <Alert tipo="error">{error}</Alert>}
      {!enValidacion && (
        <Alert tipo="info">
          Este plan está en estado <strong>{ESTADO_PLAN_BADGE[plan.estado]}</strong>. Solo se pueden validar o devolver planes en validación.
        </Alert>
      )}
      {plan.ultimaRevision && (
        <Alert tipo={plan.ultimaRevision.decision === "APROBADO" ? "exito" : "advertencia"}>
          Última revisión ({plan.ultimaRevision.fecha}, {plan.ultimaRevision.revisor}): {plan.ultimaRevision.decision === "APROBADO" ? "validado" : "devuelto"}.
          {plan.ultimaRevision.comentario ? ` ${plan.ultimaRevision.comentario}` : ""}
        </Alert>
      )}
      {(plan.revisiones?.length || plan.ultimaRevision) ? (
        <HistorialRevisiones revisiones={plan.revisiones?.length ? plan.revisiones : [plan.ultimaRevision!]} recomendaciones={plan.recomendacionesDetalle} />
      ) : null}
      <div className="row row--top row--responsive" style={{ gap: 24 }}>
        <div className="stack grow">
          {recs.length === 0 && <EmptyState titulo="El plan no tiene recomendaciones" mensaje="La licenciatura aún no captura recomendaciones." icon="documento" />}
          {recs.map((r) => {
            const tieneObs = Boolean(observaciones[r.id]?.trim());
            return (
              <Card key={r.id} style={{ gap: 16 }}>
                <div className="row" style={{ gap: 12 }}>
                  <span className="stepper__dot" style={{ background: "var(--color-primary)", color: "var(--color-white)" }}>{r.numero}</span>
                  <div className="grow">
                    <div className="t-medium">Recomendación {r.numero}</div>
                    <div className="t-small t-muted">Categoría: {r.categoria}</div>
                  </div>
                  {enValidacion && <Badge estado={tieneObs ? "Devuelto" : "Validado"}>{tieneObs ? "Con observación" : "Sin observaciones"}</Badge>}
                </div>
                <Dato titulo="Indicador">{r.indicador}</Dato>
                <Dato titulo="Recomendación">{r.descripcion}</Dato>
                <Dato titulo="Acciones para atender la recomendación">
                  {r.acciones.length ? r.acciones.map((a, i) => <p key={i} style={{ margin: 0, whiteSpace: "pre-line" }}>{a}</p>) : <span className="t-danger">Sin acciones</span>}
                </Dato>
                <Dato titulo="Metas">
                  {r.metas.length ? (
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {r.metas.map((m) => (
                        <li key={m.id}>
                          {m.descripcion}
                          <span className="t-small t-muted"> · {fechaLegible(m.fechaCompromiso)}{m.porcentajeEsperado !== null ? ` · ${m.porcentajeEsperado}% esperado` : ""}</span>
                        </li>
                      ))}
                    </ul>
                  ) : <span className="t-danger">Sin metas</span>}
                </Dato>
                <div className="grid-2" style={{ gap: 16 }}>
                  <Dato titulo="Área responsable">{r.areaResponsable ?? <span className="t-danger">Sin área</span>}</Dato>
                  <Dato titulo="Fecha de cumplimiento">{fechaLegible(r.fechaCumplimiento)}</Dato>
                </div>
                {r.observacion && !enValidacion && <Alert tipo="advertencia">Observación de la última devolución: {r.observacion}</Alert>}
                {/* HU-03: línea de tiempo de cambios de esta recomendación (captura y auxiliar). */}
                <HistorialCambios recomendacionId={r.id} numero={r.numero} />
                {enValidacion && (
                  <TextAreaField
                    label="Observación para esta recomendación (opcional)"
                    placeholder="Escribe una observación…"
                    value={observaciones[r.id] ?? ""}
                    onChange={(e) => setObservaciones((prev) => ({ ...prev, [r.id]: e.target.value }))}
                    rows={2}
                  />
                )}
              </Card>
            );
          })}
        </div>
        <aside className="stack side-340">
          <Card title="Resumen del plan">
            {[
              ["Estado", <Badge key="e" estado={ESTADO_PLAN_BADGE[plan.estado]} />],
              ["Recomendaciones", String(recs.length)],
              ["Metas configuradas", `${metasConfiguradas} / ${totalMetas}`],
              ["Observaciones", String(conObservacion)],
            ].map(([k, v]) => (
              <div key={String(k)} className="row"><span className="t-muted grow">{k}</span><span className="t-medium">{v}</span></div>
            ))}
            <div className="stack" style={{ gap: 6 }}>
              <span className="t-small t-muted">Avance global</span>
              <Progress value={plan.avance} width={240} />
            </div>
          </Card>
          <Card title="Antes de validar" style={{ gap: 8 }}>
            <Revision ok={recs.length > 0 && recs.every((r) => r.metas.length > 0)} texto="Recomendaciones con metas" />
            <Revision ok={totalMetas > 0 && metasConfiguradas === totalMetas} texto="Metas con fecha y % esperado" />
            <Revision ok={recs.every((r) => r.fechaCumplimiento && r.fechaCumplimiento >= plan.vigenciaInicio && r.fechaCumplimiento <= plan.vigenciaFin)} texto="Fechas dentro del ciclo" />
            <Revision ok={recs.every((r) => Boolean(r.areaResponsable?.trim()))} texto="Áreas responsables asignadas" />
          </Card>
          {enValidacion && <Alert tipo="advertencia">Si devuelves el plan, la licenciatura recibirá tus observaciones en la aplicación.</Alert>}
        </aside>
      </div>
      <ConfirmModal
        open={modal !== null}
        tipo={modal ?? "validar"}
        titulo={modal === "devolver" ? "¿Devolver este plan con observaciones?" : "¿Validar este plan de mejora?"}
        mensaje={modal === "devolver"
          ? `El plan regresará a la licenciatura para su corrección junto con ${conObservacion} observación(es) por recomendación. Indica el motivo general.`
          : `Al validar, el plan de ${plan.licenciatura} quedará bloqueado para edición y se notificará a la licenciatura. Esta acción no se puede deshacer.`}
        confirmLabel={modal === "devolver" ? "Sí, devolver plan" : "Sí, validar plan"}
        onCancel={() => setModal(null)}
        onConfirm={(motivo) => void confirmar(motivo)}
      />
    </>
  );
};
