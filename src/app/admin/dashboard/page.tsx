"use client";

// Panorama de la Administradora calculado con los ciclos reales (GET /ciclos). Sin datos simulados:
// los bloques de avance, vencimientos y actividad se llenan cuando existan informes, hitos y bitácora.
import { useEffect, useState } from "react";
import { LinkButton } from "@/components/ui/Button";
import { Donut, Legend } from "@/components/ui/Charts";
import { Alert, Card, EmptyState, KpiCard, PageTitle } from "@/components/ui/Display";
import { ApiError, listarCiclos, obtenerCatalogos } from "@/lib/api";
import type { CicloResumen } from "@/lib/types";

const hoy = () => new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", year: "numeric" }).format(new Date());

const DashboardGlobalPage = () => {
  const [ciclos, setCiclos] = useState<CicloResumen[]>([]);
  const [totalLicenciaturas, setTotalLicenciaturas] = useState(0);
  const [error, setError] = useState<string>();
  const [fecha, setFecha] = useState("");

  useEffect(() => {
    setFecha(hoy());
    listarCiclos().then(setCiclos).catch((e) => setError(e instanceof ApiError ? e.message : "No pudimos cargar el panorama."));
    obtenerCatalogos().then((c) => setTotalLicenciaturas(c.licenciaturas.length)).catch(() => setTotalLicenciaturas(0));
  }, []);

  const vigentes = ciclos.filter((c) => c.estado === "VIGENTE");
  const contar = (f: (c: CicloResumen) => boolean) => vigentes.filter(f).length;
  const estados = [
    { label: "Validados", valor: contar((c) => c.plan?.estado === "APROBADO"), color: "var(--color-success)" },
    { label: "En revisión", valor: contar((c) => c.plan?.estado === "EN_REVISION"), color: "var(--color-primary)" },
    { label: "Devueltos", valor: contar((c) => c.plan?.estado === "DEVUELTO"), color: "var(--color-danger)" },
    { label: "Borrador", valor: contar((c) => c.plan?.estado === "BORRADOR"), color: "var(--color-gray-400)" },
    { label: "Sin captura", valor: contar((c) => c.plan === null), color: "var(--color-gray-200)" },
  ];
  const valor = (label: string) => estados.find((e) => e.label === label)?.valor ?? 0;
  const conPlan = vigentes.length - valor("Sin captura");

  return (
    <>
      <PageTitle
        title="Dashboard global"
        subtitle={fecha ? `Panorama de todas las licenciaturas al ${fecha}.` : "Panorama de todas las licenciaturas."}
        actions={<LinkButton href="/admin/planes" icon="mas">Registrar ciclo de acreditación</LinkButton>}
      />
      {error && <Alert tipo="error">{error}</Alert>}
      <div className="grid-4">
        <KpiCard tono="azul" titulo="Ciclos vigentes" valor={String(vigentes.length)} detalle={`de ${totalLicenciaturas} licenciaturas`} icon="calendario" />
        <KpiCard tono="verde" titulo="Planes validados" valor={String(valor("Validados"))} detalle={`de ${conPlan} planes capturados`} icon="check" />
        <KpiCard tono="naranja" titulo="Por validar" valor={String(valor("En revisión"))} detalle="planes enviados a revisión" icon="reloj" />
        <KpiCard tono="rojo" titulo="Sin captura" valor={String(valor("Sin captura"))} detalle="ciclos sin recomendaciones" icon="alerta" />
      </div>
      <div className="row row--top row--responsive" style={{ gap: 24 }}>
        <Card title="Avance real vs. esperado" subtitle="Cumplimiento de hitos por licenciatura" className="grow">
          <EmptyState icon="grafica" titulo="Sin avances registrados" mensaje="El avance aparecerá cuando las coordinaciones configuren hitos y capturen su Informe de Seguimiento." />
        </Card>
        <Card title="Estado de los planes" className="side-340">
          <Donut segmentos={estados} centro={String(vigentes.length)} subtitulo="ciclos vigentes" />
          <div className="stack" style={{ gap: 10 }}>
            {estados.map((e) => <Legend key={e.label} color={e.color} label={e.label} valor={e.valor} />)}
          </div>
        </Card>
      </div>
      <div className="row row--top row--responsive" style={{ gap: 24 }}>
        <Card title="Vencimientos próximos" className="grow" actions={<LinkButton href="/admin/reportes/incumplimiento" variant="texto" icon="chevron-derecha">Ver reporte</LinkButton>}>
          <EmptyState icon="reloj" titulo="Sin vencimientos próximos" mensaje="Los hitos por vencer de todas las licenciaturas aparecerán aquí." />
        </Card>
        <Card title="Actividad reciente" className="side-380">
          <EmptyState icon="reloj" titulo="Sin actividad todavía" mensaje="Los movimientos de los usuarios se consultan en la Bitácora de auditoría." />
        </Card>
      </div>
    </>
  );
};

export default DashboardGlobalPage;
