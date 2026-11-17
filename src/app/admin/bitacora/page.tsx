import type { Metadata } from "next";
import { Card, EmptyState, PageTitle } from "@/components/ui/Display";

export const metadata: Metadata = { title: "Bitácora de auditoría" };

// El backend ya registra cada cambio en registro_auditoria (login, ciclos, planes, recomendaciones).
// TODO(HU-03): consultar GET /auditoria cuando exista y mostrar los eventos por día.
const BitacoraPage = () => (
  <>
    <PageTitle
      crumbs={[{ label: "Inicio", href: "/admin/dashboard" }, { label: "Bitácora de auditoría" }]}
      title="Bitácora de auditoría"
      subtitle="Registro inmutable de todos los cambios realizados en el sistema, con usuario y rol."
    />
    <Card>
      <EmptyState icon="reloj" titulo="Sin eventos para mostrar" mensaje="La consulta de la bitácora se habilita con la HU-03. Los cambios ya se están registrando en el sistema." />
    </Card>
  </>
);

export default BitacoraPage;
