"use client";

// Dashboard global del Administrador con datos reales del ciclo vigente de cada licenciatura.
import { useEffect, useState } from "react";
import { LinkButton } from "@/components/ui/Button";
import { EstadosPlanesDonut, TablaPlanes } from "@/components/planes/PlanesDashboard";
import { SelectorLicenciaturas, useLicenciaturasEnUrl } from "@/components/filtros/SelectorLicenciaturas";
import { BarraEsperada, Legend } from "@/components/ui/Charts";
import { Alert, Avatar, Badge, Card, DataTable, EmptyState, KpiCard, PageTitle } from "@/components/ui/Display";
import { listarBitacora, obtenerDashboardAdmin } from "@/lib/api";
import type { AlertaDashboard, DashboardAdmin, EstadoBadge, EventoAuditoria } from "@/lib/types";

const ETIQUETA: Record<AlertaDashboard["tipo"], { texto: string; badge: EstadoBadge }> = {
  VENCIDA: { texto: "Fecha límite vencida", badge: "Vencido" },
  REZAGO: { texto: "Rezago en hito", badge: "Devuelto" },
  FECHA_LIMITE: { texto: "Vence pronto", badge: "Pendiente" },
};

const fechaLegible = (fecha: string | null) => (fecha ? fecha.split("-").reverse().join("/") : "—");
const fechaLarga = (fecha: string) =>
  new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${fecha}T00:00:00Z`));
const iniciales = (nombre: string) => nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";
const cuando = (iso: string) =>
  new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Mexico_City" }).format(new Date(iso));
const pct = (n: number, de: number) => (de ? `${Math.round((n / de) * 100)}% del total` : "sin planes aún");

const DashboardGlobalPage = () => {
  const licenciaturas = useLicenciaturasEnUrl();
  const [datos, setDatos] = useState<DashboardAdmin | null>(null);
  const [actividad, setActividad] = useState<EventoAuditoria[] | null>(null);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!licenciaturas.listo) return;
    let vigente = true;
    setError(undefined);
    obtenerDashboardAdmin(licenciaturas.parametro)
      .then((d) => { if (vigente) setDatos(d); })
      .catch((e: unknown) => { if (vigente) setError(e instanceof Error ? e.message : "No pudimos cargar el dashboard."); });
    // Actividad reciente: los últimos movimientos de la bitácora (sin inicios de sesión).
    listarBitacora({ licenciaturaIds: licenciaturas.parametro, limite: 25 })
      .then((p) => { if (vigente) setActividad(p.eventos.filter((e) => e.tipo !== "SESION").slice(0, 5)); })
      .catch(() => { if (vigente) setActividad([]); });
    return () => { vigente = false; };
  }, [licenciaturas.listo, licenciaturas.parametro]);

  return (
    <>
      <PageTitle
        title="Dashboard global"
        subtitle={datos ? `Ciclo vigente de cada licenciatura al ${fechaLarga(datos.fecha)}.` : "Panorama del ciclo vigente de cada licenciatura."}
        actions={<SelectorLicenciaturas seleccion={licenciaturas.ids} alCambiar={licenciaturas.cambiar} />}
      />
      {error && <Alert tipo="error">{error}</Alert>}
      {!datos && !error && <p className="t-muted" aria-busy="true">Cargando indicadores…</p>}
      {datos && (
        <>
          <div className="grid-4">
            <KpiCard tono="azul" titulo="Planes registrados" valor={String(datos.conPlan)} detalle={`de ${datos.licenciaturas} licenciaturas`} icon="documento" />
            <KpiCard tono="verde" titulo="Planes validados" valor={String(datos.planesValidados)} detalle={pct(datos.planesValidados, datos.conPlan)} icon="check" />
            <KpiCard
              tono="naranja"
              titulo="Por validar"
              valor={String(datos.porValidar.planes + datos.porValidar.informes)}
              detalle={`${datos.porValidar.planes} ${datos.porValidar.planes === 1 ? "plan" : "planes"} y ${datos.porValidar.informes} ${datos.porValidar.informes === 1 ? "informe" : "informes"}`}
              icon="reloj"
            />
            <KpiCard
              tono="rojo"
              titulo="Metas vencidas o en rezago"
              valor={String(datos.alertas.vencidas)}
              detalle={`en ${datos.alertas.licenciaturas} ${datos.alertas.licenciaturas === 1 ? "licenciatura" : "licenciaturas"}`}
              icon="alerta"
            />
          </div>
          <div className="row row--top row--responsive" style={{ gap: 24 }}>
            <Card
              title="Avance real vs. esperado"
              subtitle="Planes validados: promedio del último avance capturado contra lo comprometido a hoy"
              className="grow"
              actions={<div className="row" style={{ gap: 16 }}><Legend color="var(--color-primary)" label="Avance real" /><Legend color="var(--color-accent)" label="Esperado a hoy" /></div>}
            >
              {datos.avance.length === 0 && <p className="t-muted" style={{ margin: 0 }}>Aún no hay planes validados en el ciclo vigente.</p>}
              {datos.avance.map((a) => (
                <div key={a.licenciatura} className="row" style={{ gap: 16 }}>
                  <span style={{ width: 240, flex: "0 0 240px" }} className="t-body">{a.licenciatura}</span>
                  <BarraEsperada real={a.real} esperado={a.esperado} width={360} />
                  <span className="t-medium">{a.real}%</span>
                  <span className="t-small t-muted">/ {a.esperado}%</span>
                </div>
              ))}
            </Card>
            <EstadosPlanesDonut />
          </div>
          <TablaPlanes vista="admin" />
          <div className="row row--top row--responsive" style={{ gap: 24 }}>
            <Card title="Fechas vencidas y próximas" subtitle="Rezagos en hitos y fechas límite de los próximos 30 días" className="grow"
              actions={<LinkButton href="/admin/reportes/incumplimiento" variant="texto" icon="chevron-derecha">Ver reporte</LinkButton>}>
              {datos.vencimientos.length === 0 ? (
                <EmptyState icon="check" titulo="Sin pendientes" mensaje="No hay fechas vencidas ni rezagos en los planes validados." />
              ) : (
                <DataTable<AlertaDashboard>
                  caption="Fechas vencidas y próximas"
                  rowKey={(v) => v.clave}
                  rows={datos.vencimientos}
                  columns={[
                    { header: "Licenciatura", width: 170, render: (v) => <span className="t-medium">{v.licenciatura}</span> },
                    { header: "Recomendación y meta", render: (v) => <>{v.recomendacion}<br /><span className="t-small t-muted">{v.meta}</span></> },
                    { header: "Avance", width: 120, render: (v) => `${v.actual}% de ${v.comprometido}%` },
                    { header: "Fecha", width: 110, render: (v) => fechaLegible(v.fechaHito ?? v.fechaLimite) },
                    { header: "Estado", width: 170, render: (v) => <Badge estado={ETIQUETA[v.tipo].badge}>{ETIQUETA[v.tipo].texto}</Badge> },
                  ]}
                />
              )}
            </Card>
            <Card title="Actividad reciente" className="side-380" actions={<LinkButton href="/admin/bitacora" variant="texto" icon="chevron-derecha">Bitácora</LinkButton>}>
              {actividad === null && <p className="t-muted" style={{ margin: 0 }}>Cargando…</p>}
              {actividad?.length === 0 && <p className="t-muted" style={{ margin: 0 }}>Sin movimientos recientes.</p>}
              {actividad?.map((e) => (
                <div key={e.id} className="row row--top" style={{ gap: 12 }}>
                  <Avatar iniciales={iniciales(e.usuario.nombre)} />
                  <div>
                    <div className="t-medium">{e.usuario.nombre}: {e.accion}</div>
                    {e.contexto && <div className="t-small">{e.contexto}</div>}
                    <div className="t-small t-muted">{cuando(e.fecha)}</div>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        </>
      )}
    </>
  );
};

export default DashboardGlobalPage;
