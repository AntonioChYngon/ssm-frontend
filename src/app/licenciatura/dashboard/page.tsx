import type { Metadata } from "next";
import { LinkButton } from "@/components/ui/Button";
import { EstadoMiPlan, TablaPlanes } from "@/components/planes/PlanesDashboard";
import { Badge, Card, KpiCard, PageTitle, Progress } from "@/components/ui/Display";
import { Icon } from "@/components/ui/Icon";
import { NOTIFICACIONES, PROXIMAS_METAS } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Mi licenciatura" };

const DashboardLicenciaturaPage = () => (
  <>
    <PageTitle
      title="Hola, Jorge"
      subtitle="Licenciatura en Actuaría · Plan 2024–2029 · Organismo acreditador: CONAC"
      actions={<><LinkButton href="/licenciatura/informe" variant="contorno" icon="subir">Informe de seguimiento</LinkButton><LinkButton href="/licenciatura/plan" icon="editar">Continuar captura</LinkButton></>}
    />
    <EstadoMiPlan />
    <div className="grid-4">
      <KpiCard tono="azul" titulo="Recomendaciones" valor="12" detalle="con acciones registradas" icon="documento" />
      <KpiCard tono="verde" titulo="Metas cumplidas" valor="7 / 18" detalle="39% del plan" icon="check" />
      <KpiCard tono="naranja" titulo="Por vencer" valor="3" detalle="en los próximos 15 días" icon="reloj" />
      <KpiCard tono="rojo" titulo="Vencidos" valor="1" detalle="requiere atención" icon="alerta" />
    </div>
    <TablaPlanes vista="licenciatura" />
    <div className="row row--top row--responsive" style={{ gap: 24 }}>
      <Card title="Próximas metas" className="grow" actions={<LinkButton href="/licenciatura/metas" variant="texto" icon="chevron-derecha">Ver todas</LinkButton>}>
        {PROXIMAS_METAS.map((h) => (
          <div key={h.meta} className="row" style={{ gap: 16 }}>
            <div className="grow">
              <div className="t-medium">{h.meta}</div>
              <div className="t-small t-muted">{h.recomendacion} · vence {h.vence}</div>
            </div>
            <div className="stack" style={{ gap: 4 }}>
              <Progress value={h.real} width={140} />
              <span className="t-small t-muted">esperado {h.esperado}%</span>
            </div>
            <Badge estado={h.estado} />
          </div>
        ))}
      </Card>
      <section className="card card--flush side-380" aria-labelledby="notif-dash">
        <div className="row" style={{ padding: "20px 24px 12px", gap: 8 }}>
          <h2 id="notif-dash" className="t-h3 grow">Notificaciones</h2>
          <Badge estado="Nuevo">{NOTIFICACIONES.filter((n) => !n.leida).length} nuevas</Badge>
        </div>
        {NOTIFICACIONES.slice(0, 3).map((n) => (
          <a key={n.id} href={n.enlace} className={["notif", n.leida ? "" : "notif--unread"].join(" ")} style={{ color: "inherit", textDecoration: "none" }}>
            <Icon name={n.tipo === "VENCIMIENTO" ? "reloj" : n.tipo === "META" ? "objetivo" : n.tipo === "PLAN" ? "documento" : "mensaje"} className="t-primary" />
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

export default DashboardLicenciaturaPage;
