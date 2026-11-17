"use client";

// HU-04 · Captura del Plan de Mejora Continua.
// Datos: GET /mi-plan y GET /catalogos. Guardado: POST /ciclos/:cicloId/plan/recomendaciones.
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Button, LinkButton } from "@/components/ui/Button";
import { TablaAnexo1 } from "@/components/plan/TablaAnexo1";
import { Alert, Badge, Card, EmptyState, PageTitle } from "@/components/ui/Display";
import { Checkbox, SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { agregarRecomendacion, ApiError, obtenerCatalogos, obtenerMiPlan } from "@/lib/api";
import { errorMetaMedible, fechaCorta, lineas } from "@/lib/reglas";
import { ESTADO_VERSION_BADGE, type Catalogos, type IndicadorPlan, type PlanDeMejora } from "@/lib/types";

const ELIGE = "Selecciona una opción";
const NUEVO_INDICADOR = "+ Nuevo indicador";

type Formulario = {
  categoria: string;
  indicador: string;
  indicadorNuevo: string;
  descripcion: string;
  acciones: string;
  metas: string;
  areaIds: string[];
  fechaCumplimiento: string;
  etiquetaFecha: string;
};

const VACIO: Formulario = {
  categoria: ELIGE,
  indicador: NUEVO_INDICADOR,
  indicadorNuevo: "",
  descripcion: "",
  acciones: "",
  metas: "",
  areaIds: [],
  fechaCumplimiento: "",
  etiquetaFecha: "",
};

type Errores = Partial<Record<keyof Formulario, string>>;

/** Etiqueta única para el selector de indicadores (el select trabaja con textos). */
const etiquetaIndicador = (i: IndicadorPlan, n: number) => `${i.clave ?? `Indicador ${n}`} · ${i.descripcion.slice(0, 70)}`;

const validar = (f: Formulario, plan: PlanDeMejora): Errores => {
  const errores: Errores = {};
  if (f.categoria === ELIGE) errores.categoria = "Elige una categoría del catálogo.";
  if (f.indicador === NUEVO_INDICADOR && f.indicadorNuevo.trim().length < 3) errores.indicadorNuevo = "Escribe el indicador (mínimo 3 caracteres).";
  if (f.descripcion.trim().length < 3) errores.descripcion = "Escribe la recomendación del organismo acreditador.";
  if (lineas(f.acciones).length === 0) errores.acciones = "Agrega al menos una acción.";
  const metas = lineas(f.metas);
  if (metas.length === 0) errores.metas = "Agrega al menos una meta.";
  else errores.metas = metas.map(errorMetaMedible).find((e) => e !== null) ?? undefined;
  if (f.areaIds.length === 0) errores.areaIds = "Elige al menos un área responsable.";
  if (!f.fechaCumplimiento) errores.fechaCumplimiento = "Indica la fecha de cumplimiento.";
  else if (f.fechaCumplimiento < plan.vigenciaInicio || f.fechaCumplimiento > plan.vigenciaFin) {
    errores.fechaCumplimiento = `Debe estar dentro de la vigencia: ${fechaCorta(plan.vigenciaInicio)} a ${fechaCorta(plan.vigenciaFin)}.`;
  }
  return Object.fromEntries(Object.entries(errores).filter(([, v]) => v)) as Errores;
};

const CapturaPlanPage = () => {
  const [plan, setPlan] = useState<PlanDeMejora | null>(null);
  const [catalogos, setCatalogos] = useState<Catalogos | null>(null);
  const [errorCarga, setErrorCarga] = useState<string>();
  /** 404 de /mi-plan: la Administradora todavía no registra el ciclo (vigencia) de esta licenciatura. */
  const [sinCiclo, setSinCiclo] = useState<string>();
  const [form, setForm] = useState<Formulario>(VACIO);
  const [errores, setErrores] = useState<Errores>({});
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: "exito" | "error"; texto: string }>();
  const [filtroArea, setFiltroArea] = useState("");

  const cargarPlan = useCallback(async () => {
    try {
      setPlan(await obtenerMiPlan());
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setSinCiclo(error.message);
        return;
      }
      setErrorCarga(error instanceof ApiError ? error.message : "No pudimos cargar tu plan de mejora. Intenta de nuevo.");
    }
  }, []);

  useEffect(() => {
    void cargarPlan();
    obtenerCatalogos()
      .then(setCatalogos)
      .catch(() => setErrorCarga("No pudimos cargar los catálogos. Intenta de nuevo."));
  }, [cargarPlan]);

  const categoria = catalogos?.categorias.find((c) => c.nombre === form.categoria);
  const indicadoresDeCategoria = useMemo(
    () => (plan?.indicadores ?? []).filter((i) => i.categoria.id === categoria?.id),
    [plan, categoria],
  );
  const opcionesIndicador = useMemo(
    () => new Map(indicadoresDeCategoria.map((i, n) => [etiquetaIndicador(i, n + 1), i])),
    [indicadoresDeCategoria],
  );
  const editable = plan?.version?.editable ?? true;

  const cambiar = <K extends keyof Formulario>(campo: K, valor: Formulario[K]) => {
    setForm((actual) => ({ ...actual, [campo]: valor }));
    setErrores((actual) => ({ ...actual, [campo]: undefined }));
  };

  const alternarArea = (id: string, marcada: boolean) =>
    cambiar("areaIds", marcada ? [...form.areaIds, id] : form.areaIds.filter((a) => a !== id));

  /** Prepara el formulario para otra recomendación del mismo indicador. */
  const agregarAIndicador = (i: IndicadorPlan) => {
    const n = (plan?.indicadores ?? []).filter((x) => x.categoria.id === i.categoria.id).indexOf(i) + 1;
    setForm({ ...VACIO, categoria: i.categoria.nombre, indicador: etiquetaIndicador(i, n) });
    setErrores({});
    setAviso(undefined);
  };

  const guardar = async (event: FormEvent) => {
    event.preventDefault();
    if (!plan) return;
    const encontrados = validar(form, plan);
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0 || !categoria) return;

    const existente = opcionesIndicador.get(form.indicador);
    setEnviando(true);
    setAviso(undefined);
    try {
      await agregarRecomendacion(plan.cicloId, {
        categoriaId: categoria.id,
        ...(existente ? { indicadorId: existente.id } : { indicador: form.indicadorNuevo.trim() }),
        descripcion: form.descripcion.trim(),
        acciones: lineas(form.acciones),
        metas: lineas(form.metas),
        areaIds: form.areaIds,
        fechaCumplimiento: form.fechaCumplimiento,
        ...(form.etiquetaFecha.trim() ? { etiquetaFecha: form.etiquetaFecha.trim() } : {}),
      });
      await cargarPlan();
      setForm(VACIO);
      setAviso({ tipo: "exito", texto: "Recomendación guardada. Ya aparece en la tabla del Plan de Mejora Continua." });
    } catch (error) {
      setAviso({ tipo: "error", texto: error instanceof ApiError ? error.message : "No pudimos guardar la recomendación. Intenta de nuevo." });
    } finally {
      setEnviando(false);
    }
  };

  if (sinCiclo) {
    return (
      <>
        <PageTitle crumbs={[{ label: "Inicio", href: "/licenciatura/dashboard" }, { label: "Plan de mejora" }]} title="Captura del plan de mejora" />
        <Card>
          <EmptyState
            icon="calendario"
            titulo="Tu plan aún no se puede capturar"
            mensaje={`${sinCiclo} Cuando la Unidad de Planeación registre la vigencia, aquí aparecerá el formulario de captura.`}
          />
        </Card>
      </>
    );
  }

  if (errorCarga) {
    return (
      <>
        <PageTitle crumbs={[{ label: "Inicio", href: "/licenciatura/dashboard" }, { label: "Plan de mejora" }]} title="Captura del plan de mejora" />
        <Alert tipo="error">{errorCarga}</Alert>
      </>
    );
  }

  if (!plan || !catalogos) {
    return (
      <>
        <PageTitle crumbs={[{ label: "Inicio", href: "/licenciatura/dashboard" }, { label: "Plan de mejora" }]} title="Captura del plan de mejora" />
        <p className="t-muted" role="status">Cargando tu plan de mejora…</p>
      </>
    );
  }

  return (
    <>
      <PageTitle
        crumbs={[{ label: "Inicio", href: "/licenciatura/dashboard" }, { label: "Plan de mejora" }]}
        title="Captura del plan de mejora"
        subtitle={`Licenciatura en ${plan.licenciatura} · ${plan.organismo} · Vigencia ${fechaCorta(plan.vigenciaInicio)} – ${fechaCorta(plan.vigenciaFin)}`}
        actions={<LinkButton href="/licenciatura/hitos" variant="contorno" icon="objetivo">Configurar hitos</LinkButton>}
      />

      {!editable && plan.version && (
        <Alert tipo="info">
          Tu plan está {ESTADO_VERSION_BADGE[plan.version.estado].toLowerCase()}, así que no se puede modificar. Si necesitas cambios, el Administrador debe devolverlo.
        </Alert>
      )}
      {aviso && <Alert tipo={aviso.tipo}>{aviso.texto}</Alert>}

      <div className="row row--top row--responsive" style={{ gap: 24 }}>
        <Card className="side-340" style={{ padding: 16, gap: 8 }}>
          <div className="row" style={{ padding: "0 8px" }}>
            <h2 className="t-h3 grow">Indicadores</h2>
            {plan.version
              ? <Badge estado={ESTADO_VERSION_BADGE[plan.version.estado]}>Versión {plan.version.numero}</Badge>
              : <Badge estado="Nuevo">Sin plan</Badge>}
          </div>
          {plan.indicadores.length === 0 ? (
            <p className="t-small t-muted" style={{ padding: "0 8px" }}>Aún no hay indicadores. La primera recomendación que guardes crea la versión 1 del plan.</p>
          ) : (
            <ul className="stack" style={{ gap: 4, listStyle: "none", margin: 0, padding: 0 }}>
              {plan.indicadores.map((i) => (
                <li key={i.id} className="muted-box stack" style={{ gap: 4 }}>
                  <span className="t-small t-muted">{i.categoria.nombre}</span>
                  <span className="t-medium">{i.clave ? `${i.clave} · ` : ""}{i.descripcion}</span>
                  <div className="row">
                    <span className="t-small t-muted grow">{i.recomendaciones.length} recomendación(es)</span>
                    {editable && <Button variant="texto" icon="mas" onClick={() => agregarAIndicador(i)}>Agregar</Button>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Nueva recomendación" subtitle="Los campos con * son obligatorios." className="grow" style={{ gap: 20 }}>
          <form onSubmit={guardar} noValidate>
            <fieldset disabled={!editable || enviando} className="stack" style={{ gap: 20, border: 0, margin: 0, padding: 0, minWidth: 0 }}>
              <div className="grid-2">
                <SelectField
                  label="Categoría (catálogo) *"
                  options={[ELIGE, ...catalogos.categorias.map((c) => c.nombre)]}
                  value={form.categoria}
                  onChange={(e) => { cambiar("categoria", e.target.value); cambiar("indicador", NUEVO_INDICADOR); }}
                  error={errores.categoria}
                />
                <SelectField
                  label="Indicador *"
                  options={[NUEVO_INDICADOR, ...opcionesIndicador.keys()]}
                  value={form.indicador}
                  onChange={(e) => cambiar("indicador", e.target.value)}
                  help={categoria ? "Puedes asociar varias recomendaciones a un mismo indicador." : "Primero elige la categoría."}
                  disabled={!categoria}
                />
              </div>
              {form.indicador === NUEVO_INDICADOR && (
                <TextAreaField label="Descripción del nuevo indicador *" rows={2} value={form.indicadorNuevo} onChange={(e) => cambiar("indicadorNuevo", e.target.value)} error={errores.indicadorNuevo} maxLength={2000} />
              )}
              <TextAreaField label="Recomendación del organismo acreditador *" rows={3} value={form.descripcion} onChange={(e) => cambiar("descripcion", e.target.value)} error={errores.descripcion} maxLength={4000} />
              <div className="grid-2">
                <TextAreaField label="Acciones para atender la recomendación *" help="Una acción por línea." rows={4} value={form.acciones} onChange={(e) => cambiar("acciones", e.target.value)} error={errores.acciones} />
                <TextAreaField label="Metas *" help={'Una por línea, con su objetivo en porcentaje. Ej.: "Capacitar al 80% de la planta docente".'} rows={4} value={form.metas} onChange={(e) => cambiar("metas", e.target.value)} error={errores.metas} />
              </div>
              <fieldset className="stack" style={{ gap: 8, border: 0, margin: 0, padding: 0 }} aria-describedby={errores.areaIds ? "areas-error" : undefined}>
                <legend className="field__label">Área(s) responsable(s) *</legend>
                <TextField label="Buscar área" icon="buscar" placeholder="Ej.: Secretaría General, Coordinación de…" value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)} />
                <div className="grid-2 muted-box" style={{ gap: 8, maxHeight: 240, overflowY: "auto" }}>
                  {catalogos.areas
                    .filter((a) => form.areaIds.includes(a.id) || a.nombre.toLowerCase().includes(filtroArea.trim().toLowerCase()))
                    .map((a) => (
                      <Checkbox key={a.id} label={a.nombre} checked={form.areaIds.includes(a.id)} onChange={(e) => alternarArea(a.id, e.target.checked)} />
                    ))}
                </div>
                <p className="t-small t-muted" style={{ margin: 0 }}>
                  {form.areaIds.length === 0
                    ? "Ninguna área seleccionada."
                    : `Seleccionadas: ${catalogos.areas.filter((a) => form.areaIds.includes(a.id)).map((a) => a.nombre).join(", ")}.`}
                </p>
                {errores.areaIds && <p id="areas-error" className="t-small t-danger" role="alert" style={{ margin: 0 }}>{errores.areaIds}</p>}
              </fieldset>
              <div className="grid-2">
                <TextField
                  label="Fecha de cumplimiento *"
                  icon="calendario"
                  type="date"
                  min={plan.vigenciaInicio}
                  max={plan.vigenciaFin}
                  value={form.fechaCumplimiento}
                  onChange={(e) => cambiar("fechaCumplimiento", e.target.value)}
                  help={`Dentro de la vigencia: ${fechaCorta(plan.vigenciaInicio)} a ${fechaCorta(plan.vigenciaFin)}.`}
                  error={errores.fechaCumplimiento}
                />
                <TextField label="Semestre (opcional)" placeholder="Ej.: Semestre 2027-2" maxLength={80} value={form.etiquetaFecha} onChange={(e) => cambiar("etiquetaFecha", e.target.value)} />
              </div>
              <div className="row">
                <Button variant="contorno" onClick={() => { setForm(VACIO); setErrores({}); }}>Limpiar</Button>
                <span className="spacer" />
                <Button type="submit" icon="check">{enviando ? "Guardando…" : "Guardar recomendación"}</Button>
              </div>
            </fieldset>
          </form>
        </Card>
      </div>

      <TablaAnexo1 plan={plan} mensajeVacio="Cuando guardes la primera, el plan aparecerá aquí con el formato del Anexo 1." />
    </>
  );
};

export default CapturaPlanPage;
