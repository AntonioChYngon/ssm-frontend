"use client";

import { useEffect, useState } from "react";
import { Button, IconButton, LinkButton } from "@/components/ui/Button";
import { Alert, Badge, Card, DataTable, EmptyState, PageTitle } from "@/components/ui/Display";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { ConfirmModal } from "@/components/ui/Interactive";
import { HistorialRevisiones } from "@/components/planes/RevisionHistory";
import { descargarReportePlan, eliminarRecomendacion, enviarPlan, guardarRecomendacion, obtenerCatalogos, obtenerMiPlan, usaMocks } from "@/lib/api";
import { ESTADO_PLAN_BADGE, type ItemCatalogo, type MetaPayload, type MiPlan, type PlanDetalle, type RecomendacionPayload, type RecomendacionPlan } from "@/lib/types";

const SIN_CATEGORIA = "Selecciona una categoría";
const SIN_AREA = "Selecciona un área responsable";

/** Fila de meta del formulario: fecha y % opcionales en el borrador (HU-04/HU-12). */
type FilaMeta = { descripcion: string; fecha: string; porcentaje: string };

type Formulario = {
  categoriaId: string;
  indicador: string;
  descripcion: string;
  acciones: string;
  metas: FilaMeta[];
  areaResponsable: string;
  fechaCumplimiento: string;
};

type Campo = keyof Formulario;
type Errores = Partial<Record<Campo, string>>;

const META_VACIA: FilaMeta = { descripcion: "", fecha: "", porcentaje: "" };
const VACIO: Formulario = { categoriaId: "", indicador: "", descripcion: "", acciones: "", metas: [META_VACIA], areaResponsable: "", fechaCumplimiento: "" };

/** HU-04 · metas medibles: cada meta expresa al menos una cifra o porcentaje (misma regla que el backend). */
const esMedible = (texto: string) => /\d/.test(texto);

const fechaLegible = (iso: string | null) => (iso ? iso.split("-").reverse().join("/") : "—");

const desdeRecomendacion = (r: RecomendacionPlan): Formulario => ({
  categoriaId: r.categoriaId,
  indicador: r.indicador,
  descripcion: r.descripcion,
  acciones: r.acciones.join("\n"),
  metas: r.metas.length
    ? r.metas.map((m) => ({ descripcion: m.descripcion, fecha: m.fechaCompromiso ?? "", porcentaje: m.porcentajeEsperado === null ? "" : String(m.porcentajeEsperado) }))
    : [META_VACIA],
  areaResponsable: r.areaResponsable ?? "",
  fechaCumplimiento: r.fechaCumplimiento ?? "",
});

const metasLimpias = (metas: FilaMeta[]) => metas.filter((m) => m.descripcion.trim());

const tieneContenido = (f: Formulario) =>
  Boolean(f.categoriaId || f.indicador.trim() || f.descripcion.trim() || f.acciones.trim() || metasLimpias(f.metas).length || f.areaResponsable.trim() || f.fechaCumplimiento);

const estaCompleta = (r: RecomendacionPlan) =>
  r.acciones.length > 0 &&
  r.metas.length > 0 &&
  r.metas.some((m) => m.fechaCompromiso && m.porcentajeEsperado !== null) &&
  r.metas.every((m) => esMedible(m.descripcion)) &&
  Boolean(r.areaResponsable?.trim()) &&
  Boolean(r.fechaCumplimiento);

/** Revisa fecha y % de cada meta como el backend: van juntos, % de 1 a 99, antes de la fecha de cumplimiento y en orden. */
const erroresMetas = (metas: FilaMeta[], limite: string, completo: boolean): string | undefined => {
  let anterior: { n: number; fecha: string } | null = null;
  for (const [i, m] of metasLimpias(metas).entries()) {
    const n = i + 1;
    if (Boolean(m.fecha) !== Boolean(m.porcentaje.trim())) return `Completa la fecha compromiso y el % esperado de la meta ${n}, o deja ambos vacíos.`;
    if (m.porcentaje.trim()) {
      const pct = Number(m.porcentaje);
      if (!Number.isInteger(pct) || pct < 1 || pct > 99) return `El % esperado de la meta ${n} debe ser un número entero entre 1 y 99.`;
      if (limite && m.fecha >= limite) return `La fecha de la meta ${n} debe ser anterior a ${completo ? "la fecha de cumplimiento" : `la fecha límite (${fechaLegible(limite)})`}.`;
      if (anterior && m.fecha <= anterior.fecha) return `La fecha de la meta ${n} debe ser posterior a la de la meta ${anterior.n}.`;
      anterior = { n, fecha: m.fecha };
    }
    if (completo && !esMedible(m.descripcion)) return `La meta ${n} debe ser medible: incluye una cifra o porcentaje (ej. "Capacitar al 80% de la planta docente").`;
  }
  if (completo && !metasLimpias(metas).some((m) => m.fecha && m.porcentaje.trim())) return "Configura la fecha compromiso y el % esperado de al menos una meta.";
  return undefined;
};

