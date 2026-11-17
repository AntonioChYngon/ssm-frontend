import type { Metadata } from "next";
import { Button, LinkButton } from "@/components/ui/Button";
import { Badge, DataTable, KpiCard, PageTitle } from "@/components/ui/Display";
import { SelectField, TextField } from "@/components/ui/Field";
import { INFORMES } from "@/lib/mock-data";
import { ESTADO_DOCUMENTO_BADGE, type InformeResumen } from "@/lib/types";

export const metadata: Metadata = { title: "Informes de seguimiento" };

const InformesPage = () => (
  <>
    <PageTitle
      crumbs={[{ label: "Inicio", href: "/admin/dashboard" }, { label: "Informes de seguimiento" }]}
      title="Informes de seguimiento"
      subtitle="Informes periódicos que reportan el avance de cada plan validado."
      actions={<Button variant="contorno" icon="descargar">Exportar</Button>}
    />
    <div className="grid-4">
      <KpiCard tono="azul" titulo="Informes recibidos" valor="9" detalle="periodo 2026-2" icon="documento" />
      <KpiCard tono="naranja" titulo="Por revisar" valor="2" detalle="el más antiguo hace 4 días" icon="reloj" />
      <KpiCard tono="rojo" titulo="Devueltos" valor="1" detalle="esperando corrección" icon="mensaje" />
      <KpiCard tono="verde" titulo="Validados" valor="6" detalle="67% del periodo" icon="check" />
    </div>
    <div className="row row--end row--responsive">
      <div className="grow"><TextField label="Buscar" icon="buscar" placeholder="Licenciatura" /></div>
      <div style={{ width: 180 }}><SelectField label="Periodo" options={["2026-2", "2026-1", "2025-2"]} /></div>
      <div style={{ width: 200 }}><SelectField label="Estado" options={["Todos", "En revisión", "Devuelto", "Validado"]} /></div>
    </div>
    <DataTable<InformeResumen>
      caption="Informes de seguimiento"
      rows={INFORMES}
      rowKey={(i) => i.id}
      columns={[
        { header: "Licenciatura", render: (i) => <span className="t-medium">{i.licenciatura}</span> },
        { header: "Periodo", width: 120, render: (i) => i.periodo },
        { header: "Metas reportadas", width: 170, render: (i) => `${i.metasReportadas} / ${i.metasTotales}` },
        { header: "Fecha de envío", width: 160, render: (i) => i.fechaEnvio },
        { header: "Estado", width: 140, render: (i) => <Badge estado={ESTADO_DOCUMENTO_BADGE[i.estado]} /> },
        { header: "Acción", width: 140, render: (i) => i.estado === "EN_REVISION"
          ? <LinkButton href={`/admin/informes/${i.id}`} icon="check">Revisar</LinkButton>
          : <LinkButton href={`/admin/informes/${i.id}`} variant="contorno" icon="ver">Ver</LinkButton> },
      ]}
    />
  </>
);

export default InformesPage;
