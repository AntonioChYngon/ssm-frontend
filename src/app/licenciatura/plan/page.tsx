"use client";

import { useEffect, useState } from "react";
import { Button, IconButton, LinkButton } from "@/components/ui/Button";
import { Alert, Badge, Card, DataTable, EmptyState, PageTitle } from "@/components/ui/Display";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { ConfirmModal } from "@/components/ui/Interactive";
import { ApiError, eliminarRecomendacion, enviarPlan, guardarRecomendacion, obtenerCatalogos, obtenerMiPlan } from "@/lib/api";
import { ESTADO_PLAN_BADGE, type ItemCatalogo, type MiPlan, type PlanDetalle, type RecomendacionPayload, type RecomendacionPlan } from "@/lib/types";

const SIN_CATEGORIA = "Selecciona una categoría";

type Formulario = {
  categoriaId: string;
  indicador: string;
  descripcion: string;
  acciones: string;
  metas: string[];
  areaResponsable: string;
  fechaCumplimiento: string;
};

type Campo = keyof Formulario;
type Errores = Partial<Record<Campo, string>>;

const VACIO: Formulario = { categoriaId: "", indicador: "", descripcion: "", acciones: "", metas: [""], areaResponsable: "", fechaCumplimiento: "" };

const fechaLegible = (iso: string | null) => (iso ? iso.split("-").reverse().join("/") : "—");

const desdeRecomendacion = (r: RecomendacionPlan): Formulario => ({
  categoriaId: r.categoriaId,
  indicador: r.indicador,
  descripcion: r.descripcion,
  acciones: r.acciones.join("\n"),
  metas: r.metas.length ? r.metas.map((m) => m.descripcion) : [""],
  areaResponsable: r.areaResponsable ?? "",
  fechaCumplimiento: r.fechaCumplimiento ?? "",
});

const metasLimpias = (metas: string[]) => metas.map((m) => m.trim()).filter(Boolean);

const tieneContenido = (f: Formulario) =>
  Boolean(f.categoriaId || f.indicador.trim() || f.descripcion.trim() || f.acciones.trim() || metasLimpias(f.metas).length || f.areaResponsable.trim() || f.fechaCumplimiento);

const estaCompleta = (r: RecomendacionPlan) => r.acciones.length > 0 && r.metas.length > 0 && Boolean(r.areaResponsable?.trim()) && Boolean(r.fechaCumplimiento);

/** "Guardar borrador" exige Categoría, Indicador y Recomendación; "Enviar a validación" exige los 7 campos. */
const validar = (f: Formulario, completo: boolean, vigencia: { inicio: string; fin: string }): Errores => {
  const e: Errores = {};
  if (!f.categoriaId) e.categoriaId = "Elige una categoría.";
  if (f.indicador.trim().length < 3) e.indicador = "Escribe el indicador (al menos 3 caracteres).";
  if (f.descripcion.trim().length < 3) e.descripcion = "Escribe la recomendación (al menos 3 caracteres).";
  if (f.fechaCumplimiento && (f.fechaCumplimiento < vigencia.inicio || f.fechaCumplimiento > vigencia.fin)) {
    e.fechaCumplimiento = `La fecha debe estar dentro del ciclo de acreditación (${fechaLegible(vigencia.inicio)} a ${fechaLegible(vigencia.fin)}).`;
  }
  if (completo) {
    if (!f.acciones.trim()) e.acciones = "Escribe las acciones para atender la recomendación.";
    if (!metasLimpias(f.metas).length) e.metas = "Agrega al menos una meta.";
    if (!f.areaResponsable.trim()) e.areaResponsable = "Escribe el área responsable.";
    if (!f.fechaCumplimiento) e.fechaCumplimiento = "Elige la fecha de cumplimiento.";
  }
  return e;
};

const aPayload = (f: Formulario): RecomendacionPayload => ({
  categoriaId: f.categoriaId,
  indicador: f.indicador.trim(),
  descripcion: f.descripcion.trim(),
  acciones: f.acciones.trim() ? [f.acciones.trim()] : [],
  metas: metasLimpias(f.metas),
  areaResponsable: f.areaResponsable.trim() || undefined,
  fechaCumplimiento: f.fechaCumplimiento || undefined,
});

