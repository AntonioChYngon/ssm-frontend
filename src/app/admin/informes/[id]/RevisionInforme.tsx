"use client";

// HU-08 · Revisión del informe de seguimiento por el Administrador: avances con % esperado contra reportado,
// evidencias (pestaña nueva), observación por recomendación, Validar / Devolver / Reabrir e historial.
import { useState, type ReactNode } from "react";
import { HistorialCambios } from "@/components/auditoria/HistorialCambios";
import { HistorialRevisiones } from "@/components/planes/RevisionHistory";
import { TablaAvances, conRezago } from "@/components/informes/TablaAvances";
import { useInforme } from "@/components/informes/useInforme";
import { Button, LinkButton } from "@/components/ui/Button";
import { Alert, Badge, Card, EmptyState, PageTitle } from "@/components/ui/Display";
import { TextAreaField } from "@/components/ui/Field";
import { ConfirmModal } from "@/components/ui/Interactive";
import { devolverInforme, reabrirInforme, validarInforme } from "@/lib/api";
import { fechaHoraLegible, fechaLegible } from "@/lib/reglas-informe";
import { ESTADO_INFORME_BADGE, type InformeDetalle } from "@/lib/types";

type Accion = "validar" | "devolver" | "reabrir";

const EXITO: Record<Accion, string> = {
  validar: "Informe validado. Se avisó a la coordinación por correo y en la aplicación.",
  devolver: "Informe devuelto con tus observaciones. Se avisó a la coordinación.",
  reabrir: "Informe reabierto. La coordinación puede corregirlo y volver a enviarlo.",
};

const Fila = ({ titulo, children }: { titulo: string; children: ReactNode }) => (
  <div className="row"><span className="t-muted grow">{titulo}</span><span className="t-medium">{children}</span></div>
);

const AvisoEstado = ({ informe }: { informe: InformeDetalle }) => {
  if (informe.estado === "EN_REVISION") return null;
  if (informe.estado === "APROBADO") {
    return <Alert tipo="exito">Informe aprobado el {fechaHoraLegible(informe.aprobadoEn)}. La coordinación ya no puede modificarlo; si hace falta un cambio, reábrelo.</Alert>;
  }
  return (
    <Alert tipo="info">
      Este informe está en estado <strong>{ESTADO_INFORME_BADGE[informe.estado]}</strong>: la coordinación aún no lo envía a revisión.
    </Alert>
  );
};

