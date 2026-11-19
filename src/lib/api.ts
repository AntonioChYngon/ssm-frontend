// Cliente del API de ssm-backend. Mientras NEXT_PUBLIC_USE_MOCKS=true responde con datos de ejemplo,
// así el front se puede desarrollar sin backend. Cada función documenta el endpoint que consumirá.
import * as mock from "./mock-data";
import type {
  AtencionLicenciatura,
  CambiarAsignacionPayload,
  Catalogos,
  CrearUsuarioPayload,
  DevolverPlanPayload,
  GuardarMetasPayload,
  InformeResumen,
  MiPlan,
  Notificacion,
  PlanDetalle,
  PlanResumen,
  RecomendacionPayload,
  RecomendacionPlan,
  Rol,
  Sesion,
  Usuario,
} from "./types";

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

export const actualizarUsuarioSesion = (usuario: Usuario) => {
  if (typeof window !== "undefined" && window.sessionStorage.getItem(CLAVE_TOKEN)) {
    window.sessionStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
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

const requestBlob = async (path: string): Promise<Blob> => {
  const token = typeof window === "undefined" ? null : window.sessionStorage.getItem(CLAVE_TOKEN);
  const response = await fetch(`${API_URL}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { message?: string | string[] };
    const mensaje = Array.isArray(body.message) ? body.message[0] : body.message;
    throw new ApiError(response.status, mensaje ?? "No pudimos descargar el reporte.");
  }
  return response.blob();
};

/** POST /auth/login */
export const login = async (correo: string, contrasena: string): Promise<Sesion> => {
  if (!esCorreoInstitucional(correo)) {
    throw new ApiError(400, MENSAJE_DOMINIO);
  }
  if (!USE_MOCKS) return request<Sesion>("/auth/login", { method: "POST", body: JSON.stringify({ correo, contrasena }) });
  const usuario = mock.USUARIOS.find((u) => u.correo === correo.trim().toLowerCase());
  if (!usuario) throw new ApiError(401, "La cuenta no está en los datos de demostración. Conecta el backend o usa una cuenta de muestra.");
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

/** GET /informes */
export const listarInformes = async (): Promise<InformeResumen[]> => (USE_MOCKS ? mock.INFORMES : request<InformeResumen[]>("/informes"));

/** GET /notificaciones */
export const listarNotificaciones = async (): Promise<Notificacion[]> => (USE_MOCKS ? mock.NOTIFICACIONES : request<Notificacion[]>("/notificaciones"));

/** PATCH /notificaciones/:id/leida */
export const marcarNotificacionLeida = async (id: string): Promise<void> => {
  if (!USE_MOCKS) await request(`/notificaciones/${id}/leida`, { method: "PATCH" });
};

/** PATCH /notificaciones/leidas */
export const marcarTodasLasNotificacionesLeidas = async (): Promise<void> => {
  if (!USE_MOCKS) await request("/notificaciones/leidas", { method: "PATCH" });
};

/** POST /evidencias (multipart). El backend convierte a PDF y devuelve el estado. */
export const subirEvidencia = async (metaId: string, archivo: File): Promise<void> => {
  if (USE_MOCKS) return;
  const body = new FormData();
  body.append("metaId", metaId);
  body.append("archivo", archivo);
  const token = window.sessionStorage.getItem(CLAVE_TOKEN);
  const response = await fetch(`${API_URL}/evidencias`, { method: "POST", body, headers: token ? { Authorization: `Bearer ${token}` } : undefined });
  if (!response.ok) throw new ApiError(response.status, "No se pudo subir el archivo.");
};

// ---------------------------------------------------------------------------
// Historias en curso. Con NEXT_PUBLIC_USE_MOCKS=true responden con datos de ejemplo.
// ---------------------------------------------------------------------------

const esperar = (ms = 300) => new Promise((resolver) => setTimeout(resolver, ms));

/** HU-02 · POST /auth/restablecer (enlace del correo de recuperación) */
export const restablecerContrasena = async (token: string, nueva: string): Promise<void> => {
  if (!USE_MOCKS) await request("/auth/restablecer", { method: "POST", body: JSON.stringify({ token, nueva }) });
};

/** HU-02 · POST /usuarios */
export const crearUsuario = async (datos: CrearUsuarioPayload): Promise<Usuario> => {
  if (!USE_MOCKS) return request<Usuario>("/usuarios", { method: "POST", body: JSON.stringify(datos) });
  await esperar();
  return { id: `mock-${Date.now()}`, nombre: `${datos.nombre} ${datos.apellido}`, correo: datos.correo, rol: datos.rol, licenciatura: "Actuaría", activo: true };
};

/** HU-02 · PATCH /usuarios/:id/asignacion */
export const cambiarAsignacion = async (id: string, datos: CambiarAsignacionPayload): Promise<void> => {
  if (!USE_MOCKS) await request(`/usuarios/${id}/asignacion`, { method: "PATCH", body: JSON.stringify(datos) });
};

/** HU-02 · POST /usuarios/:id/restablecer */
export const restablecerContrasenaDeUsuario = async (id: string): Promise<void> => {
  if (!USE_MOCKS) await request(`/usuarios/${id}/restablecer`, { method: "POST" });
};

/** HU-02 · PATCH /usuarios/:id/estado */
export const cambiarEstadoUsuario = async (id: string, activo: boolean, motivo?: string): Promise<void> => {
  if (!USE_MOCKS) await request(`/usuarios/${id}/estado`, { method: "PATCH", body: JSON.stringify({ activo, motivo }) });
};

/** HU-04 · GET /catalogos */
export const obtenerCatalogos = async (): Promise<Catalogos> => {
  if (!USE_MOCKS) return request<Catalogos>("/catalogos");
  const lista = (nombres: readonly string[]) => nombres.map((nombre, i) => ({ id: String(i + 1), nombre }));
  return {
    categorias: lista(mock.CATEGORIAS),
    areas: lista(["Secretaría Académica", "Secretaría General", "Biblioteca", "Centro de Cómputo"]),
    organismos: lista(["Organismo Acreditador de Prueba A", "Organismo Acreditador de Prueba B"]),
  };
};

// ----- HU-04 / HU-05 / HU-12 · Plan de Mejora -----
// En modo demostración el plan de Actuaría vive en memoria: se puede capturar, enviar, validar y devolver.

const clonar = <T>(valor: T): T => JSON.parse(JSON.stringify(valor)) as T;
let planDemo: PlanDetalle = clonar(mock.PLAN_ACTUARIA);
const resumenDemo = (): PlanResumen => {
  const { vigenciaInicio: _i, vigenciaFin: _f, editable: _e, recomendacionesDetalle, ultimaRevision: _r, ...resumen } = planDemo;
  return { ...resumen, recomendaciones: recomendacionesDetalle.length };
};
const actualizarDemo = (cambios: Partial<PlanDetalle>) => {
  planDemo = { ...planDemo, ...cambios };
  planDemo.editable = planDemo.estado === "BORRADOR" || planDemo.estado === "DEVUELTO";
  planDemo.recomendacionesDetalle = planDemo.recomendacionesDetalle.map((r, i) => ({ ...r, numero: i + 1 }));
  planDemo.recomendaciones = planDemo.recomendacionesDetalle.length;
  return clonar(planDemo);
};
const exigirEditableDemo = () => {
  if (!planDemo.editable) throw new ApiError(409, "El plan está en validación o ya fue validado; no se puede editar.");
};

/** HU-04 · GET /planes: Administrador = todos (incluidos borradores); Captura y Auxiliar = su licenciatura. */
export const listarPlanes = async (): Promise<PlanResumen[]> => {
  if (!USE_MOCKS) return request<PlanResumen[]>("/planes");
  await esperar(150);
  const usuario = leerUsuarioSesion();
  const todos = mock.PLANES.map((p) => (p.id === planDemo.id ? resumenDemo() : p));
  return usuario && usuario.rol !== "ADMINISTRADOR" ? todos.filter((p) => p.licenciatura === (usuario.licenciatura ?? "Actuaría")) : todos;
};

/** HU-04 · GET /planes/:id (también alimenta la Configuración de Metas) */
export const obtenerPlan = async (id: string): Promise<PlanDetalle> => {
  if (!USE_MOCKS) return request<PlanDetalle>(`/planes/${encodeURIComponent(id)}`);
  await esperar(150);
  if (id === planDemo.id) return clonar(planDemo);
  const resumen = mock.PLANES.find((p) => p.id === id);
  if (!resumen) throw new ApiError(404, "Plan de mejora no encontrado.");
  return {
    ...resumen,
    vigenciaInicio: "2024-11-28",
    vigenciaFin: "2029-11-28",
    editable: resumen.estado === "BORRADOR" || resumen.estado === "DEVUELTO",
    recomendacionesDetalle: clonar(mock.RECOMENDACIONES),
    ultimaRevision: null,
  };
};

/** HU-04 · GET /planes/mio: ciclo vigente de mi licenciatura y su plan (null si aún no hay captura). */
export const obtenerMiPlan = async (): Promise<MiPlan> => {
  if (!USE_MOCKS) return request<MiPlan>("/planes/mio");
  await esperar(150);
  return { ciclo: mock.CICLO_ACTUARIA, plan: clonar(planDemo) };
};

/** HU-04 · GET /planes/:id/pdf */
export const descargarReportePlan = async (id: string): Promise<Blob> => {
  if (USE_MOCKS) throw new ApiError(501, "El reporte PDF del servidor requiere conectar el backend.");
  return requestBlob(`/planes/${encodeURIComponent(id)}/pdf`);
};

/** HU-04 · Guardar borrador: POST /ciclos/:cicloId/plan/recomendaciones (nueva) o PUT /recomendaciones/:id (existente). */
export const guardarRecomendacion = async (cicloId: string, datos: RecomendacionPayload, recomendacionId?: string): Promise<PlanDetalle> => {
  if (!USE_MOCKS) {
    return recomendacionId
      ? request<PlanDetalle>(`/recomendaciones/${recomendacionId}`, { method: "PUT", body: JSON.stringify(datos) })
      : request<PlanDetalle>(`/ciclos/${cicloId}/plan/recomendaciones`, { method: "POST", body: JSON.stringify(datos) });
  }
  await esperar();
  exigirEditableDemo();
  const anterior = planDemo.recomendacionesDetalle.find((r) => r.id === recomendacionId);
  const metasPrevias = [...(anterior?.metas ?? [])];
  const metas = (datos.metas ?? []).map((descripcion) => {
    const i = metasPrevias.findIndex((m) => m.descripcion === descripcion);
    return i >= 0 ? metasPrevias.splice(i, 1)[0]! : { id: `m-${crypto.randomUUID()}`, descripcion, fechaCompromiso: null, porcentajeEsperado: null };
  });
  const rec: RecomendacionPlan = {
    id: recomendacionId ?? `r-${crypto.randomUUID()}`,
    numero: 0,
    categoriaId: datos.categoriaId,
    categoria: mock.CATEGORIAS[Number(datos.categoriaId) - 1] ?? "",
    indicador: datos.indicador,
    descripcion: datos.descripcion,
    acciones: datos.acciones ?? [],
    metas,
    areaResponsable: datos.areaResponsable ?? null,
    fechaCumplimiento: datos.fechaCumplimiento ?? null,
    observacion: anterior?.observacion ?? null,
  };
  const recomendacionesDetalle = anterior
    ? planDemo.recomendacionesDetalle.map((r) => (r.id === recomendacionId ? rec : r))
    : [...planDemo.recomendacionesDetalle, rec];
  return actualizarDemo({ recomendacionesDetalle, actualizado: new Date().toLocaleDateString("es-MX") });
};

/** HU-04 · DELETE /recomendaciones/:id */
export const eliminarRecomendacion = async (recomendacionId: string): Promise<PlanDetalle> => {
  if (!USE_MOCKS) return request<PlanDetalle>(`/recomendaciones/${recomendacionId}`, { method: "DELETE" });
  await esperar();
  exigirEditableDemo();
  return actualizarDemo({ recomendacionesDetalle: planDemo.recomendacionesDetalle.filter((r) => r.id !== recomendacionId) });
};

/** HU-04 · POST /planes/:id/enviar: pasa el plan a En validación y avisa al Administrador. */
export const enviarPlan = async (id: string): Promise<PlanDetalle> => {
  if (!USE_MOCKS) return request<PlanDetalle>(`/planes/${id}/enviar`, { method: "POST" });
  await esperar();
  exigirEditableDemo();
  if (!planDemo.recomendacionesDetalle.length) throw new ApiError(400, "Agrega al menos una recomendación antes de enviar el plan.");
  const incompletas = planDemo.recomendacionesDetalle
    .filter((r) => !r.acciones.length || !r.metas.length || !r.areaResponsable || !r.fechaCumplimiento)
    .map((r) => r.numero);
  if (incompletas.length) throw new ApiError(400, `Completa las recomendaciones ${incompletas.join(", ")} antes de enviar el plan.`);
  return actualizarDemo({ estado: "EN_REVISION" });
};

/** HU-05 · POST /planes/:id/validar */
export const validarPlan = async (id: string, comentario?: string): Promise<PlanDetalle> => {
  if (!USE_MOCKS) return request<PlanDetalle>(`/planes/${id}/validar`, { method: "POST", body: JSON.stringify({ comentario }) });
  await esperar();
  if (id !== planDemo.id) return obtenerPlan(id);
  return actualizarDemo({ estado: "APROBADO", ultimaRevision: { decision: "APROBADO", comentario: comentario ?? null, revisor: "María González", fecha: new Date().toLocaleDateString("es-MX") } });
};

/** HU-05 · POST /planes/:id/devolver: motivo general obligatorio y observaciones por recomendación. */
export const devolverPlan = async (id: string, datos: DevolverPlanPayload): Promise<PlanDetalle> => {
  if (!USE_MOCKS) return request<PlanDetalle>(`/planes/${id}/devolver`, { method: "POST", body: JSON.stringify(datos) });
  await esperar();
  if (id !== planDemo.id) return obtenerPlan(id);
  const obs = new Map(datos.observaciones.map((o) => [o.recomendacionId, o.comentario]));
  return actualizarDemo({
    estado: "DEVUELTO",
    recomendacionesDetalle: planDemo.recomendacionesDetalle.map((r) => ({ ...r, observacion: obs.get(r.id) ?? null })),
    ultimaRevision: { decision: "DEVUELTO", comentario: datos.motivo, revisor: "María González", fecha: new Date().toLocaleDateString("es-MX") },
  });
};

/** HU-12 · PUT /recomendaciones/:id/metas (Configuración de Metas) */
export const guardarMetas = async (recomendacionId: string, datos: GuardarMetasPayload): Promise<PlanDetalle> => {
  if (!USE_MOCKS) return request<PlanDetalle>(`/recomendaciones/${recomendacionId}/metas`, { method: "PUT", body: JSON.stringify(datos) });
  await esperar();
  exigirEditableDemo();
  return actualizarDemo({
    recomendacionesDetalle: planDemo.recomendacionesDetalle.map((r) =>
      r.id === recomendacionId ? { ...r, metas: datos.metas.map((m) => ({ ...m, id: m.id ?? `m-${crypto.randomUUID()}` })) } : r,
    ),
  });
};

/** HU-15 · GET /reportes/atencion?licenciaturaId= */
export const obtenerResumenAtencion = async (licenciaturaId?: string): Promise<AtencionLicenciatura[]> => {
  if (!USE_MOCKS) return request<AtencionLicenciatura[]>(`/reportes/atencion${licenciaturaId ? `?licenciaturaId=${encodeURIComponent(licenciaturaId)}` : ""}`);
  return mock.ATENCION;
};
