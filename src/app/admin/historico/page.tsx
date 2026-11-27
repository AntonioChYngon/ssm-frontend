"use client";

// HU-16 · Archivo histórico del Administrador: cualquier licenciatura y ciclo.
import { ConsultaHistorica } from "@/components/historico/ConsultaHistorica";
import { PageTitle } from "@/components/ui/Display";

const HistoricoPage = () => (
  <>
    <PageTitle
      crumbs={[{ label: "Inicio", href: "/admin/dashboard" }, { label: "Reportes" }, { label: "Histórico por ciclo" }]}
      title="Histórico por ciclo de acreditación"
      subtitle="Planes de Mejora, Informes de Seguimiento y resultados de ciclos anteriores, sin modificar los datos."
    />
    <ConsultaHistorica esAdmin />
  </>
);

export default HistoricoPage;
