"use client";

// HU-08 · Revisión del informe de seguimiento por el Administrador.
// Base compartida: consulta en modo lectura con datos reales (avances, % esperado contra reportado, evidencias, historial).
// La línea B agrega aquí: botones Validar / Devolver / Reabrir (en `acciones` de PageTitle), la observación por
// recomendación (propiedad `pie` de TablaAvances) y el ConfirmModal, usando `ejecutar` de useInforme.
import type { ReactNode } from "react";
import { HistorialRevisiones } from "@/components/planes/RevisionHistory";
import { TablaAvances, conRezago } from "@/components/informes/TablaAvances";
import { useInforme } from "@/components/informes/useInforme";
import { LinkButton } from "@/components/ui/Button";
import { Alert, Badge, Card, EmptyState, PageTitle } from "@/components/ui/Display";
import { fechaHoraLegible, fechaLegible } from "@/lib/reglas-informe";
import { ESTADO_INFORME_BADGE, type InformeDetalle } from "@/lib/types";

const Fila = ({ titulo, children }: { titulo: string; children: ReactNode }) => (
  <div className="row"><span className="t-muted grow">{titulo}</span><span className="t-medium">{children}</span></div>
);

const AvisoEstado = ({ informe }: { informe: InformeDetalle }) => {
  if (informe.estado === "EN_REVISION") return null;
  if (informe.estado === "APROBADO") {
    return <Alert tipo="exito">Informe aprobado el {fechaHoraLegible(informe.aprobadoEn)}. La coordinación ya no puede modificarlo salvo que se reabra.</Alert>;
  }
  return (
    <Alert tipo="info">
      Este informe está en estado <strong>{ESTADO_INFORME_BADGE[informe.estado]}</strong>: la coordinación aún no lo envía a revisión.
    </Alert>
  );
};

export const RevisionInforme = ({ id }: { id: string }) => {
  const { informe, cargando, error, aviso } = useInforme(id);

  if (error && !informe) {
    return <EmptyState titulo="No pudimos abrir el informe" mensaje={error} icon="alerta" action={<LinkButton href="/admin/informes" variant="contorno">Volver a la lista</LinkButton>} />;
  }
  if (cargando || !informe) return <p className="t-muted">Cargando informe…</p>;

  const avances = informe.avances;
  const rezagos = avances.filter(conRezago).length;
  const alCien = avances.filter((a) => a.porcentaje === 100);

  return (
    <>
      <PageTitle
        crumbs={[{ label: "Inicio", href: "/admin/dashboard" }, { label: "Informes de seguimiento", href: "/admin/informes" }, { label: `${informe.licenciatura} · ${informe.periodo}` }]}
        title={`Informe de seguimiento ${informe.periodo} · Lic. en ${informe.licenciatura}`}
        subtitle={`Organismo: ${informe.organismo} · Ciclo ${informe.ciclo} · Corte al ${fechaLegible(informe.fechaCorte)}`}
      />
      {aviso && <Alert tipo="error">{aviso}</Alert>}
      <AvisoEstado informe={informe} />
      {informe.ultimaRevision && (
        <Alert tipo={informe.ultimaRevision.decision === "APROBADO" ? "exito" : "advertencia"}>
          Última revisión ({informe.ultimaRevision.fecha}, {informe.ultimaRevision.revisor}): {informe.ultimaRevision.decision === "APROBADO" ? "validado" : "devuelto"}.
          {informe.ultimaRevision.comentario ? ` ${informe.ultimaRevision.comentario}` : ""}
        </Alert>
      )}
      <HistorialRevisiones revisiones={informe.revisiones} recomendaciones={avances.map((a) => ({ id: a.recomendacionId, numero: a.numero }))} />
      <div className="row row--top row--responsive" style={{ gap: 24 }}>
        <div className="stack grow">
          <TablaAvances avances={avances} />
        </div>
        <aside className="stack side-340">
          <Card title="Datos del informe">
            <Fila titulo="Estado"><Badge estado={ESTADO_INFORME_BADGE[informe.estado]} /></Fila>
            <Fila titulo="Semestre">{informe.periodo}</Fila>
            <Fila titulo="Periodo">{fechaLegible(informe.fechaInicio)} – {fechaLegible(informe.fechaFin)}</Fila>
            <Fila titulo="Enviado">{fechaHoraLegible(informe.enviadoEn)}</Fila>
            <Fila titulo="Recomendaciones con avance">{informe.conAvance} / {informe.recomendaciones}</Fila>
            <Fila titulo="Evidencias">{informe.evidencias}</Fila>
          </Card>
          <Card title="Para revisar" style={{ gap: 8 }}>
            <span>{rezagos === 0 ? "Ninguna recomendación por debajo de lo esperado." : `${rezagos} recomendación(es) por debajo del % esperado al corte.`}</span>
            <span>{alCien.length} al 100 %{alCien.some((a) => a.evidencias.length === 0) ? ", alguna sin evidencia." : ", todas con evidencia."}</span>
          </Card>
        </aside>
      </div>
    </>
  );
};
