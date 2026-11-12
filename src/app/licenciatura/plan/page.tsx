"use client";

import { useState } from "react";
import { Button, LinkButton } from "@/components/ui/Button";
import { Badge, Card, PageTitle, Stepper } from "@/components/ui/Display";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { CATEGORIAS, HITOS, RECOMENDACIONES } from "@/lib/mock-data";

const FIN_CICLO = "2029-12-31";

const LISTA = [
  { n: 1, nombre: "Personal académico", estado: "ok" },
  { n: 2, nombre: "Plan de estudios", estado: "actual" },
  { n: 3, nombre: "Infraestructura", estado: "ok" },
  { n: 4, nombre: "Vinculación", estado: "error" },
  { n: 5, nombre: "Investigación", estado: "pendiente" },
  { n: 6, nombre: "Tutorías", estado: "pendiente" },
  { n: 7, nombre: "Movilidad", estado: "pendiente" },
] as const;

const COLOR = { ok: "var(--color-success)", actual: "var(--color-primary)", error: "var(--color-danger)", pendiente: "var(--color-gray-200)" } as const;

const CapturaPlanPage = () => {
  const recomendacion = RECOMENDACIONES[1];
  const [fechaTermino, setFechaTermino] = useState("2030-06-30");
  const fueraDeCiclo = fechaTermino > FIN_CICLO;

  return (
    <>
      <PageTitle
        crumbs={[{ label: "Inicio", href: "/licenciatura/dashboard" }, { label: "Plan de mejora" }, { label: "Recomendación 2" }]}
        title="Captura del plan de mejora"
        subtitle="Licenciatura en Actuaría · Ciclo 2024–2029"
        actions={<><Button variant="contorno" icon="check">Guardar borrador</Button><Button icon="enviar" disabled={fueraDeCiclo} title={fueraDeCiclo ? "Corrige los errores antes de enviar" : undefined}>Enviar a validación</Button></>}
      />
      <Card style={{ padding: 20 }}>
        <Stepper pasos={["Datos generales", "Recomendaciones", "Hitos", "Evidencias", "Revisar y enviar"]} actual={1} />
      </Card>
      <div className="row row--top row--responsive" style={{ gap: 24 }}>
        <Card className="side-340" style={{ padding: 16, gap: 4 }}>
          <div className="row" style={{ padding: "0 8px 8px" }}><h2 className="t-h3 grow">Recomendaciones</h2><span className="t-small t-medium t-muted">2 / 12</span></div>
          <nav aria-label="Recomendaciones del plan" className="stack" style={{ gap: 4 }}>
            {LISTA.map((r) => (
              <a key={r.n} href="#" aria-current={r.estado === "actual" ? "step" : undefined} className="row" style={{ gap: 10, minHeight: 48, padding: "0 8px", borderRadius: 8, textDecoration: "none", color: r.estado === "actual" ? "var(--color-primary)" : "var(--color-text)", background: r.estado === "actual" ? "var(--color-primary-tint)" : undefined, fontWeight: r.estado === "actual" ? 500 : 400 }}>
                <span className="stepper__dot" style={{ width: 26, height: 26, background: COLOR[r.estado], color: r.estado === "pendiente" ? "var(--color-text-muted)" : "var(--color-white)" }}>
                  {r.estado === "ok" ? <Icon name="check" size={14} /> : r.n}
                </span>
                <span className="grow">{r.nombre}</span>
                {r.estado === "error" && <Icon name="alerta" size={18} className="t-danger" label="Tiene errores" />}
              </a>
            ))}
          </nav>
          <Button variant="texto" icon="mas" block>Agregar recomendación</Button>
        </Card>
        <Card title="Recomendación 2 de 12" subtitle="Los campos con * son obligatorios." className="grow" actions={<Badge estado="Borrador">Guardado hace 1 min</Badge>} style={{ gap: 20 }}>
          <div className="grid-2">
            <SelectField label="Categoría (catálogo) *" options={CATEGORIAS} defaultValue={recomendacion?.categoria} />
            <SelectField label="Criterio del organismo *" options={["4.2 Actualización del plan de estudios", "4.1 Fundamentación", "4.3 Mapa curricular"]} />
          </div>
          <TextAreaField label="Recomendación del organismo acreditador *" defaultValue={recomendacion?.texto} rows={2} />
          <TextAreaField label="Acciones de mejora *" defaultValue={recomendacion?.acciones} rows={3} />
          <div className="grid-3" style={{ gap: 16 }}>
            <SelectField label="Responsable *" options={["Comité de Carrera", "Coordinación de Actuaría", "Secretaría Administrativa"]} />
            <TextField label="Fecha de inicio *" icon="calendario" type="date" defaultValue="2025-01-15" />
            <TextField label="Fecha de término *" icon="calendario" type="date" value={fechaTermino} onChange={(e) => setFechaTermino(e.target.value)}
              error={fueraDeCiclo ? "La fecha debe estar dentro del ciclo de acreditación (antes del 31/12/2029)." : undefined} />
          </div>
          <div className="stack" style={{ gap: 10 }}>
            <div className="row"><h3 className="t-h3 grow">Hitos de esta recomendación</h3><LinkButton href="/licenciatura/hitos" variant="contorno" icon="objetivo">Configurar hitos</LinkButton></div>
            {HITOS.slice(0, 3).map((h) => (
              <div key={h.id} className="row muted-box" style={{ gap: 12 }}>
                <Icon name="objetivo" size={20} className="t-primary" />
                <span className="grow">{h.descripcion}</span>
                <span className="t-small t-muted">{h.fechaCompromiso.split("-").reverse().join("/")}</span>
                <Badge estado="En revisión">{h.porcentajeEsperado}% esperado</Badge>
              </div>
            ))}
          </div>
          <div className="row">
            <Button variant="contorno" icon="flecha-izquierda">Anterior</Button>
            <span className="spacer" />
            <Button icon="chevron-derecha">Siguiente recomendación</Button>
          </div>
        </Card>
      </div>
    </>
  );
};

export default CapturaPlanPage;
