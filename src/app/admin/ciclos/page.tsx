"use client";

// HU-18 · Ciclos de acreditación (Administrador). Cada licenciatura tiene su ciclo, con su organismo o IEVA y una
// vigencia de hasta 5 años. Al iniciarlo se crea su carpeta /Evidencias/[Licenciatura]/[20XX-20XX]/.
// Solo puede haber un ciclo activo por licenciatura; al terminar su vigencia se bloquea la captura de la coordinación.
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button, IconButton } from "@/components/ui/Button";
import { Alert, Badge, Card, DataTable, EmptyState, PageTitle } from "@/components/ui/Display";
import { SelectField, TextField } from "@/components/ui/Field";
import { ChipGroup } from "@/components/ui/Interactive";
import { SelectorLicenciaturas, useLicenciaturasEnUrl } from "@/components/filtros/SelectorLicenciaturas";
import { ApiError, actualizarCiclo, crearCarpetaCiclo, crearCiclo, listarCiclos, obtenerCatalogos } from "@/lib/api";
import { ESTADO_PLAN_BADGE, type Catalogos, type CicloAdministracion, type CicloPayload, type EstadoBadge } from "@/lib/types";

const ELIGE = "Selecciona una opción";

type Form = {
  licenciatura: string;
  organismo: string;
  nombre: string;
  fechaEmision: string;
  vigenciaInicio: string;
  vigenciaFin: string;
  referenciaConstancia: string;
};

const VACIO: Form = { licenciatura: ELIGE, organismo: ELIGE, nombre: "", fechaEmision: "", vigenciaInicio: "", vigenciaFin: "", referenciaConstancia: "" };

const desdeCiclo = (c: CicloAdministracion): Form => ({
  licenciatura: c.licenciatura.nombre,
  organismo: c.organismo.nombre,
  nombre: c.nombre,
  fechaEmision: c.fechaEmision,
  vigenciaInicio: c.vigenciaInicio,
  vigenciaFin: c.vigenciaFin,
  referenciaConstancia: c.referenciaConstancia ?? "",
});

const fechaCorta = (iso: string) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : "—");

/** Mismo nombre por defecto que el backend: los años de la vigencia. */
const nombrePorDefecto = (f: Form) => (f.vigenciaInicio && f.vigenciaFin ? `${f.vigenciaInicio.slice(0, 4)}-${f.vigenciaFin.slice(0, 4)}` : "AAAA-AAAA");

const estadoCiclo = (c: CicloAdministracion): { badge: EstadoBadge; texto: string } => {
  if (c.activo) return { badge: "Validado", texto: "Activo" };
  if (c.estado === "VIGENTE") return { badge: "Vencido", texto: "Vigencia terminada" };
  return { badge: "Borrador", texto: "Histórico" };
};

const FILTROS: Record<string, (c: CicloAdministracion) => boolean> = {
  Todos: () => true,
  Activos: (c) => c.activo,
  "Vigencia terminada": (c) => !c.activo && c.estado === "VIGENTE",
  Históricos: (c) => c.estado !== "VIGENTE",
};

