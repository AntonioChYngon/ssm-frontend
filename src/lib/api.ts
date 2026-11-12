// Cliente del API de ssm-backend. Mientras NEXT_PUBLIC_USE_MOCKS=true responde con datos de ejemplo,
// así el front se puede desarrollar sin backend. Cada función documenta el endpoint que consumirá.
import * as mock from "./mock-data";
import type { Hito, InformeResumen, Notificacion, PlanResumen, Rol, Sesion, Usuario } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";
const USE_MOCKS = (process.env.NEXT_PUBLIC_USE_MOCKS ?? "true") === "true";

export const DOMINIOS_PERMITIDOS = ["acatlan.unam.mx", "unam.mx"] as const;

export const esCorreoInstitucional = (correo: string) => {
  const dominio = correo.trim().toLowerCase().split("@")[1] ?? "";
  return DOMINIOS_PERMITIDOS.some((permitido) => dominio === permitido || dominio.endsWith(`.${permitido}`));
};

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const token = typeof window === "undefined" ? null : window.sessionStorage.getItem("ssm.token");
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { message?: string };
    throw new ApiError(response.status, body.message ?? "No pudimos completar la operación. Intenta de nuevo.");
  }
  return (await response.json()) as T;
};

/** POST /auth/login */
export const login = async (correo: string, contrasena: string): Promise<Sesion> => {
  if (!esCorreoInstitucional(correo)) {
    throw new ApiError(400, "Usa tu correo institucional @acatlan.unam.mx o @unam.mx.");
  }
  if (!USE_MOCKS) return request<Sesion>("/auth/login", { method: "POST", body: JSON.stringify({ correo, contrasena }) });
  const usuario = mock.USUARIOS.find((u) => u.correo === correo.trim().toLowerCase()) ?? mock.USUARIOS[1];
  return { usuario, token: "mock-token" };
};

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
  const token = window.sessionStorage.getItem("ssm.token");
  const response = await fetch(`${API_URL}/evidencias`, { method: "POST", body, headers: token ? { Authorization: `Bearer ${token}` } : undefined });
  if (!response.ok) throw new ApiError(response.status, "No se pudo subir el archivo.");
};
