"use client";

// HU-12 · Hitos intermedios por recomendación. Parte de las recomendaciones reales del plan (GET /mi-plan), sin hitos precargados.
import { useEffect, useState } from "react";
import { Button, IconButton, LinkButton } from "@/components/ui/Button";
import { Alert, Card, EmptyState, PageTitle } from "@/components/ui/Display";
import { SelectField, TextField } from "@/components/ui/Field";
import { ApiError, guardarHitos, obtenerMiPlan } from "@/lib/api";
import { fechaCorta } from "@/lib/reglas";
import type { RecomendacionPlan } from "@/lib/types";

type Borrador = { key: string; descripcion: string; fecha: string; porcentaje: string };
type Errores = { descripcion?: string; fecha?: string; porcentaje?: string };

// Reglas de HU-12: fecha obligatoria y anterior a la fecha de cumplimiento, % esperado entero entre 1 y 99, fechas en orden.
const validar = (hitos: Borrador[], fechaCumplimiento: string): Errores[] =>
  hitos.map((h, i) => {
    const errores: Errores = {};
    if (!h.descripcion.trim()) errores.descripcion = "Describe el hito.";
    if (!h.fecha) errores.fecha = "Elige una fecha.";
    const anterior = hitos[i - 1];
    if (h.fecha && anterior?.fecha && h.fecha <= anterior.fecha) errores.fecha = `Debe ser posterior al hito ${i} (${fechaCorta(anterior.fecha)}).`;
    if (h.fecha && fechaCumplimiento && h.fecha >= fechaCumplimiento) errores.fecha = `Debe ser anterior a la fecha de cumplimiento (${fechaCorta(fechaCumplimiento)}).`;
    const pct = Number(h.porcentaje);
    if (!Number.isInteger(pct) || pct < 1 || pct > 99) errores.porcentaje = "Escribe un número entre 1 y 99.";
    return errores;
  });

type Opcion = { etiqueta: string; recomendacion: RecomendacionPlan };

