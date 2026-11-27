"use client";

// HU-16 · Consulta por ciclo de acreditación. La vigencia es obligatoria: primero se elige el ciclo (o se busca por una
// fecha de la constancia) y sobre él se muestran el Plan de Mejora, los Informes de Seguimiento con sus descargas (las
// evidencias van como hipervínculos) y el resumen de atención. El Administrador además abre los reportes de
// incumplimiento y transversales de ese ciclo. Un ciclo histórico es solo de consulta.
import Link from "next/link";
import { useEffect, useState } from "react";
import { DescargasInforme } from "@/components/informes/DescargasInforme";
import { DescargasPlan } from "@/components/planes/DescargasPlan";
import { SelectorLicenciaturas, useLicenciaturasEnUrl } from "@/components/filtros/SelectorLicenciaturas";
import { Alert, Badge, Card, DataTable, EmptyState, KpiCard, Tag } from "@/components/ui/Display";
import { SelectField, TextField } from "@/components/ui/Field";
import { listarCiclosHistoricos, obtenerCicloHistorico } from "@/lib/api";
import { ESTADO_INFORME_BADGE, ESTADO_PLAN_BADGE, type CicloHistorico, type DetalleHistorico, type InformeResumen } from "@/lib/types";

const ELIGE = "Elige la vigencia de la acreditación";
const PARAMETRO = "cicloId";

type Aviso = { tipo: "exito" | "error"; texto: string };

const mensaje = (error: unknown, porDefecto: string) => (error instanceof Error ? error.message : porDefecto);
const opcion = (c: CicloHistorico, varias: boolean) =>
  `${varias ? `${c.licenciatura.nombre} · ` : ""}${c.etiqueta}${c.activo ? " (vigente)" : " (histórico)"}`;

const leerCicloDeUrl = () => (typeof window === "undefined" ? null : new URL(window.location.href).searchParams.get(PARAMETRO));
const guardarCicloEnUrl = (id: string | null) => {
  const url = new URL(window.location.href);
  if (id) url.searchParams.set(PARAMETRO, id);
  else url.searchParams.delete(PARAMETRO);
  window.history.replaceState(null, "", url.toString());
};

