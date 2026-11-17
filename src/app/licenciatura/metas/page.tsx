"use client";

import { useEffect, useState } from "react";
import { Button, IconButton, LinkButton } from "@/components/ui/Button";
import { Alert, Badge, Card, EmptyState, PageTitle } from "@/components/ui/Display";
import { SelectField, TextField } from "@/components/ui/Field";
import { ApiError, guardarMetas, listarPlanes, obtenerPlan } from "@/lib/api";
import { ESTADO_PLAN_BADGE, type PlanDetalle, type PlanResumen, type RecomendacionPlan } from "@/lib/types";

type Fila = { key: string; id?: string; descripcion: string; fecha: string; porcentaje: string };
type Errores = { descripcion?: string; fecha?: string; porcentaje?: string };
type Aviso = { tipo: "exito" | "error"; texto: string };

const SIN_PLAN = "Selecciona un plan de mejora";

const fechaLegible = (iso: string) => iso.split("-").reverse().join("/");
const etiquetaPlan = (p: PlanResumen) => `${p.licenciatura} · Ciclo ${p.ciclo} · ${ESTADO_PLAN_BADGE[p.estado]}`;

const filasDe = (r: RecomendacionPlan): Fila[] =>
  r.metas.map((m) => ({ key: m.id, id: m.id, descripcion: m.descripcion, fecha: m.fechaCompromiso ?? "", porcentaje: m.porcentajeEsperado === null ? "" : String(m.porcentajeEsperado) }));

// Reglas de la Configuración de Metas: descripción, fecha y % obligatorios; % entero de 1 a 99;
// fechas en orden ascendente, dentro del ciclo y sin pasar la fecha de cumplimiento de la recomendación.
const validar = (filas: Fila[], desde: string, hasta: string): Errores[] =>
  filas.map((f, i) => {
    const e: Errores = {};
    if (!f.descripcion.trim()) e.descripcion = "Describe la meta.";
    if (!f.fecha) e.fecha = "Elige una fecha.";
    else if (f.fecha < desde || f.fecha > hasta) e.fecha = `Debe estar entre ${fechaLegible(desde)} y ${fechaLegible(hasta)}.`;
    const anterior = filas[i - 1];
    if (f.fecha && anterior?.fecha && f.fecha <= anterior.fecha) e.fecha = `Debe ser posterior a la meta ${i} (${fechaLegible(anterior.fecha)}).`;
    const pct = Number(f.porcentaje);
    if (f.porcentaje.trim() === "" || !Number.isInteger(pct) || pct < 1 || pct > 99) e.porcentaje = "Escribe un número entre 1 y 99.";
    return e;
  });

