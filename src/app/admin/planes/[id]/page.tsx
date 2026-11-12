import { notFound } from "next/navigation";
import { PLANES } from "@/lib/mock-data";
import { ValidacionPlan } from "./ValidacionPlan";

export const generateStaticParams = () => PLANES.map((p) => ({ id: p.id }));

const ValidacionPlanPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const plan = PLANES.find((p) => p.id === id);
  if (!plan) notFound();
  return <ValidacionPlan plan={plan} />;
};

export default ValidacionPlanPage;