/** "Guardar borrador" exige Categoría, Indicador y Recomendación; "Enviar a validación" exige los 7 campos. */
const validar = (f: Formulario, completo: boolean, vigencia: { inicio: string; fin: string }, areas: ItemCatalogo[]): Errores => {
  const e: Errores = {};
  if (!f.categoriaId) e.categoriaId = "Elige una categoría.";
  if (f.indicador.trim().length < 3) e.indicador = "Escribe el indicador (al menos 3 caracteres).";
  if (f.descripcion.trim().length < 3) e.descripcion = "Escribe la recomendación (al menos 3 caracteres).";
  if (f.fechaCumplimiento && (f.fechaCumplimiento < vigencia.inicio || f.fechaCumplimiento > vigencia.fin)) {
    e.fechaCumplimiento = `La fecha debe estar dentro del ciclo de acreditación (${fechaLegible(vigencia.inicio)} a ${fechaLegible(vigencia.fin)}).`;
  }
  const errorMetas = erroresMetas(f.metas, f.fechaCumplimiento || vigencia.fin, completo);
  if (errorMetas) e.metas = errorMetas;
  if (completo) {
    if (!f.acciones.trim()) e.acciones = "Escribe las acciones para atender la recomendación.";
    if (!metasLimpias(f.metas).length) e.metas = "Agrega al menos una meta.";
    if (!areas.some((area) => area.nombre === f.areaResponsable)) e.areaResponsable = "Selecciona un área responsable del catálogo.";
    if (!f.fechaCumplimiento) e.fechaCumplimiento = "Elige la fecha de cumplimiento.";
  }
  return e;
};

const aPayload = (f: Formulario): RecomendacionPayload => ({
  categoriaId: f.categoriaId,
  indicador: f.indicador.trim(),
  descripcion: f.descripcion.trim(),
  acciones: f.acciones.trim() ? [f.acciones.trim()] : [],
  metas: metasLimpias(f.metas).map((m): MetaPayload => ({
    descripcion: m.descripcion.trim(),
    fechaCompromiso: m.fecha || null,
    porcentajeEsperado: m.porcentaje.trim() ? Number(m.porcentaje) : null,
  })),
  areaResponsable: f.areaResponsable.trim() || undefined,
  fechaCumplimiento: f.fechaCumplimiento || undefined,
});

const mensajeDe = (error: unknown) => (error instanceof Error ? error.message : "No pudimos completar la operación. Intenta de nuevo.");

