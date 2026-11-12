"use client";

import { useState } from "react";
import { Button, IconButton, LinkButton } from "@/components/ui/Button";
import { Alert, Card, PageTitle } from "@/components/ui/Display";
import { TextField } from "@/components/ui/Field";
import { guardarHitos } from "@/lib/api";
import { HITOS } from "@/lib/mock-data";

type Borrador = { key: string; descripcion: string; fecha: string; porcentaje: string };
type Errores = { descripcion?: string; fecha?: string; porcentaje?: string };

// Reglas de HU-12: fecha obligatoria, % esperado entero entre 1 y 99, fechas en orden ascendente.
const validar = (hitos: Borrador[]): Errores[] =>
  hitos.map((h, i) => {
    const errores: Errores = {};
    if (!h.descripcion.trim()) errores.descripcion = "Describe el hito.";
    if (!h.fecha) errores.fecha = "Elige una fecha.";
    const anterior = hitos[i - 1];
    if (h.fecha && anterior?.fecha && h.fecha <= anterior.fecha) errores.fecha = `Debe ser posterior al hito ${i} (${anterior.fecha.split("-").reverse().join("/")}).`;
    const pct = Number(h.porcentaje);
    if (!Number.isInteger(pct) || pct < 1 || pct > 99) errores.porcentaje = "Escribe un número entre 1 y 99.";
    return errores;
  });

const INICIAL: Borrador[] = HITOS.map((h) => ({ key: h.id, descripcion: h.descripcion, fecha: h.fechaCompromiso, porcentaje: String(h.porcentajeEsperado) }));
INICIAL[2] = { ...INICIAL[2]!, porcentaje: "120" };
INICIAL[3] = { ...INICIAL[3]!, fecha: "2026-01-15" };

const HitosPage = () => {
  const [hitos, setHitos] = useState<Borrador[]>(INICIAL);
  const [guardado, setGuardado] = useState(false);
  const errores = validar(hitos);
  const conError = errores.filter((e) => Object.keys(e).length > 0).length;

  const actualizar = (key: string, campo: keyof Omit<Borrador, "key">, valor: string) => {
    setGuardado(false);
    setHitos((prev) => prev.map((h) => (h.key === key ? { ...h, [campo]: valor } : h)));
  };

  const guardar = async () => {
    if (conError) return;
    await guardarHitos("r2", hitos.map((h) => ({ descripcion: h.descripcion, fechaCompromiso: h.fecha, porcentajeEsperado: Number(h.porcentaje) })));
    setGuardado(true);
  };

  return (
    <>
      <PageTitle
        crumbs={[{ label: "Inicio", href: "/licenciatura/dashboard" }, { label: "Plan de mejora", href: "/licenciatura/plan" }, { label: "Recomendación 2" }, { label: "Hitos" }]}
        title="Configuración de hitos"
        subtitle="Recomendación 2 · Actualizar las asignaturas optativas"
        actions={<><LinkButton href="/licenciatura/plan" variant="contorno">Cancelar</LinkButton><Button icon="check" onClick={guardar} disabled={conError > 0}>Guardar hitos</Button></>}
      />
      <Alert tipo="info">Cada hito necesita una fecha y un % esperado entre 1 y 99. El 100% se alcanza al cerrar la recomendación. Las fechas deben ir en orden.</Alert>
      {guardado && <Alert tipo="exito">Hitos guardados correctamente.</Alert>}
      <div className="row row--top row--responsive" style={{ gap: 24 }}>
        <div className="stack grow">
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
