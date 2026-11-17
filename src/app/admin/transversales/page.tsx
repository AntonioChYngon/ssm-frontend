import type { Metadata } from "next";
import { Card, EmptyState, PageTitle } from "@/components/ui/Display";

export const metadata: Metadata = { title: "Recomendaciones transversales" };

// TODO: etiquetar y agrupar las recomendaciones reales de los planes (requiere endpoint de etiquetas).
const TransversalesPage = () => (
  <>
    <PageTitle
      crumbs={[{ label: "Inicio", href: "/admin/dashboard" }, { label: "Reportes" }, { label: "Recomendaciones transversales" }]}
      title="Recomendaciones transversales"
      subtitle="Etiqueta y agrupa recomendaciones que se repiten en varias licenciaturas para atenderlas de forma conjunta."
    />
    <div className="row row--top row--responsive" style={{ gap: 24 }}>
      <Card title="Etiquetas" className="side-340">
        <p className="t-small t-muted" style={{ margin: 0 }}>Aún no hay etiquetas.</p>
      </Card>
      <Card className="grow">
        <EmptyState icon="capas" titulo="Sin recomendaciones agrupadas" mensaje="Cuando las licenciaturas capturen sus planes, aquí podrás agrupar las recomendaciones que se repiten." />
      </Card>
    </div>
  </>
);

export default TransversalesPage;
