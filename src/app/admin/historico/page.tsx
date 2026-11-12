import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Badge, DataTable, PageTitle, Progress } from "@/components/ui/Display";
import { SelectField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { HISTORICO, LICENCIATURAS } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Histórico por ciclo" };

const CICLOS = [
  { ciclo: "2014 – 2019", estado: "Concluido", detalle: "16 planes · 92% atendido", activo: false },
  { ciclo: "2019 – 2024", estado: "Concluido", detalle: "18 planes · 87% atendido", activo: true },
  { ciclo: "2024 – 2029", estado: "Vigente", detalle: "18 planes · 49% atendido", activo: false },
];

type Fila = (typeof HISTORICO)[number];

const HistoricoPage = () => (
  <>
    <PageTitle
      crumbs={[{ label: "Inicio", href: "/admin/dashboard" }, { label: "Reportes" }, { label: "Histórico por ciclo" }]}
      title="Histórico por ciclo de acreditación"
      subtitle="Consulta planes y resultados de ciclos anteriores."
      actions={<Button variant="contorno" icon="descargar">Exportar</Button>}
    />
    <div className="row row--end row--responsive">
      <div className="grow"><SelectField label="Vigencia" options={["2019 – 2024 (concluido)", "2014 – 2019 (concluido)", "2024 – 2029 (vigente)"]} /></div>
      <div className="grow"><SelectField label="Licenciatura" options={["Todas las licenciaturas", ...LICENCIATURAS]} /></div>
      <div className="grow"><SelectField label="Organismo acreditador" options={["Todos", "CONAC", "CONAED", "CONACE", "CACEI", "ANPADEH", "ACCECISO"]} /></div>
    </div>
    <div className="grid-3">
      {CICLOS.map((c) => (
        <div key={c.ciclo} className="card" style={{ padding: "16px 20px", gap: 6, background: c.activo ? "var(--color-primary)" : undefined, color: c.activo ? "var(--color-white)" : undefined, border: c.activo ? "2px solid var(--color-primary)" : "1px solid var(--color-gray-200)", boxShadow: "none" }}>
          <div className="row" style={{ gap: 8 }}>
            <Icon name="calendario" size={20} className={c.activo ? "t-accent" : "t-primary"} />
            <span className="t-h3 grow">{c.ciclo}</span>
            <Badge estado={c.estado === "Vigente" ? "Nuevo" : "Borrador"}>{c.estado}</Badge>
          </div>
          <span className={c.activo ? "" : "t-muted"}>{c.detalle}</span>
        </div>
      ))}
    </div>
    <DataTable<Fila>
      caption="Planes del ciclo 2019 – 2024"
      rows={HISTORICO}
      rowKey={(h) => h.licenciatura}
      columns={[
        { header: "Licenciatura", render: (h) => <span className="t-medium">{h.licenciatura}</span> },
        { header: "Organismo", width: 130, render: (h) => h.organismo },
        { header: "Recomend.", width: 110, render: (h) => h.recomendaciones },
        { header: "Atendidas", width: 180, render: (h) => <Progress value={h.atendidas} width={90} /> },
        { header: "Resultado", width: 190, render: (h) => <Badge estado={h.resultado === "Reacreditada" ? "Validado" : "Pendiente"}>{h.resultado}</Badge> },
        { header: "Expediente", width: 200, render: () => <Button variant="contorno" icon="archivo">Ver expediente</Button> },
      ]}
    />
  </>
);

export default HistoricoPage;
