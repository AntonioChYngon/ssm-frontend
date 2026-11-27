"use client";

// Dashboard de la coordinación con datos reales de su ciclo vigente.
import { useEffect, useState } from "react";
import { LinkButton } from "@/components/ui/Button";
import { EstadoMiPlan, TablaPlanes } from "@/components/planes/PlanesDashboard";
import { Alert, Badge, Card, EmptyState, KpiCard, PageTitle, Progress } from "@/components/ui/Display";
import { Icon } from "@/components/ui/Icon";
import { leerUsuarioSesion, listarNotificaciones, obtenerDashboardLicenciatura } from "@/lib/api";
import type { DashboardLicenciatura, EstadoBadge, MetaProxima, Notificacion } from "@/lib/types";

const ESTADO_META: Record<MetaProxima["estado"], { badge: EstadoBadge; texto: string }> = {
  CUMPLIDA: { badge: "Completado", texto: "Cumplida" },
  PENDIENTE: { badge: "Pendiente", texto: "Pendiente" },
  VENCIDA: { badge: "Vencido", texto: "Vencida" },
};

const fechaLegible = (fecha: string) => fecha.split("-").reverse().join("/");
const primerNombre = (nombre: string | undefined) => nombre?.trim().split(/\s+/)[0] ?? "";

const DashboardLicenciaturaPage = () => {
  const [datos, setDatos] = useState<DashboardLicenciatura | null>(null);
  const [avisos, setAvisos] = useState<Notificacion[] | null>(null);
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState<string>();

  useEffect(() => {
    setNombre(primerNombre(leerUsuarioSesion()?.nombre));
    let vigente = true;
    obtenerDashboardLicenciatura()
      .then((d) => { if (vigente) setDatos(d); })
      .catch((e: unknown) => { if (vigente) setError(e instanceof Error ? e.message : "No pudimos cargar tu dashboard."); });
    listarNotificaciones()
      .then((n) => { if (vigente) setAvisos(n); })
      .catch(() => { if (vigente) setAvisos([]); });
    return () => { vigente = false; };
  }, []);

  const ciclo = datos?.ciclo;
  const nuevas = avisos?.filter((n) => !n.leida).length ?? 0;
  const editable = datos?.planEstado === null || datos?.planEstado === "BORRADOR" || datos?.planEstado === "DEVUELTO";

  return (
    <>
      <PageTitle
        title={nombre ? `Hola, ${nombre}` : "Mi licenciatura"}
        subtitle={ciclo ? `${ciclo.licenciatura} · Ciclo ${ciclo.nombre} · Organismo acreditador: ${ciclo.organismo}` : "Tu licenciatura aún no tiene un ciclo de acreditación vigente."}
        actions={
          <>
            <LinkButton href="/licenciatura/informe" variant="contorno" icon="subir">Informe de seguimiento</LinkButton>
            <LinkButton href="/licenciatura/plan" icon={editable ? "editar" : "ver"}>{editable ? "Continuar captura" : "Ver plan"}</LinkButton>
          </>
        }
      />
      {error && <Alert tipo="error">{error}</Alert>}
      <EstadoMiPlan />
      {datos && (
        <div className="grid-4">
          <KpiCard tono="azul" titulo="Recomendaciones" valor={String(datos.recomendaciones)} detalle={`avance promedio ${datos.avance.real}% (esperado ${datos.avance.esperado}%)`} icon="documento" />
          <KpiCard
            tono="verde"
            titulo="Atendidas"
            valor={`${datos.atendidas} / ${datos.recomendaciones}`}
            detalle={datos.recomendaciones ? `${Math.round((datos.atendidas / datos.recomendaciones) * 100)}% del plan al 100%` : "sin recomendaciones"}
            icon="check"
          />
          <KpiCard tono="naranja" titulo="Por vencer" valor={String(datos.porVencer)} detalle="fechas límite en los próximos 15 días" icon="reloj" />
          <KpiCard tono="rojo" titulo="Vencidas o en rezago" valor={String(datos.vencidas)} detalle={datos.vencidas ? "requieren atención" : "todo al día"} icon="alerta" />
        </div>
      )}
      <TablaPlanes vista="licenciatura" />
      <div className="row row--top row--responsive" style={{ gap: 24 }}>
        <Card title="Próximas metas" subtitle="Primero las vencidas sin cumplir; el avance es el de tu último informe capturado." className="grow"
          actions={<LinkButton href="/licenciatura/metas" variant="texto" icon="chevron-derecha">Ver todas</LinkButton>}>
          {!datos && !error && <p className="t-muted" style={{ margin: 0 }}>Cargando…</p>}
          {datos?.metas.length === 0 && <EmptyState icon="objetivo" titulo="Sin metas con fecha" mensaje="Configura la fecha y el % esperado de tus metas para verlas aquí." />}
          {datos?.metas.map((m) => (
            <div key={`${m.recomendacion}-${m.meta}-${m.fecha}`} className="row" style={{ gap: 16 }}>
              <div className="grow">
                <div className="t-medium">{m.meta}</div>
                <div className="t-small t-muted">{m.recomendacion} · {m.estado === "VENCIDA" ? "venció" : "vence"} {fechaLegible(m.fecha)}</div>
              </div>
              <div className="stack" style={{ gap: 4 }}>
                <Progress value={m.actual} width={140} />
                <span className="t-small t-muted">esperado {m.esperado}%</span>
              </div>
              <Badge estado={ESTADO_META[m.estado].badge}>{ESTADO_META[m.estado].texto}</Badge>
            </div>
          ))}
        </Card>
        <section className="card card--flush side-380" aria-labelledby="notif-dash">
          <div className="row" style={{ padding: "20px 24px 12px", gap: 8 }}>
            <h2 id="notif-dash" className="t-h3 grow">Notificaciones</h2>
            <Badge estado="Nuevo">{nuevas} {nuevas === 1 ? "nueva" : "nuevas"}</Badge>
          </div>
          {avisos?.length === 0 && <p className="t-muted" style={{ padding: "0 24px 20px", margin: 0 }}>No tienes notificaciones.</p>}
          {avisos?.slice(0, 3).map((n) => (
            <a key={n.id} href={n.enlace} className={["notif", n.leida ? "" : "notif--unread"].join(" ")} style={{ color: "inherit", textDecoration: "none" }}>
              <Icon name={n.tipo === "VENCIMIENTO" ? "reloj" : n.tipo === "META" ? "objetivo" : n.tipo === "PLAN" ? "documento" : "mensaje"} className="t-primary" />
              <div className="grow">
                <div className="t-medium">{n.titulo}</div>
                <div className="t-small t-muted" style={{ whiteSpace: "pre-line", maxHeight: 60, overflow: "hidden" }}>{n.descripcion}</div>
                <div className="t-small t-muted">{n.fecha}</div>
              </div>
            </a>
          ))}
        </section>
      </div>
    </>
  );
};

export default DashboardLicenciaturaPage;
