import type { IconName } from "@/components/ui/Icon";
import type { Rol } from "./types";

export type NavItem = { label: string; href: string; icon: IconName };
export type NavSection = { title: string; items: NavItem[] };

const ADMIN: NavSection[] = [
  { title: "GENERAL", items: [
    { label: "Dashboard global", href: "/admin/dashboard", icon: "grafica" },
    { label: "Gestión de usuarios", href: "/admin/usuarios", icon: "usuarios" },
    { label: "Ciclos de acreditación", href: "/admin/ciclos", icon: "calendario" },
  ] },
  { title: "VALIDACIÓN", items: [
    { label: "Planes de mejora", href: "/admin/planes", icon: "documento" },
    { label: "Informes de seguimiento", href: "/admin/informes", icon: "carpeta" },
  ] },
  { title: "REPORTES", items: [
    { label: "Incumplimiento", href: "/admin/reportes/incumplimiento", icon: "tendencia-baja" },
    { label: "Resumen de atención", href: "/admin/reportes/atencion", icon: "pastel" },
    { label: "Histórico por ciclo", href: "/admin/historico", icon: "archivo" },
    { label: "Recomendaciones", href: "/admin/transversales", icon: "capas" },
    { label: "Bitácora de auditoría", href: "/admin/bitacora", icon: "reloj" },
  ] },
];

const LICENCIATURA: NavItem[] = [
  { label: "Dashboard", href: "/licenciatura/dashboard", icon: "grafica" },
  { label: "Plan de mejora", href: "/licenciatura/plan", icon: "documento" },
  { label: "Configuración de metas", href: "/licenciatura/metas", icon: "objetivo" },
  // HU-07/HU-08: captura, evidencias y observaciones de la Administración en una sola pantalla.
  { label: "Informe de seguimiento", href: "/licenciatura/informe", icon: "carpeta" },
];

// Captura y Auxiliar tienen las mismas opciones en el Plan de Mejora (captura, envío y configuración de metas).
export const navPorRol = (rol: Rol): NavSection[] => {
  if (rol === "ADMINISTRADOR") return ADMIN;
  return [{ title: "MI LICENCIATURA", items: LICENCIATURA }];
};
