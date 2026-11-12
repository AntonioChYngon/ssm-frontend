"use client";

import { useState } from "react";
import { Button, LinkButton } from "@/components/ui/Button";
import { Badge, DataTable, PageTitle, Progress } from "@/components/ui/Display";
import { SelectField, TextField } from "@/components/ui/Field";
import { ChipGroup } from "@/components/ui/Interactive";
import { PLANES } from "@/lib/mock-data";
import { ESTADO_DOCUMENTO_BADGE, type EstadoDocumento, type PlanResumen } from "@/lib/types";

const FILTROS: Record<string, EstadoDocumento | null> = {
  "Todos (18)": null,
  "En revisión (3)": "EN_REVISION",
  "Devueltos (2)": "DEVUELTO",
  "Validados (11)": "VALIDADO",
  "Borrador (2)": "BORRADOR",
};

const PlanesPage = () => {
  const [filtro, setFiltro] = useState("Todos (18)");
  const [busqueda, setBusqueda] = useState("");
  const estado = FILTROS[filtro] ?? null;
  const visibles = PLANES.filter((p) => (!estado || p.estado === estado) && `${p.licenciatura} ${p.organismo}`.toLowerCase().includes(busqueda.toLowerCase()));

  return (
    <>
      <PageTitle
        crumbs={[{ label: "Inicio", href: "/admin/dashboard" }, { label: "Planes de mejora" }]}
        title="Planes de mejora"
        subtitle="Todos los planes registrados por las licenciaturas. Selecciona uno para revisarlo y validarlo."
        actions={<Button variant="contorno" icon="descargar">Exportar</Button>}
      />
      <div className="row row--end row--responsive">
        <div className="grow"><TextField label="Buscar" icon="buscar" placeholder="Licenciatura u organismo acreditador" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} /></div>
        <div style={{ width: 200 }}><SelectField label="Ciclo" options={["2024 – 2029", "2019 – 2024"]} /></div>
        <div style={{ width: 240 }}><SelectField label="Organismo acreditador" options={["Todos", "CONAC", "CONAED", "CONACE", "CONAIC", "CACEI", "ANPADEH", "ACCECISO"]} /></div>
      </div>
      <ChipGroup label="Filtrar por estado" options={Object.keys(FILTROS)} onChange={setFiltro} />
      <DataTable<PlanResumen>
        caption="Planes de mejora"
        rows={visibles}
        rowKey={(p) => p.id}
        columns={[
          { header: "Licenciatura", render: (p) => <span className="t-medium">{p.licenciatura}</span> },
          { header: "Organismo", width: 120, render: (p) => p.organismo },
          { header: "Recomend.", width: 110, render: (p) => p.recomendaciones },
          { header: "Avance", width: 190, render: (p) => <Progress value={p.avance} width={110} /> },
          { header: "Estado", width: 140, render: (p) => <Badge estado={ESTADO_DOCUMENTO_BADGE[p.estado]} /> },
          { header: "Actualizado", width: 130, render: (p) => p.actualizado },
          { header: "Acción", width: 140, render: (p) => p.estado === "EN_REVISION"
            ? <LinkButton href={`/admin/planes/${p.id}`} icon="check">Revisar</LinkButton>
            : <LinkButton href={`/admin/planes/${p.id}`} variant="contorno" icon="ver">Ver</LinkButton> },
        ]}
      />
      <div className="row">
        <span className="t-small t-muted">Mostrando {visibles.length} de 18 planes</span>
        <span className="spacer" />
        <Button variant="contorno" icon="flecha-izquierda" disabled>Anterior</Button>
        <Button variant="contorno" icon="chevron-derecha">Siguiente</Button>
      </div>
    </>
  );
};

export default PlanesPage;