const MetasRecomendacion = ({ plan, recomendacion, onGuardado }: { plan: PlanDetalle; recomendacion: RecomendacionPlan; onGuardado: (plan: PlanDetalle) => void }) => {
  const [filas, setFilas] = useState<Fila[]>(() => filasDe(recomendacion));
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [guardando, setGuardando] = useState(false);
  const hasta = recomendacion.fechaCumplimiento ?? plan.vigenciaFin;
  const errores = validar(filas, plan.vigenciaInicio, hasta);
  const conError = errores.filter((e) => Object.keys(e).length > 0).length;
  const soloLectura = !plan.editable;

  // Solo recarga las filas cuando cambian las metas guardadas de ESTA recomendación (no al guardar otra).
  const guardadas = JSON.stringify(recomendacion.metas);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setFilas(filasDe(recomendacion)), [guardadas]);

  const actualizar = (key: string, campo: "descripcion" | "fecha" | "porcentaje", valor: string) => {
    setAviso(null);
    setFilas((prev) => prev.map((f) => (f.key === key ? { ...f, [campo]: valor } : f)));
  };

  const guardar = async () => {
    if (conError || !filas.length) return;
    setGuardando(true);
    try {
      const nuevo = await guardarMetas(recomendacion.id, {
        metas: filas.map((f) => ({ id: f.id, descripcion: f.descripcion.trim(), fechaCompromiso: f.fecha, porcentajeEsperado: Number(f.porcentaje) })),
      });
      onGuardado(nuevo);
      setAviso({ tipo: "exito", texto: "Metas guardadas correctamente." });
    } catch (error) {
      setAviso({ tipo: "error", texto: error instanceof ApiError ? error.message : "No pudimos guardar las metas. Intenta de nuevo." });
    } finally {
      setGuardando(false);
    }
  };

  const barras = [...filas.map((f, i) => ({ label: `M${i + 1}`, valor: Number(f.porcentaje) || 0, error: Boolean(errores[i]?.porcentaje) })), { label: "Cierre", valor: 100, error: false }];

  return (
    <Card
      title={`Recomendación ${recomendacion.numero} · ${recomendacion.categoria}`}
      subtitle={`${recomendacion.descripcion} · Fecha de cumplimiento: ${recomendacion.fechaCumplimiento ? fechaLegible(recomendacion.fechaCumplimiento) : "sin definir"}`}
      actions={!soloLectura && <Button icon="check" onClick={() => void guardar()} disabled={conError > 0 || guardando || !filas.length}>Guardar metas</Button>}
    >
      {aviso && <Alert tipo={aviso.tipo}>{aviso.texto}</Alert>}
      <div className="row row--top row--responsive" style={{ gap: 24 }}>
        <div className="stack grow" style={{ gap: 12 }}>
          {filas.length === 0 && <p className="t-muted" style={{ margin: 0 }}>Esta recomendación aún no tiene metas.</p>}
          {filas.map((f, i) => {
            const e = errores[i] ?? {};
            const invalido = !soloLectura && Object.keys(e).length > 0;
            return (
              <div key={f.key} className="row row--top muted-box" style={{ gap: 16, border: invalido ? "1.5px solid var(--color-danger)" : undefined }}>
                <span className="stepper__dot" style={{ background: invalido ? "var(--color-danger)" : "var(--color-primary)", color: "var(--color-white)", marginTop: 26 }}>{i + 1}</span>
                <div className="stack grow" style={{ gap: 12 }}>
                  <TextField label="Descripción de la meta *" value={f.descripcion} disabled={soloLectura} maxLength={2000}
                    onChange={(ev) => actualizar(f.key, "descripcion", ev.target.value)} error={soloLectura ? undefined : e.descripcion} />
                  <div className="grid-2" style={{ gap: 16 }}>
                    <TextField label="Fecha compromiso *" icon="calendario" type="date" min={plan.vigenciaInicio} max={hasta} value={f.fecha} disabled={soloLectura}
                      onChange={(ev) => actualizar(f.key, "fecha", ev.target.value)} error={soloLectura ? undefined : e.fecha} />
                    <TextField label="% esperado *" inputMode="numeric" value={f.porcentaje} disabled={soloLectura}
                      onChange={(ev) => actualizar(f.key, "porcentaje", ev.target.value)} error={soloLectura ? undefined : e.porcentaje} />
                  </div>
                </div>
                {!soloLectura && (
                  <div style={{ paddingTop: 26 }}>
                    <IconButton icon="eliminar" danger label={`Eliminar meta ${i + 1}`} onClick={() => setFilas((prev) => prev.filter((x) => x.key !== f.key))} />
                  </div>
                )}
              </div>
            );
          })}
          {!soloLectura && (
            <Button variant="contorno" icon="mas" block onClick={() => setFilas((prev) => [...prev, { key: crypto.randomUUID(), descripcion: "", fecha: "", porcentaje: "" }])}>Agregar meta</Button>
          )}
          {!soloLectura && conError > 0 && <Alert tipo="error">Hay {conError} meta(s) por corregir antes de guardar.</Alert>}
        </div>
        <div className="side-340 stack" style={{ gap: 8 }}>
          <span className="t-small t-medium t-muted">Curva de avance esperado</span>
          <div className="row row--end" role="img" aria-label="Gráfica de barras del % esperado por meta" style={{ gap: 16, height: 170, padding: "8px 0 0 12px", borderLeft: "1px solid var(--color-gray-200)", borderBottom: "1px solid var(--color-gray-200)" }}>
            {barras.map((b) => (
              <div key={b.label} className="stack" style={{ gap: 4, alignItems: "center" }}>
                <span className={["t-small t-medium", b.error ? "t-danger" : ""].join(" ")}>{b.valor}%</span>
                <span style={{ width: 24, height: Math.min(b.valor, 100) * 1.2, borderRadius: "4px 4px 0 0", background: b.error ? "var(--color-danger)" : b.label === "Cierre" ? "var(--color-success)" : "var(--color-primary)" }} />
                <span className="t-small t-muted">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

const MetasPage = () => {
  const [planes, setPlanes] = useState<PlanResumen[]>([]);
  const [planId, setPlanId] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanDetalle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    listarPlanes()
      .then(setPlanes)
      .catch((e) => setError(e instanceof ApiError ? e.message : "No pudimos cargar los planes."));
  }, []);

  useEffect(() => {
    if (!planId) {
      setPlan(null);
      return;
    }
    setCargando(true);
    setError(null);
    obtenerPlan(planId)
      .then(setPlan)
      .catch((e) => setError(e instanceof ApiError ? e.message : "No pudimos cargar el plan."))
      .finally(() => setCargando(false));
  }, [planId]);

  const seleccionado = planes.find((p) => p.id === planId);

  return (
    <>
      <PageTitle
        crumbs={[{ label: "Inicio", href: "/licenciatura/dashboard" }, { label: "Plan de mejora", href: "/licenciatura/plan" }, { label: "Metas" }]}
        title="Configuración de metas"
        subtitle="Selecciona un plan de mejora para ver, agregar o modificar las metas de sus recomendaciones."
        actions={<LinkButton href="/licenciatura/plan" variant="contorno">Volver al plan</LinkButton>}
      />
      <Card style={{ padding: 20 }}>
        <div className="row row--end row--responsive" style={{ gap: 16 }}>
          <div className="grow">
            <SelectField
              label="Plan de mejora *"
              options={[SIN_PLAN, ...planes.map(etiquetaPlan)]}
              value={seleccionado ? etiquetaPlan(seleccionado) : SIN_PLAN}
              onChange={(e) => setPlanId(planes.find((p) => etiquetaPlan(p) === e.target.value)?.id ?? null)}
            />
          </div>
          {plan && <Badge estado={ESTADO_PLAN_BADGE[plan.estado]} />}
        </div>
      </Card>
      {error && <Alert tipo="error">{error}</Alert>}
      {!planId && <EmptyState titulo="Elige un plan de mejora" mensaje="Las metas se muestran por recomendación del plan seleccionado." icon="objetivo" />}
      {cargando && <p className="t-muted">Cargando metas…</p>}
      {plan && !cargando && (
        <>
          <Alert tipo={plan.editable ? "info" : "advertencia"}>
            {plan.editable
              ? "Cada meta necesita una fecha compromiso y un % esperado entre 1 y 99. Las fechas deben ir en orden y no pasar la fecha de cumplimiento de la recomendación. El 100% se alcanza al cumplir la recomendación."
              : `El plan está ${ESTADO_PLAN_BADGE[plan.estado].toLowerCase()}: sus metas solo se pueden consultar.`}
          </Alert>
          {plan.recomendacionesDetalle.length === 0 ? (
            <EmptyState titulo="Este plan no tiene recomendaciones" mensaje="Captura las recomendaciones y sus metas en el Plan de mejora." icon="documento" action={<LinkButton href="/licenciatura/plan" icon="editar">Ir al plan</LinkButton>} />
          ) : (
            plan.recomendacionesDetalle.map((r) => <MetasRecomendacion key={r.id} plan={plan} recomendacion={r} onGuardado={setPlan} />)
          )}
        </>
      )}
    </>
  );
};

export default MetasPage;
