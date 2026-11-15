// Cliente del API de ssm-backend. Mientras NEXT_PUBLIC_USE_MOCKS=true responde con datos de ejemplo,
// así el front se puede desarrollar sin backend. Cada función documenta el endpoint que consumirá.
import * as mock from "./mock-data";
import type { Hito, InformeResumen, Notificacion, PlanResumen, Rol, Sesion, Usuario } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";
const USE_MOCKS = (process.env.NEXT_PUBLIC_USE_MOCKS ?? "true") === "true";

// Mismos dominios que el CHECK de la tabla usuario y DOMINIOS_PERMITIDOS del backend.
export const DOMINIOS_PERMITIDOS = ["acatlan.unam.mx", "pcpuma.acatlan.unam.mx"] as const;
export const MENSAJE_DOMINIO = "Usa tu correo institucional @acatlan.unam.mx o @pcpuma.acatlan.unam.mx.";

export const esCorreoInstitucional = (correo: string) => {
  const dominio = correo.trim().toLowerCase().split("@")[1] ?? "";
  return DOMINIOS_PERMITIDOS.some((permitido) => dominio === permitido);
};

// La sesión vive en sessionStorage: se borra al cerrar la pestaña (equipos compartidos).
const CLAVE_TOKEN = "ssm.token";
const CLAVE_USUARIO = "ssm.usuario";

export const guardarSesion = (sesion: Sesion) => {
  window.sessionStorage.setItem(CLAVE_TOKEN, sesion.token);
  window.sessionStorage.setItem(CLAVE_USUARIO, JSON.stringify(sesion.usuario));
};

export const leerUsuarioSesion = (): Usuario | null => {
  if (typeof window === "undefined") return null;
  try {
    const guardado = window.sessionStorage.getItem(CLAVE_USUARIO);
    return guardado ? (JSON.parse(guardado) as Usuario) : null;
  } catch {
    return null;
  }
};

export const cerrarSesion = () => {
  window.sessionStorage.removeItem(CLAVE_TOKEN);
  window.sessionStorage.removeItem(CLAVE_USUARIO);
};

export const usaMocks = () => USE_MOCKS;

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const token = typeof window === "undefined" ? null : window.sessionStorage.getItem(CLAVE_TOKEN);
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { message?: string | string[] };
    // ValidationPipe de NestJS responde un arreglo de mensajes; mostramos el primero.
    const mensaje = Array.isArray(body.message) ? body.message[0] : body.message;
    throw new ApiError(response.status, mensaje ?? "No pudimos completar la operación. Intenta de nuevo.");
  }
  return (await response.json()) as T;
};

/** POST /auth/login */
export const login = async (correo: string, contrasena: string): Promise<Sesion> => {
  if (!esCorreoInstitucional(correo)) {
    throw new ApiError(400, MENSAJE_DOMINIO);
  }
  if (!USE_MOCKS) return request<Sesion>("/auth/login", { method: "POST", body: JSON.stringify({ correo, contrasena }) });
  const usuario = mock.USUARIOS.find((u) => u.correo === correo.trim().toLowerCase()) ?? mock.USUARIOS[1];
  return { usuario, token: "mock-token" };
};

/** GET /auth/me: confirma que el token sigue vigente y devuelve el usuario actualizado. */
export const obtenerUsuarioActual = async (): Promise<Usuario> => (USE_MOCKS ? (leerUsuarioSesion() ?? mock.USUARIOS[1]) : request<Usuario>("/auth/me"));

/** POST /auth/recuperar */
export const solicitarRecuperacion = async (correo: string): Promise<void> => {
  if (!esCorreoInstitucional(correo)) throw new ApiError(400, "Ese correo no pertenece al dominio institucional.");
  if (!USE_MOCKS) await request("/auth/recuperar", { method: "POST", body: JSON.stringify({ correo }) });
};

export const rutaInicio = (rol: Rol) => (rol === "ADMINISTRADOR" ? "/admin/dashboard" : "/licenciatura/dashboard");

/** GET /usuarios */
export const listarUsuarios = async (): Promise<Usuario[]> => (USE_MOCKS ? mock.USUARIOS : request<Usuario[]>("/usuarios"));

/** GET /planes */
export const listarPlanes = async (): Promise<PlanResumen[]> => (USE_MOCKS ? mock.PLANES : request<PlanResumen[]>("/planes"));

/** POST /planes/:id/validar  ·  POST /planes/:id/devolver */
export const resolverPlan = async (id: string, accion: "validar" | "devolver", motivo?: string): Promise<void> => {
  if (!USE_MOCKS) await request(`/planes/${id}/${accion}`, { method: "POST", body: JSON.stringify({ motivo }) });
};

/** GET /informes */
export const listarInformes = async (): Promise<InformeResumen[]> => (USE_MOCKS ? mock.INFORMES : request<InformeResumen[]>("/informes"));

/** PUT /recomendaciones/:id/hitos */
export const guardarHitos = async (recomendacionId: string, hitos: Omit<Hito, "id" | "recomendacionId" | "porcentajeReal">[]): Promise<void> => {
  if (!USE_MOCKS) await request(`/recomendaciones/${recomendacionId}/hitos`, { method: "PUT", body: JSON.stringify(hitos) });
};

/** GET /notificaciones */
export const listarNotificaciones = async (): Promise<Notificacion[]> => (USE_MOCKS ? mock.NOTIFICACIONES : request<Notificacion[]>("/notificaciones"));

/** POST /evidencias (multipart). El backend convierte a PDF y devuelve el estado. */
export const subirEvidencia = async (hitoId: string, archivo: File): Promise<void> => {
  if (USE_MOCKS) return;
  const body = new FormData();
  body.append("hitoId", hitoId);
  body.append("archivo", archivo);
  const token = window.sessionStorage.getItem(CLAVE_TOKEN);
  const response = await fetch(`${API_URL}/evidencias`, { method: "POST", body, headers: token ? { Authorization: `Bearer ${token}` } : undefined });
  if (!response.ok) throw new ApiError(response.status, "No se pudo subir el archivo.");
};