const mensajeDe = (error: unknown) => (error instanceof ApiError ? error.message : "No pudimos completar la operación. Intenta de nuevo.");

const CapturaPlanPage = () => {
  const [miPlan, setMiPlan] = useState<MiPlan | null>(null);
  const [categorias, setCategorias] = useState<ItemCatalogo[]>([]);
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
      })
      .catch((error) => setAviso({ tipo: "error", texto: mensajeDe(error) }))
      .finally(() => setCargando(false));
  }, []);

  const plan: PlanDetalle | null = miPlan?.plan ?? null;
  const ciclo = miPlan?.ciclo;
  const editable = plan ? plan.editable : true;
  const vigencia = { inicio: ciclo?.vigenciaInicio ?? "", fin: ciclo?.vigenciaFin ?? "" };
  const recomendaciones = plan?.recomendacionesDetalle ?? [];
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
    const e = validar(form, completo, vigencia);
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

  const categoriaNombre = categorias.find((c) => c.id === form.categoriaId)?.nombre ?? SIN_CATEGORIA;

  return (
    <>
      <PageTitle
        crumbs={[{ label: "Inicio", href: "/licenciatura/dashboard" }, { label: "Plan de mejora" }]}
        title="Captura del plan de mejora"
        subtitle={ciclo ? `Licenciatura en ${ciclo.licenciatura} · Ciclo ${ciclo.vigenciaInicio.slice(0, 4)}–${ciclo.vigenciaFin.slice(0, 4)} · ${ciclo.organismo}` : undefined}
        actions={
          <>
            {plan && <Badge estado={ESTADO_PLAN_BADGE[plan.estado]} />}
            <Button variant="contorno" icon="check" onClick={guardarBorrador} disabled={!editable || ocupado || cargando || !ciclo}>Guardar borrador</Button>
            <Button icon="enviar" onClick={pedirEnvio} disabled={!editable || ocupado || cargando || !ciclo}>Enviar a validación</Button>
          </>
        }
      />

      {aviso && <Alert tipo={aviso.tipo}>{aviso.texto}</Alert>}
      {plan?.estado === "DEVUELTO" && plan.ultimaRevision && (
        <Alert tipo="advertencia">
          <strong>La Administración devolvió el plan el {plan.ultimaRevision.fecha}.</strong> {plan.ultimaRevision.comentario}
          {" "}Corrige las recomendaciones con observaciones y vuelve a enviarlo.
        </Alert>
      )}
      {plan?.estado === "EN_REVISION" && <Alert tipo="info">El plan está en validación. No se puede editar hasta que la Administración lo revise.</Alert>}
      {plan?.estado === "APROBADO" && <Alert tipo="exito">El plan fue validado y quedó bloqueado para edición.</Alert>}

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
            {form.metas.map((meta, i) => (
              <div key={i} className="row" style={{ gap: 8 }}>
                <div className="grow">
                  <TextField label={`Meta ${i + 1}`} value={meta} maxLength={2000} onChange={(e) => cambiar("metas", form.metas.map((m, j) => (j === i ? e.target.value : m)))} />
                </div>
                <div style={{ paddingTop: 26 }}>
                  <IconButton icon="eliminar" danger label={`Quitar meta ${i + 1}`} disabled={form.metas.length === 1}
                    onClick={() => cambiar("metas", form.metas.filter((_, j) => j !== i))} />
                </div>
              </div>
            ))}
            {errores.metas && <p className="field__help t-danger" role="alert" style={{ margin: 0 }}>{errores.metas}</p>}
            <div className="row">
              <Button variant="contorno" icon="mas" onClick={() => cambiar("metas", [...form.metas, ""])}>Agregar meta</Button>
              <span className="t-small t-muted">La fecha compromiso y el % esperado de cada meta se definen en Configuración de metas.</span>
            </div>
          </fieldset>

          <TextField label="Área responsable *" value={form.areaResponsable} onChange={(e) => cambiar("areaResponsable", e.target.value)} maxLength={250} error={errores.areaResponsable} />
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
              { header: "Metas", width: 80, render: (r) => r.metas.length },
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
