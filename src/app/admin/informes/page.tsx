"use client";

// HU-08 · Informes de seguimiento recibidos (datos reales de GET /informes). La línea B puede ampliar los filtros
// y HU-13 cambiará el filtro de licenciatura por el selector de varias licenciaturas.
import { useEffect, useState } from "react";
import { LinkButton } from "@/components/ui/Button";
import { Alert, Badge, DataTable, KpiCard, PageTitle, Progress } from "@/components/ui/Display";
import { SelectField, TextField } from "@/components/ui/Field";
import { ChipGroup } from "@/components/ui/Interactive";
import { ApiError, listarInformes } from "@/lib/api";
import { fechaHoraLegible } from "@/lib/reglas-informe";
import { ESTADO_INFORME_BADGE, type EstadoInforme, type InformeResumen } from "@/lib/types";

const FILTROS: { label: string; estado: EstadoInforme | null }[] = [
  { label: "Todos", estado: null },
  { label: "En revisión", estado: "EN_REVISION" },
  { label: "Devueltos", estado: "DEVUELTO" },
  { label: "Validados", estado: "APROBADO" },
  { label: "Borrador", estado: "BORRADOR" },
];

const TODOS_SEMESTRES = "Todos los semestres";

const InformesPage = () => {
  const [informes, setInformes] = useState<InformeResumen[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [estado, setEstado] = useState<EstadoInforme | null>(null);
  const [semestre, setSemestre] = useState(TODOS_SEMESTRES);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    listarInformes()
      .then(setInformes)
      .catch((e) => setError(e instanceof ApiError ? e.message : "No pudimos cargar los informes."))
      .finally(() => setCargando(false));
  }, []);

  const cuenta = (e: EstadoInforme) => informes.filter((i) => i.estado === e).length;
  const opciones = FILTROS.map((f) => `${f.label} (${f.estado ? cuenta(f.estado) : informes.length})`);
  const semestres = [TODOS_SEMESTRES, ...[...new Set(informes.map((i) => i.periodo))].sort().reverse()];
  const visibles = informes.filter(
    (i) =>
      (!estado || i.estado === estado) &&
      (semestre === TODOS_SEMESTRES || i.periodo === semestre) &&
      i.licenciatura.toLowerCase().includes(busqueda.trim().toLowerCase()),
  );
  const enviados = informes.filter((i) => i.estado !== "BORRADOR").length;

  return (
    <>
      <PageTitle
        crumbs={[{ label: "Inicio", href: "/admin/dashboard" }, { label: "Informes de seguimiento" }]}
        title="Informes de seguimiento"
        subtitle="Informes semestrales que reportan el avance de cada plan validado. Selecciona uno para revisarlo."
      />
      <div className="grid-4">
        <KpiCard tono="azul" titulo="Informes enviados" valor={String(enviados)} detalle={`${informes.length} registrados`} icon="documento" />
        <KpiCard tono="naranja" titulo="Por revisar" valor={String(cuenta("EN_REVISION"))} detalle="esperando validación" icon="reloj" />
        <KpiCard tono="rojo" titulo="Devueltos" valor={String(cuenta("DEVUELTO"))} detalle="esperando corrección" icon="mensaje" />
        <KpiCard tono="verde" titulo="Validados" valor={String(cuenta("APROBADO"))} detalle="aprobados" icon="check" />
      </div>
      <div className="row row--end row--responsive">
        <div className="grow"><TextField label="Buscar" icon="buscar" placeholder="Licenciatura" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} /></div>
        <div style={{ width: 220 }}><SelectField label="Semestre" options={semestres} value={semestre} onChange={(e) => setSemestre(e.target.value)} /></div>
      </div>
      {/* key: vuelve a montar los chips cuando llegan los conteos (ChipGroup guarda su selección internamente). */}
      <ChipGroup key={cargando ? "cargando" : "listo"} label="Filtrar por estado" options={opciones} onChange={(o) => setEstado(FILTROS[opciones.indexOf(o)]?.estado ?? null)} />
      {error && <Alert tipo="error">{error}</Alert>}
      {cargando ? (
        <p className="t-muted">Cargando informes…</p>
      ) : (
        <DataTable<InformeResumen>
          caption="Informes de seguimiento"
          rows={visibles}
          rowKey={(i) => i.id}
          columns={[
            { header: "Licenciatura", render: (i) => <span className="t-medium">{i.licenciatura}</span> },
            { header: "Semestre", width: 110, render: (i) => i.periodo },
            { header: "Recomendaciones con avance", width: 220, render: (i) => <Progress value={i.recomendaciones ? Math.round((i.conAvance / i.recomendaciones) * 100) : 0} width={90} /> },
            { header: "Evidencias", width: 110, render: (i) => i.evidencias },
            { header: "Enviado", width: 160, render: (i) => fechaHoraLegible(i.enviadoEn) },
            { header: "Estado", width: 140, render: (i) => <Badge estado={ESTADO_INFORME_BADGE[i.estado]} /> },
            { header: "Acción", width: 140, render: (i) => i.estado === "EN_REVISION"
              ? <LinkButton href={`/admin/informes/${i.id}`} icon="check">Revisar</LinkButton>
              : <LinkButton href={`/admin/informes/${i.id}`} variant="contorno" icon="ver">Ver</LinkButton> },
          ]}
        />
      )}
      <span className="t-small t-muted">Mostrando {visibles.length} de {informes.length} informes</span>
    </>
  );
};

export default InformesPage;
