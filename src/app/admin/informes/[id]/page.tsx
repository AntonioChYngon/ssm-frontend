import { RevisionInforme } from "./RevisionInforme";

// El informe se consulta en el navegador (GET /informes/:id) con la sesión del Administrador.
const RevisionInformePage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return <RevisionInforme id={id} />;
};

export default RevisionInformePage;