const HitosPage = () => {
  const [opciones, setOpciones] = useState<Opcion[] | null>(null);
  const [aviso, setAviso] = useState<string>();
  const [elegida, setElegida] = useState("");
  const [hitos, setHitos] = useState<Borrador[]>([]);
  const [guardado, setGuardado] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState<string>();

  useEffect(() => {
    obtenerMiPlan()
      .then((plan) => {
        const lista = plan.indicadores.flatMap((i) => i.recomendaciones).map((r, n) => ({ etiqueta: `${n + 1} · ${r.descripcion.slice(0, 80)}`, recomendacion: r }));
        setOpciones(lista);
        setElegida(lista[0]?.etiqueta ?? "");
      })
      .catch((e) => {
        setOpciones([]);
        setAviso(e instanceof ApiError ? e.message : "No pudimos cargar tu plan de mejora.");
      });
  }, []);

  const recomendacion = opciones?.find((o) => o.etiqueta === elegida)?.recomendacion;
  const errores = validar(hitos, recomendacion?.fechaCumplimiento ?? "");
  const conError = errores.filter((e) => Object.keys(e).length > 0).length;

  const actualizar = (key: string, campo: keyof Omit<Borrador, "key">, valor: string) => {
    setGuardado(false);
    setHitos((prev) => prev.map((h) => (h.key === key ? { ...h, [campo]: valor } : h)));
  };

  const guardar = async () => {
    if (conError || !recomendacion || hitos.length === 0) return;
    setErrorGuardar(undefined);
    try {
      await guardarHitos(recomendacion.id, hitos.map((h) => ({ descripcion: h.descripcion, fechaCompromiso: h.fecha, porcentajeEsperado: Number(h.porcentaje) })));
      setGuardado(true);
    } catch (e) {
      setErrorGuardar(e instanceof ApiError ? e.message : "No pudimos guardar los hitos. Intenta de nuevo.");
    }
  };

  if (opciones !== null && opciones.length === 0) {
    return (
      <>
        <PageTitle crumbs={[{ label: "Inicio", href: "/licenciatura/dashboard" }, { label: "Hitos" }]} title="Configuración de hitos" />
        <Card>
          <EmptyState
            icon="objetivo"
            titulo="Aún no hay recomendaciones"
            mensaje={aviso ?? "Captura primero las recomendaciones de tu Plan de Mejora; después podrás definir sus hitos intermedios."}
            action={<LinkButton href="/licenciatura/plan" icon="documento">Ir al plan de mejora</LinkButton>}
          />
        </Card>
      </>
    );
  }

  return (
    <>
      <PageTitle
        crumbs={[{ label: "Inicio", href: "/licenciatura/dashboard" }, { label: "Plan de mejora", href: "/licenciatura/plan" }, { label: "Hitos" }]}
        title="Configuración de hitos"
        subtitle={recomendacion ? `Fecha de cumplimiento de la recomendación: ${fechaCorta(recomendacion.fechaCumplimiento)}` : "Cargando tus recomendaciones…"}
        actions={<><LinkButton href="/licenciatura/plan" variant="contorno">Cancelar</LinkButton><Button icon="check" onClick={guardar} disabled={conError > 0 || hitos.length === 0}>Guardar hitos</Button></>}
      />
      <SelectField label="Recomendación" options={(opciones ?? []).map((o) => o.etiqueta)} value={elegida} onChange={(e) => { setElegida(e.target.value); setHitos([]); setGuardado(false); }} />
      <Alert tipo="info">Cada hito necesita una fecha y un % esperado entre 1 y 99. El 100% se alcanza al cerrar la recomendación. Las fechas deben ir en orden.</Alert>
      {guardado && <Alert tipo="exito">Hitos guardados correctamente.</Alert>}
      {errorGuardar && <Alert tipo="error">{errorGuardar}</Alert>}
      <div className="row row--top row--responsive" style={{ gap: 24 }}>
        <div className="stack grow">
          {hitos.length === 0 && <p className="t-muted" style={{ margin: 0 }}>Esta recomendación aún no tiene hitos. Agrega el primero.</p>}
          {hitos.map((h, i) => {
            const e = errores[i] ?? {};
            const invalido = Object.keys(e).length > 0;
            return (
              <Card key={h.key} style={{ padding: 20, border: invalido ? "1.5px solid var(--color-danger)" : undefined }}>
                <div className="row row--top" style={{ gap: 16 }}>
                  <span className="stepper__dot" style={{ background: invalido ? "var(--color-danger)" : "var(--color-primary)", color: "var(--color-white)", marginTop: 26 }}>{i + 1}</span>
                  <div className="stack grow" style={{ gap: 12 }}>
                    <TextField label="Descripción del hito *" value={h.descripcion} onChange={(ev) => actualizar(h.key, "descripcion", ev.target.value)} error={e.descripcion} />
                    <div className="grid-2" style={{ gap: 16 }}>
                      <TextField label="Fecha compromiso *" icon="calendario" type="date" value={h.fecha} onChange={(ev) => actualizar(h.key, "fecha", ev.target.value)} error={e.fecha} />
                      <TextField label="% esperado *" inputMode="numeric" value={h.porcentaje} onChange={(ev) => actualizar(h.key, "porcentaje", ev.target.value)} error={e.porcentaje} />
                    </div>
                  </div>
                  <div style={{ paddingTop: 26 }}>
                    <IconButton icon="eliminar" danger label={`Eliminar hito ${i + 1}`} onClick={() => setHitos((prev) => prev.filter((x) => x.key !== h.key))} />
                  </div>
                </div>
              </Card>
            );
          })}
          <Button variant="contorno" icon="mas" block onClick={() => setHitos((prev) => [...prev, { key: crypto.randomUUID(), descripcion: "", fecha: "", porcentaje: "" }])}>Agregar hito</Button>
        </div>
        <Card title="Curva de avance esperado" subtitle="Así se verá el avance esperado en el tiempo." className="side-340">
          <div className="row row--end" role="img" aria-label="Gráfica de barras del % esperado por hito" style={{ gap: 20, height: 200, padding: "8px 0 0 16px", borderLeft: "1px solid var(--color-gray-200)", borderBottom: "1px solid var(--color-gray-200)" }}>
            {[...hitos.map((h, i) => ({ label: `H${i + 1}`, valor: Number(h.porcentaje) || 0, error: Boolean(errores[i]?.porcentaje) })), { label: "Cierre", valor: 100, error: false }].map((b) => (
              <div key={b.label} className="stack" style={{ gap: 4, alignItems: "center" }}>
                <span className={["t-small t-medium", b.error ? "t-danger" : ""].join(" ")}>{b.valor}%</span>
                <span style={{ width: 28, height: Math.min(b.valor, 100) * 1.4, borderRadius: "4px 4px 0 0", background: b.error ? "var(--color-danger)" : b.label === "Cierre" ? "var(--color-success)" : "var(--color-primary)" }} />
                <span className="t-small t-muted">{b.label}</span>
              </div>
            ))}
          </div>
          {conError > 0 && <Alert tipo="error">Hay {conError} hito(s) por corregir antes de guardar.</Alert>}
        </Card>
      </div>
    </>
  );
};

export default HitosPage;
