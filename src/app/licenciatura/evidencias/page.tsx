import { redirect } from "next/navigation";

// La carga de evidencias ahora vive en el informe de seguimiento (HU-07), junto al avance de cada recomendación.
const EvidenciasPage = () => redirect("/licenciatura/informe");

export default EvidenciasPage;
