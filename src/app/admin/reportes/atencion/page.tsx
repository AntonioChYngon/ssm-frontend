"use client";

import { useEffect, useMemo, useState } from "react";
import { SelectorLicenciaturas, useLicenciaturasEnUrl } from "@/components/filtros/SelectorLicenciaturas";
import { AvisoCicloConsultado, useCicloConsultado } from "@/components/historico/ConsultaHistorica";
import { BarraApilada, Donut, Legend } from "@/components/ui/Charts";
import { Alert, Card, DataTable, EmptyState, KpiCard, PageTitle } from "@/components/ui/Display";
import { obtenerResumenAtencion } from "@/lib/api";
import type { AtencionLicenciatura } from "@/lib/types";

const VERDE = "var(--color-success)";
const NARANJA = "var(--color-warning)";
const ROJO = "var(--color-danger)";
const mensaje = (error: unknown) => error instanceof Error ? error.message : "No pudimos cargar el resumen de atención.";

const AtencionPage = () => {
  const licenciaturas = useLicenciaturasEnUrl();
  // HU-16: ?cicloId= consulta un ciclo histórico.
  const ciclo = useCicloConsultado();
  const [filas, setFilas] = useState<AtencionLicenciatura[] | null>(null);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!licenciaturas.listo || !ciclo.listo) return;
    let vigente = true;
    setFilas(null);
    setError(undefined);
    obtenerResumenAtencion(licenciaturas.parametro, ciclo.cicloId)
      .then((datos) => vigente && setFilas(datos))
      .catch((e: unknown) => { if (vigente) { setError(mensaje(e)); setFilas([]); } });
    return () => { vigente = false; };
  }, [licenciaturas.listo, licenciaturas.parametro, ciclo.listo, ciclo.cicloId]);

  const totales = useMemo(() => (filas ?? []).reduce(
    (t, f) => ({ atendidas: t.atendidas + f.atendidas, enProceso: t.enProceso + f.enProceso, sinAtender: t.sinAtender + f.sinAtender }),
    { atendidas: 0, enProceso: 0, sinAtender: 0 },
  ), [filas]);
  const total = totales.atendidas + totales.enProceso + totales.sinAtender;
  const detalle = (n: number) => total ? `${Math.round((n / total) * 100)}% de ${total} recomendaciones` : "0 recomendaciones";

  return (
    <>
      <PageTitle
        crumbs={[{ label: "Inicio", href: "/admin/dashboard" }, { label: "Reportes" }, { label: "Resumen de atención" }]}
        title="Resumen general de atención"
        subtitle="Conteo cuantitativo de recomendaciones atendidas, en proceso y no atendidas en el ciclo vigente."
        actions={<SelectorLicenciaturas seleccion={licenciaturas.ids} alCambiar={licenciaturas.cambiar} />}
      />
      <AvisoCicloConsultado etiqueta={ciclo.etiqueta} alQuitar={ciclo.quitar} />
      {error && <Alert tipo="error">{error}</Alert>}
      {filas === null && !error && <p className="t-muted" role="status">Calculando el resumen…</p>}
      {filas && (
        <>
          <div className="grid-3">
            <KpiCard tono="verde" titulo="Atendidas (100%)" valor={String(totales.atendidas)} detalle={detalle(totales.atendidas)} icon="check" />
            <KpiCard tono="naranja" titulo="En proceso (1–99%)" valor={String(totales.enProceso)} detalle={detalle(totales.enProceso)} icon="reloj" />
            <KpiCard tono="rojo" titulo="No atendidas (0%)" valor={String(totales.sinAtender)} detalle={detalle(totales.sinAtender)} icon="alerta" />
          </div>
          {filas.length === 0 ? (
            <EmptyState icon="grafica" titulo="Sin recomendaciones para resumir" mensaje="No hay un plan aprobado en el ciclo vigente de las licenciaturas seleccionadas." />
          ) : (
            <div className="row row--top row--responsive" style={{ gap: 24 }}>
              <Card title="Distribución general" className="side-340">
                {total > 0 && <Donut size={220} centro={String(total)} subtitulo="recomendaciones" segmentos={[
                  { label: "100% atendidas", valor: totales.atendidas, color: VERDE },
                  { label: "1–99% en proceso", valor: totales.enProceso, color: NARANJA },
                  { label: "0% no atendidas", valor: totales.sinAtender, color: ROJO },
                ]} />}
                <Legend color={VERDE} label="100% atendidas" valor={totales.atendidas} />
                <Legend color={NARANJA} label="1–99% en proceso" valor={totales.enProceso} />
                <Legend color={ROJO} label="0% no atendidas" valor={totales.sinAtender} />
              </Card>
              <Card title="Por licenciatura" className="grow">
                <DataTable<AtencionLicenciatura>
                  caption="Resumen de atención por licenciatura"
                  rows={filas}
                  rowKey={(f) => f.licenciaturaId}
                  columns={[
                    { header: "Licenciatura", render: (f) => <span className="t-medium">{f.licenciatura}</span> },
                    { header: "Distribución", width: 380, render: (f) => <BarraApilada partes={[{ label: "100%", valor: f.atendidas, color: VERDE }, { label: "1–99%", valor: f.enProceso, color: NARANJA }, { label: "0%", valor: f.sinAtender, color: ROJO }]} /> },
                    { header: "Atendidas", width: 100, render: (f) => f.atendidas },
                    { header: "En proceso", width: 110, render: (f) => f.enProceso },
                    { header: "No atendidas", width: 120, render: (f) => f.sinAtender },
                  ]}
                />
              </Card>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default AtencionPage;
