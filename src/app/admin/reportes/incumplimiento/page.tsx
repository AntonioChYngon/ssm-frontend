"use client";

import { useMemo, useState } from "react";
import { SelectorLicenciaturas, useLicenciaturasEnUrl } from "@/components/filtros/SelectorLicenciaturas";
import { AvisoCicloConsultado, useCicloConsultado } from "@/components/historico/ConsultaHistorica";
import { Button } from "@/components/ui/Button";
import { Alert, Badge, Card, DataTable, EmptyState, PageTitle, Progress } from "@/components/ui/Display";
import { TextField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { obtenerIncumplimientos } from "@/lib/api";
import type { Incumplimiento } from "@/lib/types";

const hoy = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const fechaLegible = (fecha: string | null) => fecha ? fecha.split("-").reverse().join("/") : "Sin fecha";
const mensaje = (error: unknown) => error instanceof Error ? error.message : "No pudimos generar el reporte.";

const IncumplimientoPage = () => {
  const licenciaturas = useLicenciaturasEnUrl();
  // HU-16: ?cicloId= genera el reporte sobre un ciclo histórico.
  const ciclo = useCicloConsultado();
  const [fechaCorte, setFechaCorte] = useState(hoy);
  const [porcentaje, setPorcentaje] = useState("50");
  const [filas, setFilas] = useState<Incumplimiento[] | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string>();
  const [consulta, setConsulta] = useState<{ fecha: string; porcentaje: number }>();

  const afectadas = useMemo(() => new Set((filas ?? []).map((f) => f.licenciaturaId)).size, [filas]);
  const errorPorcentaje = porcentaje === "" || !Number.isInteger(Number(porcentaje)) || Number(porcentaje) < 1 || Number(porcentaje) > 100
    ? "Escribe un entero entre 1 y 100."
    : undefined;

  const generar = async () => {
    setError(undefined);
    if (!fechaCorte) {
      setError("Selecciona la fecha de corte.");
      return;
    }
    if (errorPorcentaje) {
      setError("Revisa el porcentaje esperado.");
      return;
    }
    const esperado = Number(porcentaje);
    setCargando(true);
    try {
      const resultado = await obtenerIncumplimientos({ fechaCorte, porcentajeEsperado: esperado, licenciaturaIds: licenciaturas.parametro, cicloId: ciclo.cicloId });
      setFilas(resultado);
      setConsulta({ fecha: fechaCorte, porcentaje: esperado });
    } catch (e) {
      setError(mensaje(e));
      setFilas(null);
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      <PageTitle
        crumbs={[{ label: "Inicio", href: "/admin/dashboard" }, { label: "Reportes" }, { label: "Incumplimiento" }]}
        title="Reporte ejecutivo de incumplimiento"
        subtitle="Detecta recomendaciones y metas cuyo avance registrado está debajo del porcentaje requerido en una fecha de corte."
      />
      <AvisoCicloConsultado etiqueta={ciclo.etiqueta} alQuitar={ciclo.quitar} />
      <Card title="Parámetros obligatorios" subtitle="El reporte toma el último avance capturado hasta la fecha indicada.">
        <div className="row row--end row--responsive">
          <div className="grow"><TextField label="Fecha de corte" icon="calendario" type="date" required value={fechaCorte} onChange={(e) => setFechaCorte(e.target.value)} /></div>
          <div className="grow"><TextField label="Porcentaje esperado" type="number" min={1} max={100} step={1} required value={porcentaje} error={porcentaje !== "" ? errorPorcentaje : undefined} help="Entero de 1 a 100" onChange={(e) => setPorcentaje(e.target.value)} /></div>
          <SelectorLicenciaturas seleccion={licenciaturas.ids} alCambiar={licenciaturas.cambiar} />
          <Button icon="filtro" disabled={cargando || !licenciaturas.listo} onClick={() => void generar()}>{cargando ? "Generando…" : "Generar reporte"}</Button>
        </div>
      </Card>
      {error && <Alert tipo="error">{error}</Alert>}
      {consulta && filas && (
        <Alert tipo={filas.length ? "advertencia" : "exito"}>
          {filas.length
            ? `${filas.length} ${filas.length === 1 ? "meta identificada" : "metas identificadas"} en ${afectadas} ${afectadas === 1 ? "licenciatura" : "licenciaturas"}, con avance menor a ${consulta.porcentaje}% al ${fechaLegible(consulta.fecha)}.`
            : `No hay incumplimientos por debajo de ${consulta.porcentaje}% al ${fechaLegible(consulta.fecha)}.`}
        </Alert>
      )}
      {filas === null && !cargando && !error && <EmptyState icon="tendencia-baja" titulo="Genera el reporte" mensaje="Selecciona la fecha de corte, el porcentaje esperado y las licenciaturas que quieres consultar." />}
      {cargando && <p className="t-muted" role="status">Consultando avances…</p>}
      {filas && filas.length > 0 && (
        <DataTable<Incumplimiento>
          caption="Recomendaciones y metas por debajo del avance esperado"
          rows={filas}
          rowKey={(f) => f.id}
          columns={[
            { header: "Licenciatura", width: 190, render: (f) => <><span className="t-medium">{f.licenciatura}</span><br /><span className="t-small t-muted">Ciclo {f.ciclo}</span></> },
            { header: "Recomendación", width: 300, render: (f) => <><span className="t-medium">Recomendación {f.numeroRecomendacion}</span><br /><span className="t-small t-muted">{f.indicador}</span><br />{f.recomendacion}</> },
            { header: "Meta", render: (f) => <>{f.meta}<br /><span className="t-small t-muted">Compromiso: {fechaLegible(f.fechaCompromiso)}{f.porcentajeMeta === null ? "" : ` · ${f.porcentajeMeta}% propio`}</span></> },
            { header: "Avance al corte", width: 160, render: (f) => <Progress value={f.real} width={80} /> },
            { header: "Brecha", width: 120, render: (f) => <Badge estado={f.brecha >= 25 ? "Vencido" : "Pendiente"}>−{f.brecha} pts</Badge> },
          ]}
        />
      )}
      <p className="row t-small t-muted" style={{ gap: 8, margin: 0 }}><Icon name="info" size={18} />Una recomendación sin avance registrado se considera con 0% para este reporte.</p>
    </>
  );
};

export default IncumplimientoPage;
