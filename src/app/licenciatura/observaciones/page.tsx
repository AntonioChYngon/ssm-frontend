import type { Metadata } from "next";
import { LinkButton } from "@/components/ui/Button";
import { Card, EmptyState, PageTitle } from "@/components/ui/Display";

export const metadata: Metadata = { title: "Observaciones" };

// TODO(HU-05/HU-08): listar las devoluciones reales (observacion_plan / observacion_informe) y permitir
// marcar cada observación como atendida con su respuesta (decisión D4.2).
const ObservacionesPage = () => (
  <>
    <PageTitle
      crumbs={[{ label: "Inicio", href: "/licenciatura/dashboard" }, { label: "Observaciones" }]}
      title="Observaciones del Administrador"
      subtitle="Historial de devoluciones de tu plan y tus informes. Atiende cada observación y vuelve a enviar."
      actions={<LinkButton href="/licenciatura/plan" icon="documento">Ir al plan de mejora</LinkButton>}
    />
    <Card>
      <EmptyState icon="mensaje" titulo="No tienes observaciones" mensaje="Si la Unidad de Planeación devuelve tu plan o tu informe, aquí verás cada observación para atenderla." />
    </Card>
  </>
);

export default ObservacionesPage;
