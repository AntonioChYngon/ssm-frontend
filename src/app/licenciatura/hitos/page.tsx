import { redirect } from "next/navigation";

// "Configuración de hitos" ahora es "Configuración de metas". Se conserva la ruta para enlaces anteriores.
const HitosPage = () => redirect("/licenciatura/metas");

export default HitosPage;
