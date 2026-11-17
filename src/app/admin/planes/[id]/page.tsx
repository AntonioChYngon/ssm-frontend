import { ValidacionPlan } from "./ValidacionPlan";

// El plan se consulta en el navegador (GET /planes/:id) con la sesión del Administrador.
const ValidacionPlanPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return <ValidacionPlan id={id} />;
};

export default ValidacionPlanPage;
