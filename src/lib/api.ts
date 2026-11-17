// Cliente del API de ssm-backend. Con NEXT_PUBLIC_USE_MOCKS=true funciona en modo demostración: arranca en ceros
// (solo catálogos y las cuentas del seed) y guarda lo capturado en el navegador. Ver src/lib/demo.ts.
// Cada función documenta el endpoint que consume.
import { CAPTURA_DEMO, CATALOGOS_DEMO, USUARIOS_DEMO, guardarDemo, leerDemo, planVacio, siguienteIdDemo } from "./demo";
import { errorMetaMedible, errorVigencia } from "./reglas";
import type {
  AtencionLicenciatura,
  CambiarAsignacionPayload,
  Catalogos,
  CicloPayload,
  CicloResumen,
  CrearUsuarioPayload,
  Hito,
  InformeResumen,
  NuevaRecomendacionPayload,
  Notificacion,
  PlanDeMejora,
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
  const usuario = USUARIOS_DEMO.find((u) => u.correo === correo.trim().toLowerCase()) ?? CAPTURA_DEMO;
  return { usuario, token: "demo-token" };
};

/** GET /auth/me: confirma que el token sigue vigente y devuelve el usuario actualizado. */
export const obtenerUsuarioActual = async (): Promise<Usuario> => (USE_MOCKS ? (leerUsuarioSesion() ?? CAPTURA_DEMO) : request<Usuario>("/auth/me"));

/** POST /auth/recuperar */
export const solicitarRecuperacion = async (correo: string): Promise<void> => {
  if (!esCorreoInstitucional(correo)) throw new ApiError(400, "Ese correo no pertenece al dominio institucional.");
  if (!USE_MOCKS) await request("/auth/recuperar", { method: "POST", body: JSON.stringify({ correo }) });
};

export const rutaInicio = (rol: Rol) => (rol === "ADMINISTRADOR" ? "/admin/dashboard" : "/licenciatura/dashboard");

/** GET /usuarios: usuarios registrados en la base (en demostración, las dos cuentas del seed). */
export const listarUsuarios = async (): Promise<Usuario[]> => (USE_MOCKS ? USUARIOS_DEMO : request<Usuario[]>("/usuarios"));

/** POST /planes/:id/validar  ·  POST /planes/:id/devolver */
export const resolverPlan = async (id: string, accion: "validar" | "devolver", motivo?: string): Promise<void> => {
  if (!USE_MOCKS) await request(`/planes/${id}/${accion}`, { method: "POST", body: JSON.stringify({ motivo }) });
};

/** GET /informes (HU-07, pendiente en el backend): sin backend, la lista empieza vacía. */
export const listarInformes = async (): Promise<InformeResumen[]> => (USE_MOCKS ? [] : request<InformeResumen[]>("/informes"));

/** PUT /recomendaciones/:id/hitos */
export const guardarHitos = async (recomendacionId: string, hitos: Omit<Hito, "id" | "recomendacionId" | "porcentajeReal">[]): Promise<void> => {
  if (!USE_MOCKS) await request(`/recomendaciones/${recomendacionId}/hitos`, { method: "PUT", body: JSON.stringify(hitos) });
};

/** GET /notificaciones (HU-10, pendiente en el backend). Mientras no exista, la bandeja queda vacía. */
export const listarNotificaciones = async (): Promise<Notificacion[]> => {
  if (USE_MOCKS) return [];
  return request<Notificacion[]>("/notificaciones").catch(() => []);
};

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
  return { id: `demo-${Date.now()}`, nombre: `${datos.nombre} ${datos.apellido}`, correo: datos.correo, rol: datos.rol, licenciatura: null, activo: true };
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
export const obtenerCatalogos = async (): Promise<Catalogos> => (USE_MOCKS ? CATALOGOS_DEMO : request<Catalogos>("/catalogos"));

const SIN_CICLO = "La Unidad de Planeación aún no registra el ciclo de acreditación (vigencia) de tu licenciatura.";

