"use client";

import { useEffect, useState } from "react";
import { SelectorLicenciaturas, useLicenciaturasEnUrl } from "@/components/filtros/SelectorLicenciaturas";
import { LinkButton } from "@/components/ui/Button";
import { Alert, Badge, DataTable, PageTitle, Progress } from "@/components/ui/Display";
import { SelectField, TextField } from "@/components/ui/Field";
import { ChipGroup } from "@/components/ui/Interactive";
import { ApiError, listarPlanes } from "@/lib/api";
import { ESTADO_PLAN_BADGE, type EstadoPlan, type PlanResumen } from "@/lib/types";

const FILTROS: { label: string; estado: EstadoPlan | null }[] = [
  { label: "Todos", estado: null },
  { label: "En validación", estado: "EN_REVISION" },
  { label: "Devueltos", estado: "DEVUELTO" },
  { label: "Validados", estado: "APROBADO" },
  { label: "Borrador", estado: "BORRADOR" },
];

const TODOS_CICLOS = "Todos los ciclos";
const TODOS_ORGANISMOS = "Todos";

const PlanesPage = () => {
  const [planes, setPlanes] = useState<PlanResumen[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [estado, setEstado] = useState<EstadoPlan | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [ciclo, setCiclo] = useState(TODOS_CICLOS);
  const [organismo, setOrganismo] = useState(TODOS_ORGANISMOS);

  // HU-13: una, varias o todas las licenciaturas (se guarda en la URL).
  const licenciaturas = useLicenciaturasEnUrl();

  useEffect(() => {
    if (!licenciaturas.listo) return;
    setCargando(true);
    listarPlanes(licenciaturas.parametro)
      .then(setPlanes)
      .catch((e) => setError(e instanceof ApiError ? e.message : "No pudimos cargar los planes."))
      .finally(() => setCargando(false));
  }, [licenciaturas.listo, licenciaturas.parametro]);

  const opciones = FILTROS.map((f) => `${f.label} (${f.estado ? planes.filter((p) => p.estado === f.estado).length : planes.length})`);
  const ciclos = [TODOS_CICLOS, ...new Set(planes.map((p) => p.ciclo))];
  const organismos = [TODOS_ORGANISMOS, ...new Set(planes.map((p) => p.organismo))];
  const visibles = planes.filter(
    (p) =>
      (!estado || p.estado === estado) &&
      (ciclo === TODOS_CICLOS || p.ciclo === ciclo) &&
      (organismo === TODOS_ORGANISMOS || p.organismo === organismo) &&
      `${p.licenciatura} ${p.organismo}`.toLowerCase().includes(busqueda.toLowerCase()),
  );

  return (
    <>
      <PageTitle
        crumbs={[{ label: "Inicio", href: "/admin/dashboard" }, { label: "Planes de mejora" }]}
        title="Planes de mejora"
        subtitle="Todos los planes registrados por las licenciaturas. Selecciona uno para revisarlo y validarlo."
      />
      <div className="row row--end row--responsive">
        <SelectorLicenciaturas seleccion={licenciaturas.ids} alCambiar={licenciaturas.cambiar} />
        <div className="grow"><TextField label="Buscar" icon="buscar" placeholder="Licenciatura u organismo acreditador" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} /></div>
        <div style={{ width: 200 }}><SelectField label="Ciclo" options={ciclos} value={ciclo} onChange={(e) => setCiclo(e.target.value)} /></div>
        <div style={{ width: 240 }}><SelectField label="Organismo acreditador" options={organismos} value={organismo} onChange={(e) => setOrganismo(e.target.value)} /></div>
      </div>
      {/* key: vuelve a montar los chips cuando llegan los conteos (ChipGroup guarda su selección internamente). */}
      <ChipGroup key={cargando ? "cargando" : "listo"} label="Filtrar por estado" options={opciones} onChange={(o) => setEstado(FILTROS[opciones.indexOf(o)]?.estado ?? null)} />
      {error && <Alert tipo="error">{error}</Alert>}
      {cargando ? (
        <p className="t-muted">Cargando planes…</p>
      ) : (
        <DataTable<PlanResumen>
          caption="Planes de mejora"
          rows={visibles}
          rowKey={(p) => p.id}
          columns={[
            { header: "Licenciatura", render: (p) => <span className="t-medium">{p.licenciatura}</span> },
            { header: "Organismo", width: 120, render: (p) => p.organismo },
            { header: "Ciclo", width: 110, render: (p) => p.ciclo },
            { header: "Recomend.", width: 110, render: (p) => p.recomendaciones },
            { header: "Avance", width: 190, render: (p) => <Progress value={p.avance} width={110} /> },
            { header: "Estado", width: 150, render: (p) => <Badge estado={ESTADO_PLAN_BADGE[p.estado]} /> },
            { header: "Actualizado", width: 130, render: (p) => p.actualizado },
            { header: "Acción", width: 140, render: (p) => p.estado === "EN_REVISION"
              ? <LinkButton href={`/admin/planes/${p.id}`} icon="check">Revisar</LinkButton>
              : <LinkButton href={`/admin/planes/${p.id}`} variant="contorno" icon="ver">Ver</LinkButton> },
          ]}
        />
      )}
      <span className="t-small t-muted">Mostrando {visibles.length} de {planes.length} planes</span>
    </>
  );
};

export default PlanesPage;
