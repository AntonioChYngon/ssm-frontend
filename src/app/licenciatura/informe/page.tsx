"use client";

// HU-07 · Informe de seguimiento de la coordinación (Captura y Auxiliar): iniciar el semestre, capturar % y observaciones,
// agregar evidencias (archivo o enlace), enviar a revisión. HU-08: observaciones de la devolución y bloqueo tras aprobar.
// El backend decide si se puede editar (editable / bloqueo); la pantalla solo lo refleja.
import { useCallback, useEffect, useRef, useState } from "react";
import { CargaEvidencias } from "@/components/informes/CargaEvidencias";
import { EditorAvance } from "@/components/informes/EditorAvance";
import { TablaAvances } from "@/components/informes/TablaAvances";
import { MENSAJE_CAMBIO_ESTADO, useMiInforme } from "@/components/informes/useInforme";
import { HistorialRevisiones } from "@/components/planes/RevisionHistory";
import { Button, IconButton, LinkButton } from "@/components/ui/Button";
import { Alert, Badge, Card, DataTable, EmptyState, PageTitle } from "@/components/ui/Display";
import { ConfirmModal } from "@/components/ui/Interactive";
import { ApiError, enviarInforme, guardarAvance, iniciarInforme, obtenerInforme, quitarEvidenciaInforme } from "@/lib/api";
import { fechaHoraLegible, fechaLegible } from "@/lib/reglas-informe";
import { ESTADO_INFORME_BADGE, type InformeDetalle, type InformeResumen } from "@/lib/types";

const MENSAJE_BLOQUEO = {
  EN_REVISION: "Tu informe está en revisión. La Administración te avisará si lo valida o te lo devuelve con observaciones.",
  APROBADO: "Tu informe fue validado. Ya no se puede modificar; si hace falta un cambio, la Administración debe reabrirlo.",
} as const;

/** Lo que falta para enviar, igual que la regla del backend (solo para orientar; el servidor vuelve a revisar). */
const faltantes = (informe: InformeDetalle) =>
  informe.avances
    .map((a) =>
      a.porcentaje === null ? `Recomendación ${a.numero}: falta el % de avance` : a.evidenciaObligatoria && a.evidencias.length === 0 ? `Recomendación ${a.numero}: falta evidencia (está al 100 %)` : null,
    )
    .filter((x): x is string => x !== null);

/** Informe de un semestre anterior, en modo lectura (se carga al abrirlo). */
const InformeAnterior = ({ resumen, alCerrar }: { resumen: InformeResumen; alCerrar: () => void }) => {
  const [informe, setInforme] = useState<InformeDetalle | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    obtenerInforme(resumen.id).then(setInforme).catch((e) => setError(e instanceof ApiError ? e.message : "No pudimos abrir el informe."));
  }, [resumen.id]);
  return (
    <Card title={`Informe ${resumen.periodo}`} subtitle={`${ESTADO_INFORME_BADGE[resumen.estado]} · corte al ${fechaLegible(resumen.fechaCorte)}`} actions={<IconButton icon="cerrar" label="Cerrar informe anterior" onClick={alCerrar} />}>
      {error && <Alert tipo="error">{error}</Alert>}
      {!informe && !error && <p className="t-muted">Cargando…</p>}
      {informe && <TablaAvances avances={informe.avances} mostrarObservacionRevision={informe.estado === "DEVUELTO"} />}
    </Card>
  );
};

