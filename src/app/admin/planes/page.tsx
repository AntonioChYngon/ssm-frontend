"use client";

// HU-04 · Planes de mejora (Administradora): ciclos de acreditación con el estado de su plan.
// Aquí la Administradora registra cada ciclo y escribe su vigencia a mano (decisión D7): sin valores por defecto.
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Button, LinkButton } from "@/components/ui/Button";
import { Alert, Badge, Card, DataTable, EmptyState, PageTitle } from "@/components/ui/Display";
import { SelectField, TextField } from "@/components/ui/Field";
import { ChipGroup } from "@/components/ui/Interactive";
import { actualizarCiclo, ApiError, crearCiclo, listarCiclos, obtenerCatalogos } from "@/lib/api";
import { errorVigencia, fechaCorta, VIGENCIA_MAXIMA_ANIOS } from "@/lib/reglas";
import { ESTADO_VERSION_BADGE, type Catalogos, type CicloResumen, type EstadoVersionPlan } from "@/lib/types";

const ELIGE = "Selecciona una opción";

const FILTROS: Record<string, (c: CicloResumen) => boolean> = {
  Todos: () => true,
  "Sin captura": (c) => c.plan === null,
  Borrador: (c) => c.plan?.estado === "BORRADOR",
  "En revisión": (c) => c.plan?.estado === "EN_REVISION",
  Devueltos: (c) => c.plan?.estado === "DEVUELTO",
  Validados: (c) => c.plan?.estado === "APROBADO",
};

type FormCiclo = {
  licenciatura: string;
  organismo: string;
  fechaEmision: string;
  vigenciaInicio: string;
  vigenciaFin: string;
  referenciaConstancia: string;
};

/** Formulario vacío: ninguna fecha se llena sola. */
const VACIO: FormCiclo = { licenciatura: ELIGE, organismo: ELIGE, fechaEmision: "", vigenciaInicio: "", vigenciaFin: "", referenciaConstancia: "" };

const desdeCiclo = (c: CicloResumen): FormCiclo => ({
  licenciatura: c.licenciatura.nombre,
  organismo: c.organismo.nombre,
  fechaEmision: c.fechaEmision,
  vigenciaInicio: c.vigenciaInicio,
  vigenciaFin: c.vigenciaFin,
  referenciaConstancia: c.referenciaConstancia ?? "",
});

const EstadoPlan = ({ estado }: { estado: EstadoVersionPlan | undefined }) =>
  estado ? <Badge estado={ESTADO_VERSION_BADGE[estado]} /> : <Badge estado="Pendiente">Sin captura</Badge>;

