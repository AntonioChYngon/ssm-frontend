import { VisorEvidencia } from "./VisorEvidencia";

// HU-09 · Destino de los hipervínculos de los reportes exportados para evidencias guardadas en el sistema.
const EvidenciaPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return <VisorEvidencia id={id} />;
};

export default EvidenciaPage;