export const RevisionInforme = ({ id }: { id: string }) => {
  const { informe, cargando, error, aviso, ocupado, ejecutar } = useInforme(id);
  const [modal, setModal] = useState<Accion | null>(null);
  const [observaciones, setObservaciones] = useState<Record<string, string>>({});
  const [exito, setExito] = useState<string | null>(null);

  if (error && !informe) {
    return <EmptyState titulo="No pudimos abrir el informe" mensaje={error} icon="alerta" action={<LinkButton href="/admin/informes" variant="contorno">Volver a la lista</LinkButton>} />;
  }
  if (cargando || !informe) return <p className="t-muted">Cargando informe…</p>;

  const avances = informe.avances;
  const enRevision = informe.estado === "EN_REVISION";
  const aprobado = informe.estado === "APROBADO";
  // Las observaciones por recomendación acompañan una devolución o una reapertura.
  const conCampos = enRevision || aprobado;
  const listaObservaciones = Object.entries(observaciones)
    .filter(([, comentario]) => comentario.trim())
    .map(([recomendacionId, comentario]) => ({ recomendacionId, comentario: comentario.trim() }));
  const rezagos = avances.filter(conRezago).length;
  const alCien = avances.filter((a) => a.porcentaje === 100);

  const confirmar = async (motivo?: string) => {
    if (!modal) return;
    const accion = modal;
    setModal(null);
    setExito(null);
    const listo = await ejecutar(() => {
      if (accion === "validar") return validarInforme(informe.id);
      const datos = { motivo: motivo ?? "", observaciones: listaObservaciones };
      return accion === "devolver" ? devolverInforme(informe.id, datos) : reabrirInforme(informe.id, datos);
    });
    if (listo) {
      setObservaciones({});
      setExito(EXITO[accion]);
    }
  };

  const textoModal: Record<Accion, { titulo: string; mensaje: string; boton: string }> = {
    validar: {
      titulo: "¿Validar este informe de seguimiento?",
      mensaje: `El informe ${informe.periodo} de ${informe.licenciatura} quedará aprobado y bloqueado para la coordinación. Se le avisará por correo y en la aplicación.`,
      boton: "Sí, validar informe",
    },
    devolver: {
      titulo: "¿Devolver este informe con observaciones?",
      mensaje: `El informe regresará a la coordinación con ${listaObservaciones.length} observación(es) por recomendación. Indica el motivo general.`,
      boton: "Sí, devolver informe",
    },
    reabrir: {
      titulo: "¿Reabrir este informe aprobado?",
      mensaje: `El informe dejará de estar aprobado y volverá a la coordinación para corregirlo${listaObservaciones.length ? `, con ${listaObservaciones.length} observación(es)` : ""}.`,
      boton: "Sí, reabrir informe",
    },
  };

  return (
    <>
      <PageTitle
        crumbs={[{ label: "Inicio", href: "/admin/dashboard" }, { label: "Informes de seguimiento", href: "/admin/informes" }, { label: `${informe.licenciatura} · ${informe.periodo}` }]}
        title={`Informe de seguimiento ${informe.periodo} · Lic. en ${informe.licenciatura}`}
        subtitle={`Organismo: ${informe.organismo} · Ciclo ${informe.ciclo} · Corte al ${fechaLegible(informe.fechaCorte)}`}
        actions={enRevision ? (
          <>
            <Button variant="peligro" icon="mensaje" disabled={ocupado} onClick={() => setModal("devolver")}>Devolver con observaciones</Button>
            <Button icon="check" disabled={ocupado} onClick={() => setModal("validar")}>Validar informe</Button>
          </>
        ) : aprobado ? (
          <Button variant="contorno" icon="restablecer" disabled={ocupado} onClick={() => setModal("reabrir")}>Reabrir informe</Button>
        ) : undefined}
      />
      {exito && <Alert tipo="exito">{exito}</Alert>}
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
          <TablaAvances
            avances={avances}
            pie={(a) => (
              <>
                {conCampos && (
                  <TextAreaField
                    label={aprobado ? "Observación si reabres el informe (opcional)" : "Observación para esta recomendación (opcional)"}
                    placeholder="Escribe una observación…"
                    value={observaciones[a.recomendacionId] ?? ""}
                    onChange={(e) => setObservaciones((previas) => ({ ...previas, [a.recomendacionId]: e.target.value }))}
                    rows={2}
                  />
                )}
                {/* HU-03: cambios de la recomendación en el plan y en cada informe, con usuario y rol. */}
                <HistorialCambios recomendacionId={a.recomendacionId} numero={a.numero} />
              </>
            )}
          />
        </div>
        <aside className="stack side-340">
          <Card title="Datos del informe">
            <Fila titulo="Estado"><Badge estado={ESTADO_INFORME_BADGE[informe.estado]} /></Fila>
            <Fila titulo="Semestre">{informe.periodo}</Fila>
            <Fila titulo="Periodo">{fechaLegible(informe.fechaInicio)} – {fechaLegible(informe.fechaFin)}</Fila>
            <Fila titulo="Enviado">{fechaHoraLegible(informe.enviadoEn)}</Fila>
            <Fila titulo="Recomendaciones con avance">{informe.conAvance} / {informe.recomendaciones}</Fila>
            <Fila titulo="Evidencias">{informe.evidencias}</Fila>
            {conCampos && <Fila titulo="Observaciones escritas">{listaObservaciones.length}</Fila>}
          </Card>
          <Card title="Para revisar" style={{ gap: 8 }}>
            <span>{rezagos === 0 ? "Ninguna recomendación por debajo de lo esperado." : `${rezagos} recomendación(es) por debajo del % esperado al corte.`}</span>
            <span>{alCien.length} al 100 %{alCien.length === 0 ? "." : alCien.some((a) => a.evidencias.length === 0) ? ", alguna sin evidencia." : ", todas con evidencia."}</span>
          </Card>
          {enRevision && <Alert tipo="advertencia">Si devuelves el informe, la coordinación recibirá tus observaciones por correo y en la aplicación.</Alert>}
        </aside>
      </div>
      <ConfirmModal
        open={modal !== null}
        tipo={modal === "validar" ? "validar" : "devolver"}
        titulo={modal ? textoModal[modal].titulo : ""}
        mensaje={modal ? textoModal[modal].mensaje : ""}
        confirmLabel={modal ? textoModal[modal].boton : ""}
        etiquetaMotivo={modal === "reabrir" ? "Motivo de la reapertura" : "Motivo de la devolución"}
        onCancel={() => setModal(null)}
        onConfirm={(motivo) => void confirmar(motivo)}
      />
    </>
  );
};
