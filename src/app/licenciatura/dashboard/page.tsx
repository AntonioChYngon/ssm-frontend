"use client";

// Inicio de la coordinación: todo sale de su plan real (GET /mi-plan). Sin datos simulados.
import { useEffect, useState } from "react";
import { LinkButton } from "@/components/ui/Button";
import { Alert, Badge, Card, EmptyState, KpiCard, PageTitle, Stepper } from "@/components/ui/Display";
import { Icon } from "@/components/ui/Icon";
import { ApiError, leerUsuarioSesion, listarNotificaciones, obtenerMiPlan } from "@/lib/api";
import { fechaCorta } from "@/lib/reglas";
import { ESTADO_VERSION_BADGE, type EstadoVersionPlan, type Notificacion, type PlanDeMejora } from "@/lib/types";

const PASO: Record<EstadoVersionPlan, number> = { BORRADOR: 0, DEVUELTO: 0, EN_REVISION: 2, APROBADO: 3 };

const DashboardLicenciaturaPage = () => {
  const [nombre, setNombre] = useState("");
  const [plan, setPlan] = useState<PlanDeMejora | null>(null);
  const [sinCiclo, setSinCiclo] = useState<string>();
  const [error, setError] = useState<string>();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);

  useEffect(() => {
    setNombre(leerUsuarioSesion()?.nombre ?? "");
    obtenerMiPlan()
      .then(setPlan)
      .catch((e) => {
        if (e instanceof ApiError && e.status === 404) setSinCiclo(e.message);
        else setError(e instanceof ApiError ? e.message : "No pudimos cargar tu plan de mejora.");
      });
    listarNotificaciones().then(setNotificaciones).catch(() => setNotificaciones([]));
  }, []);

  const recomendaciones = plan?.indicadores.reduce((suma, i) => suma + i.recomendaciones.length, 0) ?? 0;
  const estado = plan?.version?.estado;
  const nuevas = notificaciones.filter((n) => !n.leida).length;

  return (
    <>
      <PageTitle
        title={nombre ? `Hola, ${nombre}` : "Mi licenciatura"}
        subtitle={plan
          ? `Licenciatura en ${plan.licenciatura} · Vigencia ${fechaCorta(plan.vigenciaInicio)} al ${fechaCorta(plan.vigenciaFin)} · ${plan.organismo}`
          : "Resumen de tu plan de mejora."}
        actions={plan && (!plan.version || plan.version.editable)
          ? <LinkButton href="/licenciatura/plan" icon="editar">{plan.version ? "Continuar captura" : "Capturar plan de mejora"}</LinkButton>
          : undefined}
      />

      {error && <Alert tipo="error">{error}</Alert>}
      {sinCiclo && <Alert tipo="advertencia">{sinCiclo} Cuando lo haga, podrás capturar tu plan desde aquí.</Alert>}
      {plan && !plan.version && <Alert tipo="info">Aún no capturas tu Plan de Mejora. Empieza con la primera recomendación del organismo acreditador.</Alert>}

      <div className="grid-4">
        <KpiCard tono="azul" titulo="Recomendaciones" valor={String(recomendaciones)} detalle="registradas en tu plan" icon="documento" />
        <KpiCard tono="verde" titulo="Indicadores" valor={String(plan?.indicadores.length ?? 0)} detalle="con al menos una recomendación" icon="check" />
        <KpiCard tono="naranja" titulo="Hitos configurados" valor="0" detalle="se definen en Configuración de hitos" icon="objetivo" />
        <KpiCard tono="rojo" titulo="Observaciones" valor="0" detalle="pendientes de atender" icon="mensaje" />
      </div>

      <Card title="Estado del plan" actions={estado ? <Badge estado={ESTADO_VERSION_BADGE[estado]} /> : <Badge estado="Pendiente">Sin captura</Badge>}>
        <Stepper pasos={["Borrador", "Enviado", "En revisión", "Validado"]} actual={estado ? PASO[estado] : 0} />
      </Card>

      <div className="row row--top row--responsive" style={{ gap: 24 }}>
        <Card title="Próximos hitos" className="grow" actions={<LinkButton href="/licenciatura/hitos" variant="texto" icon="chevron-derecha">Ver todos</LinkButton>}>
          <EmptyState icon="objetivo" titulo="Sin hitos por vencer" mensaje="Cuando configures hitos intermedios para tus recomendaciones, los próximos vencimientos aparecerán aquí." />
        </Card>
        <section className="card card--flush side-380" aria-labelledby="notif-dash">
          <div className="row" style={{ padding: "20px 24px 12px", gap: 8 }}>
            <h2 id="notif-dash" className="t-h3 grow">Notificaciones</h2>
            <Badge estado="Nuevo">{nuevas} nuevas</Badge>
          </div>
          {notificaciones.length === 0 ? (
            <p className="t-small t-muted" style={{ padding: "0 24px 20px", margin: 0 }}>No tienes notificaciones.</p>
          ) : notificaciones.slice(0, 3).map((n) => (
            <a key={n.id} href={n.enlace} className={["notif", n.leida ? "" : "notif--unread"].join(" ")} style={{ color: "inherit", textDecoration: "none" }}>
              <Icon name={n.tipo === "VENCIMIENTO" ? "reloj" : n.tipo === "HITO" ? "objetivo" : "mensaje"} className="t-primary" />
              <div className="grow">
                <div className="t-medium">{n.titulo}</div>
                <div className="t-small t-muted">{n.descripcion}</div>
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
