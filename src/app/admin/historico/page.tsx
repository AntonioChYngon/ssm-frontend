"use client";

// Histórico por ciclo de acreditación: los ciclos reales (GET /ciclos), identificados por la fecha de emisión de la constancia.
import { useEffect, useState } from "react";
import { LinkButton } from "@/components/ui/Button";
import { Alert, Badge, Card, DataTable, EmptyState, PageTitle } from "@/components/ui/Display";
import { SelectField } from "@/components/ui/Field";
import { ApiError, listarCiclos } from "@/lib/api";
import { fechaCorta } from "@/lib/reglas";
import { ESTADO_VERSION_BADGE, type CicloResumen } from "@/lib/types";

const TODAS = "Todas las licenciaturas";
const TODOS = "Todos";
const ESTADO_CICLO = { VIGENTE: "Vigente", CERRADO: "Concluido", HISTORICO: "Histórico" } as const;

const HistoricoPage = () => {
  const [ciclos, setCiclos] = useState<CicloResumen[]>([]);
  const [error, setError] = useState<string>();
  const [licenciatura, setLicenciatura] = useState(TODAS);
  const [organismo, setOrganismo] = useState(TODOS);

  useEffect(() => {
    listarCiclos().then(setCiclos).catch((e) => setError(e instanceof ApiError ? e.message : "No pudimos cargar el histórico."));
  }, []);

  const licenciaturas = [...new Set(ciclos.map((c) => c.licenciatura.nombre))].sort((a, b) => a.localeCompare(b, "es"));
  const organismos = [...new Set(ciclos.map((c) => c.organismo.nombre))].sort((a, b) => a.localeCompare(b, "es"));
  const visibles = ciclos.filter((c) => (licenciatura === TODAS || c.licenciatura.nombre === licenciatura) && (organismo === TODOS || c.organismo.nombre === organismo));

  return (
    <>
      <PageTitle
        crumbs={[{ label: "Inicio", href: "/admin/dashboard" }, { label: "Reportes" }, { label: "Histórico por ciclo" }]}
        title="Histórico por ciclo de acreditación"
        subtitle="Cada ciclo se identifica por la fecha en que el organismo o IEVA emitió la constancia."
      />
      {error && <Alert tipo="error">{error}</Alert>}
      <div className="row row--end row--responsive">
        <div className="grow"><SelectField label="Licenciatura" options={[TODAS, ...licenciaturas]} value={licenciatura} onChange={(e) => setLicenciatura(e.target.value)} /></div>
        <div className="grow"><SelectField label="Organismo acreditador" options={[TODOS, ...organismos]} value={organismo} onChange={(e) => setOrganismo(e.target.value)} /></div>
      </div>
      {visibles.length === 0 ? (
        <Card>
          <EmptyState icon="archivo" titulo="Sin ciclos registrados" mensaje="Los ciclos de acreditación que registres en Planes de mejora formarán el histórico." />
        </Card>
      ) : (
        <DataTable<CicloResumen>
          caption="Ciclos de acreditación"
          rows={visibles}
          rowKey={(c) => c.id}
          columns={[
            { header: "Licenciatura", render: (c) => <span className="t-medium">{c.licenciatura.nombre}</span> },
            { header: "Organismo", width: 220, render: (c) => c.organismo.nombre },
            { header: "Emisión", width: 120, render: (c) => fechaCorta(c.fechaEmision) },
            { header: "Vigencia", width: 190, render: (c) => `${fechaCorta(c.vigenciaInicio)} – ${fechaCorta(c.vigenciaFin)}` },
            { header: "Ciclo", width: 120, render: (c) => <Badge estado={c.estado === "VIGENTE" ? "Nuevo" : "Borrador"}>{ESTADO_CICLO[c.estado]}</Badge> },
            { header: "Plan", width: 150, render: (c) => (c.plan ? <Badge estado={ESTADO_VERSION_BADGE[c.plan.estado]} /> : <span className="t-muted">Sin captura</span>) },
            { header: "Expediente", width: 150, render: (c) => <LinkButton href={`/admin/planes/${c.id}`} variant="contorno" icon="ver">Ver plan</LinkButton> },
          ]}
        />
      )}
    </>
  );
};

export default HistoricoPage;