const CiclosPage = () => {
  const [ciclos, setCiclos] = useState<CicloAdministracion[] | null>(null);
  const [catalogos, setCatalogos] = useState<Catalogos | null>(null);
  const [errorCarga, setErrorCarga] = useState<string>();
  const [filtro, setFiltro] = useState("Todos");
  const [aviso, setAviso] = useState<string>();

  const [panel, setPanel] = useState<{ modo: "nuevo" } | { modo: "editar"; ciclo: CicloAdministracion } | null>(null);
  const [form, setForm] = useState<Form>(VACIO);
  const [errorForm, setErrorForm] = useState<string>();
  const [enviando, setEnviando] = useState(false);

  // HU-13: una, varias o todas las licenciaturas (se guarda en la URL).
  const licenciaturas = useLicenciaturasEnUrl();

  const cargar = async () => {
    try {
      const [lista, cat] = await Promise.all([listarCiclos(licenciaturas.parametro), obtenerCatalogos()]);
      setCiclos(lista);
      setCatalogos(cat);
      setErrorCarga(undefined);
    } catch (e) {
      setErrorCarga(e instanceof ApiError ? e.message : "No pudimos cargar los ciclos. Revisa tu conexión.");
    }
  };

  useEffect(() => {
    if (licenciaturas.listo) void cargar();
  }, [licenciaturas.listo, licenciaturas.parametro]);

  const cambiar = <K extends keyof Form>(campo: K, valor: Form[K]) => setForm((f) => ({ ...f, [campo]: valor }));

  const abrirNuevo = () => {
    setForm(VACIO);
    setErrorForm(undefined);
    setAviso(undefined);
    setPanel({ modo: "nuevo" });
  };

  const abrirEdicion = (ciclo: CicloAdministracion) => {
    setForm(desdeCiclo(ciclo));
    setErrorForm(undefined);
    setAviso(undefined);
    setPanel({ modo: "editar", ciclo });
  };

  const cerrarPanel = () => {
    setPanel(null);
    setErrorForm(undefined);
  };

  const guardar = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (!panel || !catalogos || enviando) return;
    const licenciatura = catalogos.licenciaturas.find((l) => l.nombre === form.licenciatura);
    const organismo = catalogos.organismos.find((o) => o.nombre === form.organismo);
    if (!licenciatura || !organismo) return setErrorForm("Selecciona la licenciatura y el organismo acreditador.");
    if (!form.fechaEmision || !form.vigenciaInicio || !form.vigenciaFin) return setErrorForm("Escribe la fecha de emisión y las fechas de inicio y fin.");

    const datos: CicloPayload = {
      licenciaturaId: licenciatura.id,
      organismoId: organismo.id,
      nombre: form.nombre.trim() || undefined,
      fechaEmision: form.fechaEmision,
      vigenciaInicio: form.vigenciaInicio,
      vigenciaFin: form.vigenciaFin,
      referenciaConstancia: form.referenciaConstancia.trim() || undefined,
    };
    setEnviando(true);
    setErrorForm(undefined);
    try {
      const ciclo = panel.modo === "nuevo" ? await crearCiclo(datos) : await actualizarCiclo(panel.ciclo.id, datos);
      setPanel(null);
      setAviso(
        ciclo.activo
          ? `Ciclo ${ciclo.nombre} de ${ciclo.licenciatura.nombre} guardado. Carpeta de evidencias: ${ciclo.carpeta?.ruta ?? "pendiente"}. La coordinación ya puede capturar.`
          : `Ciclo ${ciclo.nombre} de ${ciclo.licenciatura.nombre} registrado como histórico (su vigencia ya terminó).`,
      );
      await cargar();
    } catch (e) {
      setErrorForm(e instanceof ApiError ? e.message : "No pudimos guardar el ciclo. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  const crearCarpeta = async (ciclo: CicloAdministracion) => {
    try {
      const actualizado = await crearCarpetaCiclo(ciclo.id);
      setAviso(`Carpeta creada: ${actualizado.carpeta?.ruta}`);
      await cargar();
    } catch (e) {
      setAviso(e instanceof ApiError ? e.message : "No pudimos crear la carpeta.");
    }
  };

  const lista = ciclos ?? [];
  const visibles = useMemo(() => lista.filter(FILTROS[filtro] ?? FILTROS.Todos), [lista, filtro]);
  const editando = panel?.modo === "editar";

  return (
    <>
      <PageTitle
        crumbs={[{ label: "Inicio", href: "/admin/dashboard" }, { label: "Ciclos de acreditación" }]}
        title="Ciclos de acreditación"
        subtitle="Inicia el ciclo de cada licenciatura con su vigencia. El sistema crea su carpeta de evidencias y bloquea la captura cuando termina."
        actions={<Button icon="mas" onClick={abrirNuevo} disabled={!catalogos}>Iniciar nuevo ciclo</Button>}
      />
      {errorCarga && <Alert tipo="error">{errorCarga}</Alert>}
      {aviso && <Alert tipo="exito">{aviso}</Alert>}

      <div className="row row--top row--responsive" style={{ gap: 24 }}>
        <div className="stack grow" style={{ gap: 16 }}>
          <div className="row row--end row--responsive" style={{ gap: 16 }}>
            <SelectorLicenciaturas seleccion={licenciaturas.ids} alCambiar={licenciaturas.cambiar} />
            <ChipGroup label="Estado del ciclo" options={Object.keys(FILTROS)} value={filtro} onChange={setFiltro} />
          </div>
          {ciclos === null && !errorCarga ? (
            <p className="t-muted" aria-busy="true">Cargando ciclos…</p>
          ) : lista.length === 0 ? (
            <EmptyState
              icon="calendario"
              titulo="Aún no hay ciclos de acreditación"
              mensaje="Inicia el ciclo de una licenciatura con su vigencia para que su coordinación pueda capturar el Plan de Mejora."
              action={<Button icon="mas" onClick={abrirNuevo} disabled={!catalogos}>Iniciar nuevo ciclo</Button>}
            />
          ) : (
            <DataTable<CicloAdministracion>
              caption="Ciclos de acreditación por licenciatura"
              rows={visibles}
              rowKey={(c) => c.id}
              columns={[
                { header: "Licenciatura", render: (c) => <div><div className="t-medium">{c.licenciatura.nombre}</div><div className="t-small t-muted">Ciclo {c.nombre}</div></div> },
                { header: "Organismo o IEVA", render: (c) => <span className="t-small">{c.organismo.nombre}</span> },
                { header: "Vigencia", render: (c) => <span className="t-small">{fechaCorta(c.vigenciaInicio)} al {fechaCorta(c.vigenciaFin)}</span> },
                { header: "Estado", render: (c) => { const e = estadoCiclo(c); return <Badge estado={e.badge}>{e.texto}</Badge>; } },
                { header: "Plan", render: (c) => (c.plan ? <Badge estado={ESTADO_PLAN_BADGE[c.plan.estado]}>{`${c.plan.recomendaciones} recomendaciones`}</Badge> : <span className="t-small t-muted">Sin capturar</span>) },
                {
                  header: "Carpeta de evidencias",
                  render: (c) =>
                    c.carpeta ? (
                      c.carpeta.url ? <a href={c.carpeta.url} target="_blank" rel="noreferrer" className="t-small">{c.carpeta.ruta}</a> : <code className="t-small">{c.carpeta.ruta}</code>
                    ) : (
                      <Button variant="texto" icon="carpeta" onClick={() => void crearCarpeta(c)}>Crear carpeta</Button>
                    ),
                },
                {
                  header: "Acciones",
                  width: 90,
                  render: (c) => (
                    <IconButton
                      icon="editar"
                      label={c.plan ? `La coordinación de ${c.licenciatura.nombre} ya capturó su plan; el ciclo ya no se puede corregir` : `Corregir ciclo de ${c.licenciatura.nombre}`}
                      onClick={() => abrirEdicion(c)}
                      disabled={c.plan !== null}
                    />
                  ),
                },
              ]}
            />
          )}
          {lista.length > 0 && <span className="t-small t-muted">Mostrando {visibles.length} de {lista.length} ciclos</span>}
        </div>

        {panel && catalogos && (
          <Card
            title={editando ? "Corregir ciclo" : "Iniciar nuevo ciclo"}
            subtitle="Los campos con * son obligatorios."
            className="side-380"
            actions={<IconButton icon="cerrar" label="Cerrar panel" onClick={cerrarPanel} />}
          >
            <form className="stack" style={{ gap: 16 }} onSubmit={guardar} noValidate>
              <SelectField
                label="Licenciatura *"
                options={[ELIGE, ...catalogos.licenciaturas.map((l) => l.nombre)]}
                value={form.licenciatura}
                onChange={(e) => cambiar("licenciatura", e.target.value)}
                disabled={editando}
                help={editando ? "La licenciatura de un ciclo no cambia." : "Si ya tiene un ciclo activo, solo podrás registrar uno anterior (vencido)."}
              />
              <SelectField label="Organismo acreditador o IEVA *" options={[ELIGE, ...catalogos.organismos.map((o) => o.nombre)]} value={form.organismo} onChange={(e) => cambiar("organismo", e.target.value)} />
              <div className="grid-2" style={{ gap: 12 }}>
                <TextField label="Inicio de la vigencia *" icon="calendario" type="date" value={form.vigenciaInicio} onChange={(e) => cambiar("vigenciaInicio", e.target.value)} />
                <TextField label="Fin de la vigencia *" icon="calendario" type="date" value={form.vigenciaFin} onChange={(e) => cambiar("vigenciaFin", e.target.value)} help="Máximo 5 años." />
              </div>
              <TextField label="Nombre del ciclo" value={form.nombre} onChange={(e) => cambiar("nombre", e.target.value)} placeholder={nombrePorDefecto(form)} help={`Si lo dejas vacío se usa "${nombrePorDefecto(form)}". Es el nombre de la carpeta.`} />
              <TextField label="Fecha de emisión de la constancia *" icon="calendario" type="date" value={form.fechaEmision} onChange={(e) => cambiar("fechaEmision", e.target.value)} help="Identifica el ciclo en el histórico." />
              <TextField label="Referencia de la constancia" value={form.referenciaConstancia} onChange={(e) => cambiar("referenciaConstancia", e.target.value)} placeholder="Número de oficio o folio" />
              {!editando && (
                <Alert tipo="info">
                  Se creará la carpeta <code>/Evidencias/{form.licenciatura === ELIGE ? "[Licenciatura]" : form.licenciatura}/{form.nombre.trim() || nombrePorDefecto(form)}/</code>. Las carpetas de ciclos anteriores se conservan.
                </Alert>
              )}
              {errorForm && <Alert tipo="error">{errorForm}</Alert>}
              <div className="row" style={{ gap: 12 }}>
                <Button variant="contorno" className="grow" onClick={cerrarPanel}>Cancelar</Button>
                <Button type="submit" icon="check" className="grow" disabled={enviando}>{enviando ? "Guardando…" : editando ? "Guardar cambios" : "Iniciar ciclo"}</Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </>
  );
};

export default CiclosPage;
