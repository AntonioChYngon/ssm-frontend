"use client";

// Resumen de atención (HU-15): GET /reportes/atencion. Cuenta el avance del último informe capturado (D3).
import { useEffect, useState } from "react";
import { BarraApilada, Donut, Legend } from "@/components/ui/Charts";
import { Card, EmptyState, KpiCard, PageTitle } from "@/components/ui/Display";
import { SelectField } from "@/components/ui/Field";
import { obtenerCatalogos, obtenerResumenAtencion } from "@/lib/api";
import type { AtencionLicenciatura, ItemCatalogo } from "@/lib/types";

const VERDE = "var(--color-success)";
const NARANJA = "var(--color-warning)";
const ROJO = "var(--color-danger)";
const TODAS = "Todas";

const AtencionPage = () => {
  const [licenciaturas, setLicenciaturas] = useState<ItemCatalogo[]>([]);
  const [licenciatura, setLicenciatura] = useState(TODAS);
  const [filas, setFilas] = useState<AtencionLicenciatura[]>([]);

  useEffect(() => {
    obtenerCatalogos().then((c) => setLicenciaturas(c.licenciaturas)).catch(() => setLicenciaturas([]));
  }, []);

  useEffect(() => {
    const id = licenciaturas.find((l) => l.nombre === licenciatura)?.id;
    obtenerResumenAtencion(id).then(setFilas).catch(() => setFilas([]));
  }, [licenciatura, licenciaturas]);

  const totales = filas.reduce((t, a) => ({ atendidas: t.atendidas + a.atendidas, enProceso: t.enProceso + a.enProceso, sinAtender: t.sinAtender + a.sinAtender }), { atendidas: 0, enProceso: 0, sinAtender: 0 });
  const total = totales.atendidas + totales.enProceso + totales.sinAtender;
  const pct = (n: number) => (total ? `${Math.round((n / total) * 100)}% de ${total} recomendaciones` : "sin recomendaciones evaluadas");

  return (
    <>
      <PageTitle
        crumbs={[{ label: "Inicio", href: "/admin/dashboard" }, { label: "Reportes" }, { label: "Resumen de atención" }]}
        title="Resumen de atención"
        subtitle="Cuántas recomendaciones están atendidas por completo, en proceso o sin atender."
        actions={<div style={{ width: 280 }}><SelectField label="Licenciatura" options={[TODAS, ...licenciaturas.map((l) => l.nombre)]} value={licenciatura} onChange={(e) => setLicenciatura(e.target.value)} /></div>}
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
          {filas.length === 0 ? (
            <EmptyState icon="pastel" titulo="Sin datos de atención" mensaje="El resumen se calcula con el último informe de seguimiento capturado de cada licenciatura." />
          ) : filas.map((a) => (
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
