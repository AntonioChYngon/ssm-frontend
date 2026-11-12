import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { BarraApilada, Donut, Legend } from "@/components/ui/Charts";
import { Card, KpiCard, PageTitle } from "@/components/ui/Display";
import { SelectField } from "@/components/ui/Field";
import { ATENCION, LICENCIATURAS } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Resumen de atención" };

const VERDE = "var(--color-success)";
const NARANJA = "var(--color-warning)";
const ROJO = "var(--color-danger)";

const AtencionPage = () => {
  const totales = ATENCION.reduce((t, a) => ({ atendidas: t.atendidas + a.atendidas, enProceso: t.enProceso + a.enProceso, sinAtender: t.sinAtender + a.sinAtender }), { atendidas: 0, enProceso: 0, sinAtender: 0 });
  const total = totales.atendidas + totales.enProceso + totales.sinAtender;
  const pct = (n: number) => `${Math.round((n / total) * 100)}% de ${total} recomendaciones`;

  return (
    <>
      <PageTitle
        crumbs={[{ label: "Inicio", href: "/admin/dashboard" }, { label: "Reportes" }, { label: "Resumen de atención" }]}
        title="Resumen de atención"
        subtitle="Cuántas recomendaciones están atendidas por completo, en proceso o sin atender."
        actions={<>
          <div style={{ width: 240 }}><SelectField label="Licenciatura" options={["Todas", ...LICENCIATURAS]} /></div>
          <div style={{ width: 200 }}><SelectField label="Ciclo" options={["2024 – 2029", "2019 – 2024"]} /></div>
          <Button variant="contorno" icon="descargar">Exportar</Button>
        </>}
      />
      <div className="grid-3">
        <KpiCard tono="verde" titulo="Atendidas (100%)" valor={String(totales.atendidas)} detalle={pct(totales.atendidas)} icon="check" />
        <KpiCard tono="naranja" titulo="En proceso (1–99%)" valor={String(totales.enProceso)} detalle={pct(totales.enProceso)} icon="reloj" />
        <KpiCard tono="rojo" titulo="Sin atender (0%)" valor={String(totales.sinAtender)} detalle={pct(totales.sinAtender)} icon="alerta" />
      </div>
      <div className="row row--top row--responsive" style={{ gap: 24 }}>
        <Card title="Distribución general" className="side-340">
          <Donut size={220} centro={String(total)} subtitulo="recomendaciones" segmentos={[
            { label: "100% atendidas", valor: totales.atendidas, color: VERDE },
            { label: "1–99% en proceso", valor: totales.enProceso, color: NARANJA },
            { label: "0% sin atender", valor: totales.sinAtender, color: ROJO },
          ]} />
          <Legend color={VERDE} label="100% atendidas" />
          <Legend color={NARANJA} label="1–99% en proceso" />
          <Legend color={ROJO} label="0% sin atender" />
        </Card>
        <Card title="Por licenciatura" className="grow" actions={<div className="row" style={{ gap: 16 }}><Legend color={VERDE} label="100%" /><Legend color={NARANJA} label="1–99%" /><Legend color={ROJO} label="0%" /></div>}>
          {ATENCION.map((a) => (
            <div key={a.licenciatura} className="row" style={{ gap: 16 }}>
              <span style={{ width: 240, flex: "0 0 240px" }}>{a.licenciatura}</span>
              <BarraApilada partes={[{ label: "100%", valor: a.atendidas, color: VERDE }, { label: "1–99%", valor: a.enProceso, color: NARANJA }, { label: "0%", valor: a.sinAtender, color: ROJO }]} />
              <span className="t-small t-muted">{a.atendidas} · {a.enProceso} · {a.sinAtender}</span>
            </div>
          ))}
        </Card>
      </div>
    </>
  );
};

export default AtencionPage;