const PlanesPage = () => {
  const [ciclos, setCiclos] = useState<CicloResumen[] | null>(null);
  const [catalogos, setCatalogos] = useState<Catalogos | null>(null);
  const [errorCarga, setErrorCarga] = useState<string>();
  const [filtro, setFiltro] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");

  // Panel de registro / corrección del ciclo
  const [panel, setPanel] = useState<{ modo: "nuevo" } | { modo: "editar"; cicloId: string } | null>(null);
  const [form, setForm] = useState<FormCiclo>(VACIO);
  const [errorForm, setErrorForm] = useState<string>();
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<string>();

  const cargar = useCallback(async () => {
    try {
      setCiclos(await listarCiclos());
    } catch (error) {
      setErrorCarga(error instanceof ApiError ? error.message : "No pudimos cargar los planes de mejora.");
    }
  }, []);

  useEffect(() => {
    void cargar();
    obtenerCatalogos().then(setCatalogos).catch(() => setErrorCarga("No pudimos cargar los catálogos."));
  }, [cargar]);

  const abrirNuevo = () => {
    setForm(VACIO);
    setErrorForm(undefined);
    setAviso(undefined);
    setPanel({ modo: "nuevo" });
  };

  const abrirEdicion = (c: CicloResumen) => {
    setForm(desdeCiclo(c));
    setErrorForm(undefined);
    setAviso(undefined);
    setPanel({ modo: "editar", cicloId: c.id });
  };

  const cambiar = <K extends keyof FormCiclo>(campo: K, valor: FormCiclo[K]) => setForm((f) => ({ ...f, [campo]: valor }));

  const guardar = async (event: FormEvent) => {
    event.preventDefault();
    if (!catalogos || !panel) return;
    const licenciatura = catalogos.licenciaturas.find((l) => l.nombre === form.licenciatura);
    const organismo = catalogos.organismos.find((o) => o.nombre === form.organismo);
    const error = !licenciatura
      ? "Selecciona la licenciatura."
      : !organismo
        ? "Selecciona el organismo acreditador o IEVA."
        : errorVigencia(form);
    if (error || !licenciatura || !organismo) {
      setErrorForm(error ?? undefined);
      return;
    }
    const datos = {
      licenciaturaId: licenciatura.id,
      organismoId: organismo.id,
      fechaEmision: form.fechaEmision,
      vigenciaInicio: form.vigenciaInicio,
      vigenciaFin: form.vigenciaFin,
      ...(form.referenciaConstancia.trim() ? { referenciaConstancia: form.referenciaConstancia.trim() } : {}),
    };
    setEnviando(true);
    setErrorForm(undefined);
    try {
      const ciclo = panel.modo === "nuevo" ? await crearCiclo(datos) : await actualizarCiclo(panel.cicloId, datos);
      await cargar();
      setPanel(null);
      setAviso(`Ciclo de ${ciclo.licenciatura.nombre} guardado: vigencia del ${fechaCorta(ciclo.vigenciaInicio)} al ${fechaCorta(ciclo.vigenciaFin)}. La coordinación ya puede capturar su plan.`);
    } catch (e) {
      setErrorForm(e instanceof ApiError ? e.message : "No pudimos guardar el ciclo. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  const lista = ciclos ?? [];
  const visibles = lista.filter((c) => (FILTROS[filtro] ?? FILTROS.Todos)(c) && `${c.licenciatura.nombre} ${c.organismo.nombre}`.toLowerCase().includes(busqueda.toLowerCase()));
  const conCiclo = new Set(lista.filter((c) => c.estado === "VIGENTE").map((c) => c.licenciatura.id));
  const licenciaturasLibres = (catalogos?.licenciaturas ?? []).filter((l) => !conCiclo.has(l.id) || (panel?.modo === "editar" && l.nombre === form.licenciatura));

  return (
    <>
      <PageTitle
        crumbs={[{ label: "Inicio", href: "/admin/dashboard" }, { label: "Planes de mejora" }]}
        title="Planes de mejora"
        subtitle="Registra el ciclo de acreditación de cada licenciatura y consulta el plan que captura su coordinación."
        actions={<Button icon="mas" onClick={abrirNuevo} disabled={!catalogos}>Registrar ciclo de acreditación</Button>}
      />

      {errorCarga && <Alert tipo="error">{errorCarga}</Alert>}
      {aviso && <Alert tipo="exito">{aviso}</Alert>}

      {panel && catalogos && (
        <Card
          title={panel.modo === "nuevo" ? "Registrar ciclo de acreditación" : "Corregir ciclo de acreditación"}
          subtitle={`Escribe la vigencia tal como aparece en la constancia del organismo (máximo ${VIGENCIA_MAXIMA_ANIOS} años). Los campos con * son obligatorios.`}
        >
          <form onSubmit={guardar} noValidate>
            <fieldset disabled={enviando} className="stack" style={{ gap: 20, border: 0, margin: 0, padding: 0, minWidth: 0 }}>
              {errorForm && <Alert tipo="error">{errorForm}</Alert>}
              <div className="grid-2">
                <SelectField label="Licenciatura *" options={[ELIGE, ...licenciaturasLibres.map((l) => l.nombre)]} value={form.licenciatura} onChange={(e) => cambiar("licenciatura", e.target.value)} help="Solo aparecen las que no tienen un ciclo vigente." />
                <SelectField label="Organismo acreditador o IEVA *" options={[ELIGE, ...catalogos.organismos.map((o) => o.nombre)]} value={form.organismo} onChange={(e) => cambiar("organismo", e.target.value)} />
              </div>
              <div className="grid-2">
                <TextField label="Fecha de emisión de la constancia *" icon="calendario" type="date" value={form.fechaEmision} onChange={(e) => cambiar("fechaEmision", e.target.value)} help="Identifica el ciclo en el histórico." />
                <TextField label="Referencia de la constancia (opcional)" placeholder="Ej.: número de oficio o constancia" maxLength={255} value={form.referenciaConstancia} onChange={(e) => cambiar("referenciaConstancia", e.target.value)} />
              </div>
              <div className="grid-2">
                <TextField label="Inicio de la vigencia *" icon="calendario" type="date" value={form.vigenciaInicio} onChange={(e) => cambiar("vigenciaInicio", e.target.value)} />
                <TextField label="Fin de la vigencia *" icon="calendario" type="date" min={form.vigenciaInicio || undefined} value={form.vigenciaFin} onChange={(e) => cambiar("vigenciaFin", e.target.value)} />
              </div>
              <div className="row">
                <Button variant="contorno" onClick={() => setPanel(null)}>Cancelar</Button>
                <span className="spacer" />
                <Button type="submit" icon="check">{enviando ? "Guardando…" : "Guardar ciclo"}</Button>
              </div>
            </fieldset>
          </form>
        </Card>
      )}

      <div className="row row--end row--responsive">
        <div className="grow"><TextField label="Buscar" icon="buscar" placeholder="Licenciatura u organismo acreditador" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} /></div>
      </div>
      <ChipGroup label="Filtrar por estado del plan" options={Object.keys(FILTROS)} onChange={setFiltro} />

      {ciclos === null && !errorCarga ? (
        <p className="t-muted" role="status">Cargando planes de mejora…</p>
      ) : lista.length === 0 ? (
        <Card>
          <EmptyState
            titulo="Aún no hay ciclos de acreditación"
            mensaje="Registra el ciclo de una licenciatura con su vigencia para que su coordinación pueda capturar el Plan de Mejora."
            action={<Button icon="mas" onClick={abrirNuevo} disabled={!catalogos}>Registrar ciclo de acreditación</Button>}
          />
        </Card>
      ) : (
        <>
          <DataTable<CicloResumen>
            caption="Ciclos de acreditación y sus planes de mejora"
            rows={visibles}
            rowKey={(c) => c.id}
            columns={[
              { header: "Licenciatura", render: (c) => <span className="t-medium">{c.licenciatura.nombre}</span> },
              { header: "Organismo", width: 220, render: (c) => c.organismo.nombre },
              { header: "Vigencia", width: 190, render: (c) => `${fechaCorta(c.vigenciaInicio)} – ${fechaCorta(c.vigenciaFin)}` },
              { header: "Recomend.", width: 100, render: (c) => c.plan?.recomendaciones ?? 0 },
              { header: "Estado del plan", width: 150, render: (c) => <EstadoPlan estado={c.plan?.estado} /> },
              { header: "Acción", width: 220, render: (c) => (
                <div className="row" style={{ gap: 8 }}>
                  <LinkButton href={`/admin/planes/${c.id}`} variant="contorno" icon="ver">Ver plan</LinkButton>
                  {!c.plan && <Button variant="texto" icon="editar" onClick={() => abrirEdicion(c)}>Corregir</Button>}
                </div>
              ) },
            ]}
          />
          <span className="t-small t-muted">Mostrando {visibles.length} de {lista.length} ciclos</span>
        </>
      )}
    </>
  );
};

export default PlanesPage;
