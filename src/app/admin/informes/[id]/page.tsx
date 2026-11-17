import { LinkButton } from "@/components/ui/Button";
import { Card, EmptyState, PageTitle } from "@/components/ui/Display";

// TODO(HU-08): cargar el informe con GET /informes/:id y mostrar su PDF y las acciones de validar o devolver.
const InformePage = () => (
  <>
    <PageTitle
      crumbs={[{ label: "Inicio", href: "/admin/dashboard" }, { label: "Informes de seguimiento", href: "/admin/informes" }, { label: "Informe" }]}
      title="Informe de seguimiento"
    />
    <Card>
      <EmptyState
        titulo="Informe no disponible"
        mensaje="Este informe no existe todavía. La revisión de informes se habilita con la HU-08."
        action={<LinkButton href="/admin/informes" variant="contorno" icon="flecha-izquierda">Volver a informes</LinkButton>}
      />
    </Card>
  </>
);

export default InformePage;
