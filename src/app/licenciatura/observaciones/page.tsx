import { redirect } from "next/navigation";

// Las observaciones de la Administración se ven junto a cada recomendación: en el Plan de Mejora (HU-05) y en el
// Informe de Seguimiento (HU-08). Esta dirección antigua lleva al informe.
const ObservacionesPage = () => redirect("/licenciatura/informe");

export default ObservacionesPage;
