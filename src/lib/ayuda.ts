// HU-19 y HU-20 · Contenido del Centro de ayuda. Este archivo es el único que hay que editar para completar
// el manual digital, los videotutoriales y el manual impreso; la pantalla /ayuda se arma sola a partir de aquí.
import type { Rol } from "./types";

export type SeccionManual = {
  /** Ancla en la URL (/ayuda#inicio-de-sesion). Sin espacios ni acentos. */
  id: string;
  titulo: string;
  /** Roles que ven la sección (contenido adaptado por perfil). */
  roles: readonly Rol[];
  resumen: string;
  /** Pasos o párrafos del manual. Vacío = "En preparación". */
  contenido: readonly string[];
};

export type Videotutorial = {
  titulo: string;
  /** Tema o sección del manual a la que pertenece (agrupa la lista). */
  tema: string;
  /** URL para insertar: YouTube "https://www.youtube-nocookie.com/embed/<id>" o Vimeo "https://player.vimeo.com/video/<id>". */
  urlInsertar: string;
  /** Duración visible, p. ej. "3:20". */
  duracion: string;
  roles: readonly Rol[];
};

const TODOS: readonly Rol[] = ["ADMINISTRADOR", "CAPTURA", "AUXILIAR"];
const COORDINACION: readonly Rol[] = ["CAPTURA", "AUXILIAR"];
const ADMIN: readonly Rol[] = ["ADMINISTRADOR"];

export const SECCIONES_MANUAL: readonly SeccionManual[] = [
  { id: "inicio-de-sesion", titulo: "Inicio de sesión y cuenta", roles: TODOS, resumen: "Entrar con tu correo institucional, cambiar la contraseña temporal y recuperar el acceso.", contenido: [] },
  { id: "captura-del-plan", titulo: "Captura del Plan de Mejora", roles: COORDINACION, resumen: "Registrar recomendaciones, acciones, metas con fecha y % esperado, y enviar el plan a revisión.", contenido: [] },
  { id: "carga-de-evidencias", titulo: "Informe de Seguimiento y carga de evidencias", roles: COORDINACION, resumen: "Capturar el % de avance de cada semestre, subir evidencias y enviar el informe.", contenido: [] },
  { id: "recordatorios", titulo: "Recordatorios y avisos", roles: COORDINACION, resumen: "Qué significan los avisos de fecha límite y de rezago, y dónde consultarlos.", contenido: [] },
  { id: "validacion", titulo: "Revisión y validación", roles: ADMIN, resumen: "Revisar planes e informes, devolverlos con observaciones o validarlos.", contenido: [] },
  { id: "usuarios-y-ciclos", titulo: "Usuarios y ciclos de acreditación", roles: ADMIN, resumen: "Dar de alta cuentas, restablecer contraseñas y registrar los ciclos de cada licenciatura.", contenido: [] },
  { id: "reportes", titulo: "Consultas y reportes", roles: ADMIN, resumen: "Resumen de atención, incumplimiento, recomendaciones transversales, histórico y bitácora.", contenido: [] },
  { id: "exportacion", titulo: "Exportación de reportes", roles: TODOS, resumen: "Descargar el Plan de Mejora y el Informe de Seguimiento en PDF y Word.", contenido: [] },
];

/** Videotutoriales embebidos. Usen videos "no listados" y sin datos reales de personas. */
export const VIDEOTUTORIALES: readonly Videotutorial[] = [];

/** HU-20 · Manual impreso: dejen el PDF en public/manual/manual-usuario-ssm.pdf y cambien `disponible` a true. */
export const MANUAL_IMPRESO = { disponible: false, ruta: "/manual/manual-usuario-ssm.pdf", nombre: "Manual_de_usuario_SSM.pdf" } as const;

export const seccionesPara = (rol: Rol) => SECCIONES_MANUAL.filter((s) => s.roles.includes(rol));
export const videosPara = (rol: Rol) => VIDEOTUTORIALES.filter((v) => v.roles.includes(rol));