const escaparHtml = (valor: string) => valor.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const imprimirReporteDemo = (plan: PlanDetalle) => {
  const popup = window.open("", "_blank", "width=1200,height=800");
  if (!popup) throw new Error("Permite las ventanas emergentes para generar el reporte de demostración.");
  const encabezados = ["N.º", "Categoría", "Indicador", "Recomendación", "Acciones", "Metas", "Área responsable", "Fecha límite"];
  const celdas = plan.recomendacionesDetalle.map((r) => [
    String(r.numero), r.categoria, r.indicador, r.descripcion,
    r.acciones.join("\n") || "—",
    r.metas.map((m) => `${m.descripcion}${m.fechaCompromiso ? ` · ${m.fechaCompromiso}` : ""}${m.porcentajeEsperado === null ? "" : ` · ${m.porcentajeEsperado}%`}`).join("\n") || "—",
    r.areaResponsable ?? "—", r.fechaCumplimiento ?? "—",
  ]);
  popup.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Plan de Mejora Continua</title><style>
    @page{size:landscape;margin:12mm}body{font:12px Arial,sans-serif;color:#243444}h1{color:#073766;margin:0 0 6px}p{margin:4px 0 16px}table{width:100%;border-collapse:collapse;table-layout:fixed}th,td{border:1px solid #bfcbd5;padding:6px;vertical-align:top;white-space:pre-wrap;overflow-wrap:anywhere}th{background:#073766;color:#fff}tr{break-inside:avoid}thead{display:table-header-group}
    </style></head><body><h1>Plan de Mejora Continua</h1><p>${escaparHtml(`${plan.licenciatura} · Ciclo ${plan.ciclo} · ${plan.organismo} · ${plan.estado}`)}</p><table><thead><tr>${encabezados.map((h) => `<th>${escaparHtml(h)}</th>`).join("")}</tr></thead><tbody>${celdas.map((fila) => `<tr>${fila.map((v) => `<td>${escaparHtml(v)}</td>`).join("")}</tr>`).join("")}</tbody></table><script>window.onload=()=>window.print()</script></body></html>`);
  popup.document.close();
};

const CapturaPlanPage = () => {
  const [miPlan, setMiPlan] = useState<MiPlan | null>(null);
  const [categorias, setCategorias] = useState<ItemCatalogo[]>([]);
  const [areas, setAreas] = useState<ItemCatalogo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState<Formulario>(VACIO);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [errores, setErrores] = useState<Errores>({});
  const [aviso, setAviso] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [confirmarEnvio, setConfirmarEnvio] = useState(false);

  useEffect(() => {
    Promise.all([obtenerMiPlan(), obtenerCatalogos()])
      .then(([plan, catalogos]) => {
        setMiPlan(plan);
        setCategorias(catalogos.categorias);
        setAreas(catalogos.areas);
      })
      .catch((error) => setAviso({ tipo: "error", texto: mensajeDe(error) }))
      .finally(() => setCargando(false));
  }, []);

  const plan: PlanDetalle | null = miPlan?.plan ?? null;
  const ciclo = miPlan?.ciclo;
  // HU-18: al terminar la vigencia del ciclo, la captura queda bloqueada aunque el plan sea editable.
  const cicloAbierto = ciclo?.activo !== false;
  const editable = cicloAbierto && (plan ? plan.editable : true);
  const vigencia = { inicio: ciclo?.vigenciaInicio ?? "", fin: ciclo?.vigenciaFin ?? "" };
  const recomendaciones = plan?.recomendacionesDetalle ?? [];
  const hoy = new Date().toLocaleDateString("en-CA");
  const numeroEditando = recomendaciones.find((r) => r.id === editandoId)?.numero;

  const cambiar = <K extends Campo>(campo: K, valor: Formulario[K]) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    setErrores((prev) => ({ ...prev, [campo]: undefined }));
  };

  const limpiar = () => {
    setForm(VACIO);
    setEditandoId(null);
    setErrores({});
  };

  const actualizarPlan = (nuevo: PlanDetalle) => setMiPlan((prev) => (prev ? { ...prev, plan: nuevo } : prev));

  /** Guarda la recomendación del formulario. Devuelve el plan actualizado o null si hubo errores. */
  const guardarFormulario = async (completo: boolean): Promise<PlanDetalle | null> => {
    if (!ciclo) return null;
    const e = validar(form, completo, vigencia, areas);
    setErrores(e);
    if (Object.keys(e).length) {
      setAviso({ tipo: "error", texto: "Revisa los campos marcados antes de continuar." });
      return null;
    }
    const nuevo = await guardarRecomendacion(ciclo.id, aPayload(form), editandoId ?? undefined);
    actualizarPlan(nuevo);
    limpiar();
    return nuevo;
  };

  const guardarBorrador = async () => {
    setAviso(null);
    setOcupado(true);
    try {
      if (await guardarFormulario(false)) setAviso({ tipo: "exito", texto: "Borrador guardado. Puedes seguir editándolo antes de enviarlo a validación." });
    } catch (error) {
      setAviso({ tipo: "error", texto: mensajeDe(error) });
    } finally {
      setOcupado(false);
    }
  };

  const pedirEnvio = async () => {
    setAviso(null);
    if (!tieneContenido(form) && !miPlan?.plan?.recomendacionesDetalle.length) {
      setAviso({ tipo: "error", texto: "Agrega al menos una recomendación antes de enviar el plan." });
      return;
    }
    // Si hay una recomendación en el formulario, se guarda primero (completa).
    if (tieneContenido(form)) {
      setOcupado(true);
      try {
        if (!(await guardarFormulario(true))) return;
      } catch (error) {
        setAviso({ tipo: "error", texto: mensajeDe(error) });
        return;
      } finally {
        setOcupado(false);
      }
    }
    setConfirmarEnvio(true);
  };

  const enviar = async () => {
    setConfirmarEnvio(false);
    if (!miPlan?.plan) {
      setAviso({ tipo: "error", texto: "Agrega al menos una recomendación antes de enviar el plan." });
      return;
    }
    setOcupado(true);
    try {
      actualizarPlan(await enviarPlan(miPlan.plan.id));
      setAviso({ tipo: "exito", texto: "Plan enviado a validación. La Administración recibió un aviso para revisarlo." });
    } catch (error) {
      setAviso({ tipo: "error", texto: mensajeDe(error) });
    } finally {
      setOcupado(false);
    }
  };

  const editar = (r: RecomendacionPlan) => {
    setEditandoId(r.id);
    setForm(desdeRecomendacion(r));
    setErrores({});
    setAviso(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const eliminar = async (r: RecomendacionPlan) => {
    if (!window.confirm(`¿Eliminar la recomendación ${r.numero}? Esta acción no se puede deshacer.`)) return;
    setOcupado(true);
    try {
      actualizarPlan(await eliminarRecomendacion(r.id));
      if (editandoId === r.id) limpiar();
      setAviso({ tipo: "exito", texto: `Recomendación ${r.numero} eliminada.` });
    } catch (error) {
      setAviso({ tipo: "error", texto: mensajeDe(error) });
    } finally {
      setOcupado(false);
    }
  };

  const generarReporte = async () => {
    if (!plan) return;
    setOcupado(true);
    setAviso(null);
    try {
      if (usaMocks()) {
        imprimirReporteDemo(plan);
      } else {
        const archivo = await descargarReportePlan(plan.id);
        const url = URL.createObjectURL(archivo);
        const enlace = document.createElement("a");
        enlace.href = url;
        enlace.download = `Plan_${plan.licenciatura}_${plan.ciclo.replace(/[–\s]+/g, "-")}.pdf`;
        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();
        URL.revokeObjectURL(url);
      }
      setAviso({ tipo: "exito", texto: usaMocks() ? "Se abrió el reporte para imprimir o guardarlo como PDF." : "Reporte PDF descargado." });
    } catch (error) {
      setAviso({ tipo: "error", texto: mensajeDe(error) });
    } finally {
      setOcupado(false);
    }
  };

  const categoriaNombre = categorias.find((c) => c.id === form.categoriaId)?.nombre ?? SIN_CATEGORIA;

  return (
    <>
      <PageTitle
        crumbs={[{ label: "Inicio", href: "/licenciatura/dashboard" }, { label: "Plan de mejora" }]}
        title="Captura del plan de mejora"
        subtitle={ciclo ? `Licenciatura en ${ciclo.licenciatura} · Ciclo ${ciclo.nombre} · ${ciclo.organismo}` : undefined}
        actions={
          <>
            {plan && <Badge estado={ESTADO_PLAN_BADGE[plan.estado]} />}
            {plan && <Button variant="contorno" icon="descargar" onClick={() => void generarReporte()} disabled={ocupado || cargando}>Generar reporte PDF</Button>}
            <Button variant="contorno" icon="check" onClick={guardarBorrador} disabled={!editable || ocupado || cargando || !ciclo}>Guardar borrador</Button>
            <Button icon="enviar" onClick={pedirEnvio} disabled={!editable || ocupado || cargando || !ciclo}>Enviar a validación</Button>
          </>
        }
      />

      {usaMocks() && <Alert tipo="info">Modo demostración: los cambios del plan se guardan en memoria y no en MariaDB. Para validar persistencia, inicia el frontend con el backend conectado.</Alert>}
      {aviso && <Alert tipo={aviso.tipo}>{aviso.texto}</Alert>}
      {ciclo && !cicloAbierto && <Alert tipo="advertencia">{ciclo.mensaje ?? "El ciclo de acreditación ha finalizado. Contacte a la Unidad de Planeación para iniciar un nuevo ciclo."}</Alert>}
      {plan?.estado === "DEVUELTO" && plan.ultimaRevision && (
        <Alert tipo="advertencia">
          <strong>La Administración devolvió el plan el {plan.ultimaRevision.fecha}.</strong> {plan.ultimaRevision.comentario}
          {" "}Corrige las recomendaciones con observaciones y vuelve a enviarlo.
        </Alert>
      )}
      {plan?.estado === "EN_REVISION" && <Alert tipo="info">El plan está en validación. No se puede editar hasta que la Administración lo revise.</Alert>}
      {plan?.estado === "APROBADO" && <Alert tipo="exito">El plan fue validado y quedó bloqueado para edición.</Alert>}
      {plan && (plan.revisiones?.length || plan.ultimaRevision) ? (
        <HistorialRevisiones revisiones={plan.revisiones?.length ? plan.revisiones : [plan.ultimaRevision!]} recomendaciones={plan.recomendacionesDetalle} />
      ) : null}

      {editable && ciclo && (
        <Card
          title={editandoId ? `Editar recomendación ${numeroEditando ?? ""}` : "Nueva recomendación"}
          subtitle="Los campos con * son obligatorios para enviar a validación. Para guardar el borrador basta con Categoría, Indicador y Recomendación."
          actions={editandoId ? <Button variant="texto" icon="cerrar" onClick={limpiar}>Cancelar edición</Button> : undefined}
          style={{ gap: 20 }}
        >
          <SelectField
            label="Categoría *"
            options={[SIN_CATEGORIA, ...categorias.map((c) => c.nombre)]}
            value={categoriaNombre}
            onChange={(e) => cambiar("categoriaId", categorias.find((c) => c.nombre === e.target.value)?.id ?? "")}
            error={errores.categoriaId}
          />
          <TextField label="Indicador *" value={form.indicador} onChange={(e) => cambiar("indicador", e.target.value)} maxLength={2000} error={errores.indicador} />
          <TextAreaField label="Recomendación *" value={form.descripcion} onChange={(e) => cambiar("descripcion", e.target.value)} rows={3} maxLength={4000} error={errores.descripcion} />
          <TextAreaField label="Acciones para atender la recomendación *" value={form.acciones} onChange={(e) => cambiar("acciones", e.target.value)} rows={4} maxLength={4000} error={errores.acciones} />

          <fieldset className="stack" style={{ gap: 10, border: 0, margin: 0, padding: 0 }}>
            <legend className="field__label" style={{ marginBottom: 8 }}>Metas *</legend>
            {form.metas.map((meta, i) => {
              const actualizar = (cambio: Partial<FilaMeta>) => cambiar("metas", form.metas.map((m, j) => (j === i ? { ...m, ...cambio } : m)));
              return (
                <div key={i} className="meta-fila">
                  <TextField label={`Meta ${i + 1}`} value={meta.descripcion} maxLength={2000} placeholder="Ej. Capacitar al 80% de la planta docente"
                    onChange={(e) => actualizar({ descripcion: e.target.value })} />
                  <TextField label="Fecha compromiso" icon="calendario" type="date" value={meta.fecha} min={hoy > vigencia.inicio ? hoy : vigencia.inicio} max={form.fechaCumplimiento || vigencia.fin}
                    onChange={(e) => actualizar({ fecha: e.target.value })} />
                  <TextField label="% esperado" type="number" inputMode="numeric" min={1} max={99} step={1} value={meta.porcentaje} placeholder="1–99"
                    onChange={(e) => actualizar({ porcentaje: e.target.value })} />
                  <div className="meta-fila__quitar">
                    <IconButton icon="eliminar" danger label={`Quitar meta ${i + 1}`} disabled={form.metas.length === 1}
                      onClick={() => cambiar("metas", form.metas.filter((_, j) => j !== i))} />
                  </div>
                </div>
              );
            })}
            {errores.metas && <p className="field__help t-danger" role="alert" style={{ margin: 0 }}>{errores.metas}</p>}
            <div className="row">
              <Button variant="contorno" icon="mas" onClick={() => cambiar("metas", [...form.metas, META_VACIA])}>Agregar meta</Button>
              <span className="t-small t-muted">Cada meta debe incluir una cifra o porcentaje. La fecha y el % esperado son el avance comprometido a esa fecha; puedes dejarlos para después y completarlos aquí o en Metas, pero al menos una meta debe tenerlos para enviar.</span>
            </div>
          </fieldset>

          <SelectField label="Área responsable *" options={[SIN_AREA, ...areas.map((a) => a.nombre)]}
            value={form.areaResponsable || SIN_AREA}
            onChange={(e) => cambiar("areaResponsable", e.target.value === SIN_AREA ? "" : e.target.value)}
            error={errores.areaResponsable} help={areas.length ? undefined : "No hay áreas activas en el catálogo."} />
          <div style={{ maxWidth: 320 }}>
            <TextField label="Fecha de cumplimiento *" icon="calendario" type="date" min={vigencia.inicio} max={vigencia.fin}
              value={form.fechaCumplimiento} onChange={(e) => cambiar("fechaCumplimiento", e.target.value)} error={errores.fechaCumplimiento} />
          </div>
        </Card>
      )}

      <Card title="Recomendaciones del plan" subtitle={plan ? `${recomendaciones.length} recomendación(es) capturada(s).` : undefined}
        actions={plan && <LinkButton href="/licenciatura/metas" variant="contorno" icon="objetivo">Configurar metas</LinkButton>}>
        {cargando ? (
          <p className="t-muted" style={{ margin: 0 }}>Cargando el plan…</p>
        ) : recomendaciones.length === 0 ? (
          <EmptyState titulo="Aún no hay recomendaciones" mensaje="Llena el formulario y usa Guardar borrador para agregar la primera." icon="documento" />
        ) : (
          <DataTable<RecomendacionPlan>
            caption="Recomendaciones del plan"
            rows={recomendaciones}
            rowKey={(r) => r.id}
            columns={[
              { header: "#", width: 50, render: (r) => r.numero },
              { header: "Categoría / Indicador", width: 230, render: (r) => <><div className="t-medium">{r.categoria}</div><div className="t-small t-muted">{r.indicador}</div></> },
              {
                header: "Recomendación",
                render: (r) => (
                  <>
                    <div>{r.descripcion}</div>
                    {r.observacion && <div className="t-small t-danger" style={{ marginTop: 4 }}>Observación: {r.observacion}</div>}
                  </>
                ),
              },
              { header: "Metas", width: 110, render: (r) => { const conFecha = r.metas.filter((m) => m.fechaCompromiso && m.porcentajeEsperado !== null).length; return <span>{r.metas.length}<span className="t-small t-muted"> · {conFecha} con fecha</span></span>; } },
              { header: "Área responsable", width: 180, render: (r) => r.areaResponsable ?? "—" },
              { header: "Fecha de cumplimiento", width: 130, render: (r) => fechaLegible(r.fechaCumplimiento) },
              { header: "Captura", width: 120, render: (r) => <Badge estado={estaCompleta(r) ? "Completado" : "Pendiente"}>{estaCompleta(r) ? "Completa" : "Incompleta"}</Badge> },
              {
                header: "Acciones",
                width: 110,
                render: (r) =>
                  editable ? (
                    <div className="row" style={{ gap: 4 }}>
                      <IconButton icon="editar" label={`Editar recomendación ${r.numero}`} onClick={() => editar(r)} disabled={ocupado} />
                      <IconButton icon="eliminar" danger label={`Eliminar recomendación ${r.numero}`} onClick={() => void eliminar(r)} disabled={ocupado} />
                    </div>
                  ) : (
                    "—"
                  ),
              },
            ]}
          />
        )}
      </Card>

      <ConfirmModal
        open={confirmarEnvio}
        tipo="validar"
        titulo="¿Enviar el plan a validación?"
        mensaje="El plan pasará a En validación y la Administración recibirá un aviso. No podrás editarlo mientras se revisa."
        confirmLabel="Sí, enviar a validación"
        onCancel={() => setConfirmarEnvio(false)}
        onConfirm={() => void enviar()}
      />
    </>
  );
};

export default CapturaPlanPage;
