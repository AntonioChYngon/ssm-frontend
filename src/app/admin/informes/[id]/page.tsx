import { notFound } from "next/navigation";
import { INFORMES } from "@/lib/mock-data";
import { ValidacionInforme } from "./ValidacionInforme";

export const generateStaticParams = () => INFORMES.map((i) => ({ id: i.id }));

const ValidacionInformePage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const informe = INFORMES.find((i) => i.id === id);
  if (!informe) notFound();
  return <ValidacionInforme informe={informe} />;
};

export default ValidacionInformePage;