export const ConsultaHistorica = ({ esAdmin }: { esAdmin: boolean }) => {
  const licenciaturas = useLicenciaturasEnUrl();
  const [fecha, setFecha] = useState("");
  const [ciclos, setCiclos] = useState<CicloHistorico[] | null>(null);
  const [cicloId, setCicloId] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<DetalleHistorico | null>(null);
  const [error, setError] = useState<string>();
  const [aviso, setAviso] = useState<Aviso | null>(null);

  useEffect(() => setCicloId(leerCicloDeUrl()), []);

  useEffect(() => {
    if (!licenciaturas.listo) return;
    let vigente = true;
    setError(undefined);
    listarCiclosHistoricos({ licenciaturaIds: esAdmin ? licenciaturas.parametro : undefined, fecha: /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : undefined })
      .then((lista) => { if (vigente) setCiclos(lista); })
      .catch((e: unknown) => { if (vigente) { setError(mensaje(e, "No pudimos cargar los ciclos.")); setCiclos([]); } });
    return () => { vigente = false; };
  }, [licenciaturas.listo, licenciaturas.parametro, fecha, esAdmin]);

  useEffect(() => {
    if (!cicloId) {
      setDetalle(null);
      return;
    }
    let vigente = true;
    setDetalle(null);
    setError(undefined);
    obtenerCicloHistorico(cicloId)
      .then((d) => { if (vigente) setDetalle(d); })
      .catch((e: unknown) => { if (vigente) setError(mensaje(e, "No pudimos cargar el ciclo.")); });
    return () => { vigente = false; };
  }, [cicloId]);

  const varias = new Set((ciclos ?? []).map((c) => c.licenciatura.id)).size > 1;
  const etiquetas = new Map<string, string>((ciclos ?? []).map((c): [string, string] => [opcion(c, varias), c.id]));
  const seleccionado = (ciclos ?? []).find((c) => c.id === cicloId);
  const valor = seleccionado ? opcion(seleccionado, varias) : ELIGE;

  const elegir = (texto: string) => {
    const id = etiquetas.get(texto) ?? null;
    setCicloId(id);
    guardarCicloEnUrl(id);
  };

  const ciclo = detalle?.ciclo;
  const total = detalle?.atencion ? detalle.atencion.atendidas + detalle.atencion.enProceso + detalle.atencion.sinAtender : 0;
  const porcentaje = (n: number) => (total ? `${Math.round((n / total) * 100)}% de ${total} recomendaciones` : "0 recomendaciones");

  return (
    <div className="stack" style={{ gap: 24 }}>
      <Card title="Ciclo de acreditación" subtitle="La consulta histórica es por ciclo: elige su vigencia o búscala por una fecha de la constancia.">
        <div className="row row--wrap" style={{ gap: 16, alignItems: "flex-end" }}>
          {esAdmin && <SelectorLicenciaturas seleccion={licenciaturas.ids} alCambiar={licenciaturas.cambiar} />}
          <div style={{ minWidth: 200 }}>
            <TextField label="Buscar por fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div className="grow" style={{ minWidth: 320 }}>
            <SelectField
              label="Vigencia de la acreditación (obligatorio)"
              options={[ELIGE, ...(ciclos ?? []).map((c) => opcion(c, varias))]}
              value={valor}
              onChange={(e) => elegir(e.target.value)}
              required
            />
          </div>
        </div>
        {ciclos?.length === 0 && <p className="t-small t-muted" style={{ margin: 0 }}>No hay ciclos con esa fecha o licenciatura.</p>}
      </Card>

      {error && <Alert tipo="error">{error}</Alert>}
      {aviso && <Alert tipo={aviso.tipo}>{aviso.texto}</Alert>}

      {!cicloId && !error && (
        <EmptyState icon="archivo" titulo="Elige un ciclo" mensaje="Selecciona la vigencia de la acreditación para ver su Plan de Mejora, sus Informes de Seguimiento y sus resultados." />
      )}
      {cicloId && !detalle && !error && <p className="t-muted" aria-busy="true">Cargando el ciclo…</p>}

      {ciclo && detalle && (
        <>
          <Card
            title={`${ciclo.licenciatura.nombre} · ciclo ${ciclo.nombre}`}
            subtitle={ciclo.etiqueta}
            actions={ciclo.activo ? <Tag>Vigente</Tag> : <Tag neutral>Histórico · solo consulta</Tag>}
          >
            <div className="row row--wrap" style={{ gap: 24 }}>
              <div className="stack" style={{ gap: 2 }}><span className="t-small t-muted">Organismo acreditador</span><span>{ciclo.organismo}</span></div>
              <div className="stack" style={{ gap: 2 }}><span className="t-small t-muted">Fecha de emisión</span><span>{ciclo.fechaEmision.split("-").reverse().join("/")}</span></div>
              <div className="stack" style={{ gap: 2 }}><span className="t-small t-muted">Carpeta de evidencias</span><span>{ciclo.carpeta ?? "Sin carpeta registrada"}</span></div>
            </div>
            {!ciclo.activo && (
              <p className="t-small t-muted" style={{ margin: 0 }}>
                Este ciclo ya concluyó: sus datos se conservan y no se pueden modificar. Las evidencias se abren desde los reportes descargados.
              </p>
            )}
          </Card>

          {detalle.atencion && (
            <div className="grid-3">
              <KpiCard tono="verde" titulo="Atendidas (100%)" valor={String(detalle.atencion.atendidas)} detalle={porcentaje(detalle.atencion.atendidas)} icon="check" />
              <KpiCard tono="naranja" titulo="En proceso (1–99%)" valor={String(detalle.atencion.enProceso)} detalle={porcentaje(detalle.atencion.enProceso)} icon="reloj" />
              <KpiCard tono="rojo" titulo="No atendidas (0%)" valor={String(detalle.atencion.sinAtender)} detalle={porcentaje(detalle.atencion.sinAtender)} icon="alerta" />
            </div>
          )}

          <Card
            title="Plan de Mejora Continua"
            actions={detalle.plan ? <DescargasPlan plan={detalle.plan} onAviso={setAviso} /> : undefined}
          >
            {detalle.plan ? (
              <div className="row row--wrap" style={{ gap: 24, alignItems: "center" }}>
                <Badge estado={ESTADO_PLAN_BADGE[detalle.plan.estado]} />
                <span>{detalle.plan.recomendaciones} recomendaciones</span>
                <span className="t-muted">Avance promedio: {detalle.plan.avance} %</span>
                {esAdmin && <Link href={`/admin/planes/${detalle.plan.id}`}>Ver el plan completo</Link>}
              </div>
            ) : (
              <p className="t-muted" style={{ margin: 0 }}>Este ciclo no tiene Plan de Mejora registrado.</p>
            )}
          </Card>

          <Card title="Informes de Seguimiento" subtitle="Cada reporte trae las evidencias como hipervínculos.">
            {detalle.informes.length === 0 ? (
              <p className="t-muted" style={{ margin: 0 }}>Este ciclo no tiene informes de seguimiento.</p>
            ) : (
              <DataTable<InformeResumen>
                caption={`Informes de seguimiento del ciclo ${ciclo.nombre}`}
                rowKey={(i) => i.id}
                rows={detalle.informes}
                columns={[
                  { header: "Semestre", render: (i) => <span className="t-medium">{i.periodo}</span> },
                  { header: "Estado", render: (i) => <Badge estado={ESTADO_INFORME_BADGE[i.estado]} /> },
                  { header: "Con avance", render: (i) => `${i.conAvance} de ${i.recomendaciones}` },
                  { header: "Evidencias", render: (i) => String(i.evidencias) },
                  {
                    header: "Reporte",
                    render: (i) => (
                      <div className="row" style={{ gap: 8 }}>
                        <DescargasInforme informe={i} onAviso={setAviso} />
                        {esAdmin && <Link href={`/admin/informes/${i.id}`}>Ver</Link>}
                      </div>
                    ),
                  },
                ]}
              />
            )}
          </Card>

          {esAdmin && (
            <Card title="Otras consultas de este ciclo">
              <div className="row row--wrap" style={{ gap: 16 }}>
                <Link href={`/admin/reportes/atencion?cicloId=${ciclo.id}`}>Resumen de atención</Link>
                <Link href={`/admin/reportes/incumplimiento?cicloId=${ciclo.id}`}>Reporte de incumplimiento</Link>
                <Link href={`/admin/transversales?cicloId=${ciclo.id}`}>Recomendaciones transversales</Link>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

/** Aviso para los reportes abiertos sobre un ciclo concreto (?cicloId=). */
export const useCicloConsultado = () => {
  const [cicloId, setCicloId] = useState<string | null>(null);
  const [etiqueta, setEtiqueta] = useState<string | null>(null);
  // Hasta leer la URL no se consulta nada, para no pedir primero el ciclo vigente.
  const [listo, setListo] = useState(false);
  useEffect(() => {
    const id = leerCicloDeUrl();
    setCicloId(id);
    setListo(true);
    if (!id) return;
    obtenerCicloHistorico(id)
      .then((d) => setEtiqueta(`${d.ciclo.licenciatura.nombre} · ciclo ${d.ciclo.nombre} (${d.ciclo.etiqueta})${d.ciclo.activo ? "" : " · histórico"}`))
      .catch(() => setEtiqueta(null));
  }, []);
  const quitar = () => {
    guardarCicloEnUrl(null);
    setCicloId(null);
    setEtiqueta(null);
  };
  return { cicloId: cicloId ?? undefined, etiqueta, quitar, listo };
};

export const AvisoCicloConsultado = ({ etiqueta, alQuitar }: { etiqueta: string | null; alQuitar: () => void }) =>
  etiqueta ? (
    <Alert tipo="info">
      Consultando {etiqueta}.{" "}
      <button type="button" onClick={alQuitar} style={{ background: "none", border: 0, padding: 0, color: "inherit", font: "inherit", fontWeight: 600, textDecoration: "underline", cursor: "pointer" }}>Volver al ciclo vigente</button>
    </Alert>
  ) : null;