/** HU-04 · GET /ciclos (Administradora): ciclos de acreditación con el estado de su plan. */
export const listarCiclos = async (): Promise<CicloResumen[]> => {
  if (!USE_MOCKS) return request<CicloResumen[]>("/ciclos");
  await esperar();
  return structuredClone(leerDemo().ciclos);
};

/** HU-04 · POST /ciclos: la Administradora registra la vigencia a mano (D7). */
export const crearCiclo = async (datos: CicloPayload): Promise<CicloResumen> => {
  if (!USE_MOCKS) return request<CicloResumen>("/ciclos", { method: "POST", body: JSON.stringify(datos) });
  await esperar();
  const demo = leerDemo();
  const ciclo = cicloDemo(datos, siguienteIdDemo(demo));
  if (demo.ciclos.some((c) => c.estado === "VIGENTE" && c.licenciatura.id === ciclo.licenciatura.id)) {
    throw new ApiError(409, `${ciclo.licenciatura.nombre} ya tiene un ciclo vigente.`);
  }
  demo.ciclos.push(ciclo);
  guardarDemo(demo);
  return structuredClone(ciclo);
};

/** HU-04 · PATCH /ciclos/:cicloId: solo mientras la coordinación no haya capturado su plan. */
export const actualizarCiclo = async (cicloId: string, datos: CicloPayload): Promise<CicloResumen> => {
  if (!USE_MOCKS) return request<CicloResumen>(`/ciclos/${encodeURIComponent(cicloId)}`, { method: "PATCH", body: JSON.stringify(datos) });
  await esperar();
  const demo = leerDemo();
  const actual = demo.ciclos.find((c) => c.id === cicloId);
  if (!actual) throw new ApiError(404, "No existe ese ciclo de acreditación.");
  if (actual.plan) throw new ApiError(409, "La coordinación ya empezó a capturar su plan; la vigencia ya no se puede cambiar.");
  const corregido = cicloDemo(datos, cicloId);
  if (corregido.licenciatura.id !== actual.licenciatura.id && demo.ciclos.some((c) => c.estado === "VIGENTE" && c.licenciatura.id === corregido.licenciatura.id)) {
    throw new ApiError(409, `${corregido.licenciatura.nombre} ya tiene un ciclo vigente.`);
  }
  demo.ciclos = demo.ciclos.map((c) => (c.id === cicloId ? corregido : c));
  guardarDemo(demo);
  return structuredClone(corregido);
};

/** HU-04 · GET /mi-plan: plan del ciclo vigente de la licenciatura de Captura/Auxiliar (incluye su cicloId). */
export const obtenerMiPlan = async (): Promise<PlanDeMejora> => {
  if (!USE_MOCKS) return request<PlanDeMejora>("/mi-plan");
  await esperar();
  const usuario = leerUsuarioSesion() ?? CAPTURA_DEMO;
  const ciclo = leerDemo().ciclos.find((c) => c.estado === "VIGENTE" && c.licenciatura.nombre === usuario.licenciatura);
  if (!ciclo) throw new ApiError(404, SIN_CICLO);
  return structuredClone(leerDemo().planes[ciclo.id] ?? planVacio(ciclo));
};

/** HU-04 · GET /ciclos/:cicloId/plan (la Administradora consulta cualquier ciclo). */
export const obtenerPlanDelCiclo = async (cicloId: string): Promise<PlanDeMejora> => {
  if (!USE_MOCKS) return request<PlanDeMejora>(`/ciclos/${encodeURIComponent(cicloId)}/plan`);
  await esperar();
  const demo = leerDemo();
  const ciclo = demo.ciclos.find((c) => c.id === cicloId);
  if (!ciclo) throw new ApiError(404, "No existe ese ciclo de acreditación.");
  return structuredClone(demo.planes[cicloId] ?? planVacio(ciclo));
};

/** HU-04 · POST /ciclos/:cicloId/plan/recomendaciones → la recomendación guardada. */
export const agregarRecomendacion = async (cicloId: string, datos: NuevaRecomendacionPayload): Promise<RecomendacionPlan> => {
  if (!USE_MOCKS) {
    return request<RecomendacionPlan>(`/ciclos/${encodeURIComponent(cicloId)}/plan/recomendaciones`, { method: "POST", body: JSON.stringify(datos) });
  }
  await esperar();
  return agregarEnDemo(cicloId, datos);
};

