import type { Metadata } from "next";
import { Button, LinkButton } from "@/components/ui/Button";
import { BarraEsperada, Donut, Legend } from "@/components/ui/Charts";
import { Avatar, Badge, Card, DataTable, KpiCard, PageTitle } from "@/components/ui/Display";
import { SelectField } from "@/components/ui/Field";
import { AVANCE_LICENCIATURAS, LICENCIATURAS } from "@/lib/mock-data";
import type { EstadoBadge } from "@/lib/types";

export const metadata: Metadata = { title: "Dashboard global" };

const ESTADOS = [
  { label: "Validados", valor: 11, color: "var(--color-success)" },
  { label: "En revisión", valor: 3, color: "var(--color-primary)" },
  { label: "Devueltos", valor: 2, color: "var(--color-danger)" },
  { label: "Borrador", valor: 2, color: "var(--color-gray-400)" },
];

type Vencimiento = { licenciatura: string; hito: string; fecha: string; estado: EstadoBadge };
const VENCIMIENTOS: Vencimiento[] = [
  { licenciatura: "Ingeniería Civil", hito: "Actualizar laboratorio", fecha: "08/11/2026", estado: "Vencido" },
  { licenciatura: "Economía", hito: "Programa de tutorías", fecha: "15/11/2026", estado: "Pendiente" },
  { licenciatura: "Arquitectura", hito: "Seguimiento de egresados", fecha: "22/11/2026", estado: "Pendiente" },
  { licenciatura: "Pedagogía", hito: "Capacitación docente", fecha: "30/11/2026", estado: "En revisión" },
];

const ACTIVIDAD = [
  ["JR", "Jorge Ramírez envió el plan de Actuaría", "Hace 25 min"],
  ["LM", "Laura Méndez subió 4 evidencias (Derecho)", "Hace 1 h"],
  ["MG", "Validaste el informe de Relaciones Int.", "Hoy, 09:12"],
  ["PS", "Pablo Sánchez configuró 6 hitos (Economía)", "Ayer, 17:40"],
] as const;

const DashboardGlobalPage = () => (
  <>
    <PageTitle
      title="Dashboard global"
      subtitle="Panorama de todas las licenciaturas al 11 de noviembre de 2026."
      actions={
        <>
          <div style={{ width: 300 }}><SelectField label="Licenciatura" options={["Todas las licenciaturas", ...LICENCIATURAS]} /></div>
          <div style={{ width: 220 }}><SelectField label="Ciclo de acreditación" options={["2024 – 2029", "2019 – 2024"]} /></div>
          <Button variant="contorno" icon="descargar">Exportar</Button>
        </>
      }
    />
    <div className="grid-4">
      <KpiCard tono="azul" titulo="Planes registrados" valor="18" detalle="de 22 licenciaturas" icon="documento" />
      <KpiCard tono="verde" titulo="Planes validados" valor="11" detalle="61% del total" icon="check" />
      <KpiCard tono="naranja" titulo="Por validar" valor="5" detalle="3 planes y 2 informes" icon="reloj" />
      <KpiCard tono="rojo" titulo="Hitos vencidos" valor="7" detalle="en 4 licenciaturas" icon="alerta" />
    </div>
    <div className="row row--top row--responsive" style={{ gap: 24 }}>
      <Card title="Avance real vs. esperado" subtitle="Cumplimiento de hitos por licenciatura" className="grow"
        actions={<div className="row" style={{ gap: 16 }}><Legend color="var(--color-primary)" label="Avance real" /><Legend color="var(--color-accent)" label="Esperado al corte" /></div>}>
        {AVANCE_LICENCIATURAS.map((a) => (
          <div key={a.licenciatura} className="row" style={{ gap: 16 }}>
            <span style={{ width: 240, flex: "0 0 240px" }} className="t-body">{a.licenciatura}</span>
            <BarraEsperada real={a.real} esperado={a.esperado} width={360} />
            <span className="t-medium">{a.real}%</span>
            <span className="t-small t-muted">/ {a.esperado}%</span>
          </div>
        ))}
      </Card>
      <Card title="Estado de los planes" className="side-340">
        <Donut segmentos={ESTADOS} centro="18" subtitulo="planes" />
        <div className="stack" style={{ gap: 10 }}>
          {ESTADOS.map((e) => <Legend key={e.label} color={e.color} label={e.label} valor={e.valor} />)}
        </div>
      </Card>
    </div>
    <div className="row row--top row--responsive" style={{ gap: 24 }}>
      <Card title="Vencimientos próximos" className="grow" actions={<LinkButton href="/admin/reportes/incumplimiento" variant="texto" icon="chevron-derecha">Ver reporte</LinkButton>}>
        <DataTable<Vencimiento>
          caption="Vencimientos próximos"
          rowKey={(v) => v.hito}
          rows={VENCIMIENTOS}
          columns={[
            { header: "Licenciatura", render: (v) => v.licenciatura },
            { header: "Hito", render: (v) => v.hito },
            { header: "Fecha", width: 130, render: (v) => v.fecha },
            { header: "Estado", width: 150, render: (v) => <Badge estado={v.estado} /> },
          ]}
        />
      </Card>
      <Card title="Actividad reciente" className="side-380">
        {ACTIVIDAD.map(([ini, texto, cuando]) => (
          <div key={texto} className="row row--top" style={{ gap: 12 }}>
            <Avatar iniciales={ini} />
            <div>
              <div className="t-medium">{texto}</div>
              <div className="t-small t-muted">{cuando}</div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  </>
);

export default DashboardGlobalPage;
