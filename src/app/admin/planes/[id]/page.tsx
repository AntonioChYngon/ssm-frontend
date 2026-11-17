import { DetallePlan } from "./DetallePlan";

// El id es el del ciclo de acreditación (GET /ciclos). Los datos se cargan en el navegador con la sesión.
const DetallePlanPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return <DetallePlan cicloId={id} />;
};

export default DetallePlanPage;