// ---------- Modo demostración: mismas reglas que el backend ----------

const itemDe = (lista: { id: string; nombre: string }[], id: string, campo: string) => {
  const item = lista.find((x) => x.id === id);
  if (!item) throw new ApiError(400, `Selecciona ${campo} del catálogo.`);
  return { id: item.id, nombre: item.nombre };
};

const cicloDemo = (datos: CicloPayload, id: string): CicloResumen => {
  const error = errorVigencia(datos);
  if (error) throw new ApiError(400, error);
  return {
    id,
    licenciatura: itemDe(CATALOGOS_DEMO.licenciaturas, datos.licenciaturaId, "una licenciatura"),
    organismo: itemDe(CATALOGOS_DEMO.organismos, datos.organismoId, "un organismo acreditador"),
    fechaEmision: datos.fechaEmision,
    vigenciaInicio: datos.vigenciaInicio,
    vigenciaFin: datos.vigenciaFin,
    estado: "VIGENTE",
    referenciaConstancia: datos.referenciaConstancia?.trim() || null,
    plan: null,
  };
};

const agregarEnDemo = (cicloId: string, datos: NuevaRecomendacionPayload): RecomendacionPlan => {
  const demo = leerDemo();
  const ciclo = demo.ciclos.find((c) => c.id === cicloId);
  if (!ciclo) throw new ApiError(404, "No existe ese ciclo de acreditación.");
  if (datos.fechaCumplimiento < ciclo.vigenciaInicio || datos.fechaCumplimiento > ciclo.vigenciaFin) {
    throw new ApiError(400, `La fecha de cumplimiento debe estar entre ${ciclo.vigenciaInicio} y ${ciclo.vigenciaFin}.`);
  }
  const errorMeta = datos.metas.map(errorMetaMedible).find((e) => e !== null);
  if (errorMeta) throw new ApiError(400, errorMeta);

  const plan = demo.planes[cicloId] ?? planVacio(ciclo);
  if (!plan.version) plan.version = { id: siguienteIdDemo(demo), numero: 1, estado: "BORRADOR", editable: true };
  if (!plan.version.editable) throw new ApiError(409, "El plan está en revisión o aprobado y no se puede modificar.");

  const categoria = itemDe(CATALOGOS_DEMO.categorias, datos.categoriaId, "la categoría");
  let indicador = plan.indicadores.find((i) => i.id === datos.indicadorId);
  if (datos.indicadorId && !indicador) throw new ApiError(404, "Ese indicador no pertenece a este plan.");
  if (!indicador) {
    indicador = { id: siguienteIdDemo(demo), clave: null, descripcion: datos.indicador?.trim() ?? "", categoria, recomendaciones: [] };
    plan.indicadores.push(indicador);
  }
  const recomendacion: RecomendacionPlan = {
    id: siguienteIdDemo(demo),
    descripcion: datos.descripcion,
    acciones: datos.acciones,
    metas: datos.metas,
    areas: datos.areaIds.map((id) => itemDe(CATALOGOS_DEMO.areas, id, "el área responsable")),
    fechaCumplimiento: datos.fechaCumplimiento,
    etiquetaFecha: datos.etiquetaFecha ?? null,
  };
  indicador.recomendaciones.push(recomendacion);

  demo.planes[cicloId] = plan;
  const total = plan.indicadores.reduce((suma, i) => suma + i.recomendaciones.length, 0);
  ciclo.plan = { versionId: plan.version.id, numero: plan.version.numero, estado: plan.version.estado, recomendaciones: total };
  guardarDemo(demo);
  return structuredClone(recomendacion);
};

/** HU-15 · GET /reportes/atencion?licenciaturaId= */
export const obtenerResumenAtencion = async (licenciaturaId?: string): Promise<AtencionLicenciatura[]> => {
  if (!USE_MOCKS) return request<AtencionLicenciatura[]>(`/reportes/atencion${licenciaturaId ? `?licenciaturaId=${encodeURIComponent(licenciaturaId)}` : ""}`);
  return [];
};
