import type { IconName } from "@/components/ui/Icon";
import type { Rol } from "./types";

export type NavItem = { label: string; href: string; icon: IconName };
export type NavSection = { title: string; items: NavItem[] };

const ADMIN: NavSection[] = [
  { title: "GENERAL", items: [
    { label: "Dashboard global", href: "/admin/dashboard", icon: "grafica" },
    { label: "Gestión de usuarios", href: "/admin/usuarios", icon: "usuarios" },
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
  { label: "Configuración de hitos", href: "/licenciatura/hitos", icon: "objetivo" },
  { label: "Carga de evidencias", href: "/licenciatura/evidencias", icon: "carpeta" },
  { label: "Observaciones", href: "/licenciatura/observaciones", icon: "mensaje" },
];

// El Auxiliar colabora con el Capturista pero no configura hitos (reglas de roles del SSM).
export const navPorRol = (rol: Rol): NavSection[] => {
  if (rol === "ADMINISTRADOR") return ADMIN;
  const items = rol === "AUXILIAR" ? LICENCIATURA.filter((item) => item.href !== "/licenciatura/hitos") : LICENCIATURA;
  return [{ title: "MI LICENCIATURA", items }];
};