const InformeLicenciaturaPage = () => {
  const { mio, cargando, error, aviso, ocupado, ejecutar, aplicar, recargar, cerrarAviso } = useMiInforme();
  const [confirmarEnvio, setConfirmarEnvio] = useState(false);
  const [exito, setExito] = useState<string | null>(null);
  const [conflicto, setConflicto] = useState<string | null>(null);
  const [anterior, setAnterior] = useState<InformeResumen | null>(null);
  // Filas con cambios sin guardar: se guardan en una referencia para no volver a pintar en cada tecla.
  const sucias = useRef(new Set<string>());
  const [pendientes, setPendientes] = useState(0);

  const marcar = useCallback((recomendacionId: string, sucio: boolean) => {
    if (sucio) sucias.current.add(recomendacionId);
    else sucias.current.delete(recomendacionId);
    setPendientes(sucias.current.size);
  }, []);

  // Aviso del navegador al salir con filas sin guardar.
  useEffect(() => {
    if (pendientes === 0) return;
    const avisar = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [pendientes]);

  const alConflicto = useCallback((mensaje: string) => {
    setConflicto(`${mensaje} ${MENSAJE_CAMBIO_ESTADO}`);
    void recargar();
  }, [recargar]);

  if (error && !mio) {
    return <EmptyState titulo="No pudimos abrir tu informe" mensaje={error} icon="alerta" action={<LinkButton href="/licenciatura/dashboard" variant="contorno">Ir al inicio</LinkButton>} />;
  }
  if (cargando || !mio) return <p className="t-muted">Cargando informe…</p>;

  const { ciclo, periodo, planAprobado, informe, anteriores } = mio;
  const editable = Boolean(informe?.editable);
  const pendientesEnvio = informe ? faltantes(informe) : [];
  const devuelto = informe?.estado === "DEVUELTO" ? informe.ultimaRevision : null;

  const iniciar = async () => {
    setExito(null);
    if (await ejecutar(() => iniciarInforme(ciclo.id))) setExito(`Informe ${periodo?.nombre ?? ""} iniciado. Captura el avance de cada recomendación.`);
  };

  const enviar = async () => {
    if (!informe) return;
    setConfirmarEnvio(false);
    setExito(null);
    if (await ejecutar(() => enviarInforme(informe.id))) setExito("Informe enviado a revisión. Se avisó a la Unidad de Planeación.");
  };

  return (
    <>
      <PageTitle
        crumbs={[{ label: "Inicio", href: "/licenciatura/dashboard" }, { label: "Informe de seguimiento" }]}
        title={informe ? `Informe de seguimiento ${informe.periodo}` : "Informe de seguimiento"}
        subtitle={`Lic. en ${ciclo.licenciatura} · ${ciclo.organismo} · Ciclo ${ciclo.nombre}${periodo ? ` · Semestre ${periodo.nombre} (corte al ${fechaLegible(periodo.fechaCorte)})` : ""}`}
        actions={informe && editable ? (
          <Button icon="enviar" disabled={ocupado || pendientes > 0} onClick={() => setConfirmarEnvio(true)}>Enviar a revisión</Button>
        ) : undefined}
      />
      {exito && <Alert tipo="exito">{exito}</Alert>}
      {conflicto && <Alert tipo="advertencia">{conflicto}</Alert>}
      {aviso && <Alert tipo="error"><span>{aviso}</span> <button type="button" className="link-boton" onClick={cerrarAviso}>Cerrar</button></Alert>}
      {!ciclo.activo && <Alert tipo="advertencia">{ciclo.mensaje}</Alert>}

      {!informe && (
        !planAprobado ? (
          <EmptyState titulo="Tu plan de mejora aún no está aprobado" mensaje="El informe de seguimiento se inicia cuando la Unidad de Planeación valide tu plan." icon="documento" action={<LinkButton href="/licenciatura/plan" variant="contorno">Ir al plan de mejora</LinkButton>} />
        ) : !periodo ? (
          <EmptyState titulo="No hay semestre que reportar" mensaje="Hoy está fuera de la vigencia del ciclo de acreditación." icon="calendario" />
        ) : ciclo.activo ? (
          <Card title={`Semestre ${periodo.nombre}`} subtitle={`Del ${fechaLegible(periodo.fechaInicio)} al ${fechaLegible(periodo.fechaFin)}`}>
            <p style={{ margin: 0 }}>Aún no inicias el informe de este semestre. Al iniciarlo podrás capturar el avance de cada recomendación de tu plan aprobado y agregar sus evidencias.</p>
            <div><Button icon="mas" disabled={ocupado} onClick={() => void iniciar()}>Iniciar informe del semestre</Button></div>
          </Card>
        ) : null
      )}

      {informe && (
        <>
          {informe.bloqueo === "EN_REVISION" && <Alert tipo="info">{MENSAJE_BLOQUEO.EN_REVISION}</Alert>}
          {informe.bloqueo === "APROBADO" && <Alert tipo="exito">{MENSAJE_BLOQUEO.APROBADO}</Alert>}
          {devuelto && (
            <Alert tipo="advertencia">
              La Administración te devolvió el informe ({devuelto.fecha}).{devuelto.comentario ? ` Motivo: ${devuelto.comentario}.` : ""} Atiende las observaciones marcadas en cada recomendación y vuelve a enviarlo.
            </Alert>
          )}
          {informe.revisiones.length > 0 && (
            <HistorialRevisiones revisiones={informe.revisiones} recomendaciones={informe.avances.map((a) => ({ id: a.recomendacionId, numero: a.numero }))} />
          )}
          <div className="row row--top row--responsive" style={{ gap: 24 }}>
            <div className="stack grow">
              <TablaAvances
                avances={informe.avances}
                editor={editable ? (a) => (
                  <EditorAvance
                    avance={a}
                    ocupado={ocupado}
                    alCambiar={(sucio) => marcar(a.recomendacionId, sucio)}
                    guardar={(porcentaje, observaciones) => ejecutar(() => guardarAvance(informe.id, a.recomendacionId, { porcentaje, observaciones }))}
                  />
                ) : undefined}
                accionesEvidencia={editable ? (_a, e) => (
                  <IconButton icon="eliminar" label={`Quitar ${e.nombre}`} danger disabled={ocupado} onClick={() => void ejecutar(() => quitarEvidenciaInforme(e.id))} />
                ) : undefined}
                pieEvidencias={editable ? (a) => (
                  <CargaEvidencias informeId={informe.id} avance={a} aplicar={aplicar} alConflicto={alConflicto} />
                ) : undefined}
              />
            </div>
            <aside className="stack side-340">
              <Card title="Tu informe">
                <div className="row"><span className="t-muted grow">Estado</span><Badge estado={ESTADO_INFORME_BADGE[informe.estado]} /></div>
                <div className="row"><span className="t-muted grow">Con avance</span><span className="t-medium">{informe.conAvance} / {informe.recomendaciones}</span></div>
                <div className="row"><span className="t-muted grow">Evidencias</span><span className="t-medium">{informe.evidencias}</span></div>
                <div className="row"><span className="t-muted grow">Enviado</span><span className="t-medium">{fechaHoraLegible(informe.enviadoEn)}</span></div>
              </Card>
              {editable && (
                <Card title="Antes de enviar" style={{ gap: 8 }}>
                  {pendientes > 0 && <span className="t-warning">Tienes {pendientes} recomendación(es) con cambios sin guardar.</span>}
                  {pendientesEnvio.length === 0
                    ? <span className="t-success">Todo listo para enviar.</span>
                    : pendientesEnvio.map((f) => <span key={f} className="t-small">{f}</span>)}
                  <span className="t-small t-muted">La evidencia es obligatoria solo en las recomendaciones al 100 %.</span>
                </Card>
              )}
            </aside>
          </div>
        </>
      )}

      {anteriores.length > 0 && (
        <Card title="Semestres anteriores">
          <DataTable<InformeResumen>
            caption="Informes de semestres anteriores"
            rows={anteriores}
            rowKey={(i) => i.id}
            columns={[
              { header: "Semestre", width: 110, render: (i) => i.periodo },
              { header: "Corte", width: 120, render: (i) => fechaLegible(i.fechaCorte) },
              { header: "Estado", width: 140, render: (i) => <Badge estado={ESTADO_INFORME_BADGE[i.estado]} /> },
              { header: "Evidencias", width: 110, render: (i) => i.evidencias },
              { header: "", width: 120, render: (i) => <Button variant="contorno" icon="ver" onClick={() => setAnterior(i)}>Ver</Button> },
            ]}
          />
        </Card>
      )}
      {anterior && <InformeAnterior key={anterior.id} resumen={anterior} alCerrar={() => setAnterior(null)} />}

      <ConfirmModal
        open={confirmarEnvio}
        tipo="validar"
        titulo="¿Enviar el informe a revisión?"
        mensaje={pendientesEnvio.length ? `Aún falta: ${pendientesEnvio.join("; ")}. El sistema no lo aceptará hasta completarlo.` : "Ya no podrás editarlo mientras la Unidad de Planeación lo revisa. Se le avisará por correo."}
        confirmLabel="Sí, enviar informe"
        onCancel={() => setConfirmarEnvio(false)}
        onConfirm={() => void enviar()}
      />
    </>
  );
};

export default InformeLicenciaturaPage;
