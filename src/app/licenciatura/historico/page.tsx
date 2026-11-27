"use client";

// HU-16 · Archivo histórico de la coordinación: los ciclos de su licenciatura, en solo lectura.
import { ConsultaHistorica } from "@/components/historico/ConsultaHistorica";
import { PageTitle } from "@/components/ui/Display";

const HistoricoLicenciaturaPage = () => (
  <>
    <PageTitle
      crumbs={[{ label: "Inicio", href: "/licenciatura/dashboard" }, { label: "Histórico" }]}
      title="Histórico de mi licenciatura"
      subtitle="Consulta los Planes de Mejora e Informes de Seguimiento de ciclos de acreditación anteriores."
    />
    <ConsultaHistorica esAdmin={false} />
  </>
);

export default HistoricoLicenciaturaPage;
