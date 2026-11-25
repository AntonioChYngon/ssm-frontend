// Cliente del API de ssm-backend. Mientras NEXT_PUBLIC_USE_MOCKS=true responde con datos de ejemplo,
// así el front se puede desarrollar sin backend. Cada función documenta el endpoint que consumirá.
import * as mock from "./mock-data";
import type {
  AtencionLicenciatura,
  CambiarAsignacionPayload,
  Actividad,
  Catalogos,
  CicloAdministracion,
  CicloPayload,
  CoordinacionOpcion,
  CrearUsuarioPayload,
  DevolverPlanPayload,
  FiltrosInformes,
  GuardarMetasPayload,
  InformeDetalle,
  InformeResumen,
  MiInforme,
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

const requestBlob = async (path: string, mensajePorDefecto = "No pudimos descargar el reporte."): Promise<Blob> => {
  const token = typeof window === "undefined" ? null : window.sessionStorage.getItem(CLAVE_TOKEN);
  const response = await fetch(`${API_URL}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { message?: string | string[] };
    const mensaje = Array.isArray(body.message) ? body.message[0] : body.message;
    throw new ApiError(response.status, mensaje ?? mensajePorDefecto);
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

/** Mi perfil · GET /auth/actividad (últimos 10 movimientos propios). */
export const obtenerMiActividad = async (): Promise<Actividad[]> => {
  if (!USE_MOCKS) return request<Actividad[]>("/auth/actividad");
  await esperar(150);
  const hace = (minutos: number) => new Date(Date.now() - minutos * 60_000).toISOString();
  return [
    { id: "a3", tipo: "PLAN", descripcion: "Editó una recomendación del plan", fecha: hace(7) },
    { id: "a2", tipo: "SESION", descripcion: "Inicio de sesión", fecha: hace(15) },
    { id: "a1", tipo: "SEGURIDAD", descripcion: "Cambió su contraseña", fecha: hace(60 * 26) },
  ];
};

/** POST /auth/recuperar */
export const solicitarRecuperacion = async (correo: string): Promise<void> => {
  if (!esCorreoInstitucional(correo)) throw new ApiError(400, "Ese correo no pertenece al dominio institucional.");
  if (!USE_MOCKS) await request("/auth/recuperar", { method: "POST", body: JSON.stringify({ correo }) });
};

export const rutaInicio = (rol: Rol) => (rol === "ADMINISTRADOR" ? "/admin/dashboard" : "/licenciatura/dashboard");

/** GET /usuarios */
export const listarUsuarios = async (): Promise<Usuario[]> => (USE_MOCKS ? mock.USUARIOS : request<Usuario[]>("/usuarios"));

/** HU-02 · GET /usuarios/coordinaciones */
export const listarCoordinaciones = async (): Promise<CoordinacionOpcion[]> => {
  if (!USE_MOCKS) return request<CoordinacionOpcion[]>("/usuarios/coordinaciones");
  return mock.LICENCIATURAS.map((licenciatura, indice) => ({
    id: String(indice + 1),
    nombre: `Coordinación de ${licenciatura}`,
    licenciaturaId: String(indice + 1),
    licenciatura,
  }));
};


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

// ---------------------------------------------------------------------------
// Historias en curso. Con NEXT_PUBLIC_USE_MOCKS=true responden con datos de ejemplo.
// ---------------------------------------------------------------------------

const esperar = (ms = 300) => new Promise((resolver) => setTimeout(resolver, ms));

/** HU-02 · POST /auth/restablecer (enlace del correo de recuperación) */
export const restablecerContrasena = async (token: string, nueva: string): Promise<void> => {
  if (!USE_MOCKS) await request("/auth/restablecer", { method: "POST", body: JSON.stringify({ token, nueva }) });
};

/** POST /auth/cambiar-contrasena: actualiza la contraseña de la sesión autenticada. */
export const cambiarContrasena = async (actual: string, nueva: string): Promise<void> => {
  if (!USE_MOCKS) {
    // El backend responde un token nuevo sin el cambio pendiente: la sesión continúa sin volver a entrar.
    const sesion = await request<Partial<Sesion>>("/auth/cambiar-contrasena", { method: "POST", body: JSON.stringify({ actual, nueva }) });
    if (sesion.token && sesion.usuario) guardarSesion({ token: sesion.token, usuario: sesion.usuario });
    return;
  }
  await esperar();
  const usuario = leerUsuarioSesion();
  if (usuario) actualizarUsuarioSesion({ ...usuario, debeCambiarContrasena: false });
};

/** Reglas de contraseña segura (mismas que esContrasenaSegura del backend). */
export const reglasContrasena = (nueva: string) => [
  { texto: "Al menos 8 caracteres", ok: nueva.length >= 8 },
  { texto: "Una letra mayúscula", ok: /[A-ZÁÉÍÓÚÑ]/.test(nueva) },
  { texto: "Un número", ok: /\d/.test(nueva) },
];

export const RUTA_CAMBIO_OBLIGATORIO = "/cambiar-contrasena";

/** A dónde va una sesión recién iniciada: a cambiar la contraseña temporal o a su inicio. */
export const rutaTrasLogin = (usuario: Usuario) => (usuario.debeCambiarContrasena ? RUTA_CAMBIO_OBLIGATORIO : rutaInicio(usuario.rol));

/** HU-02 · POST /usuarios */
export const crearUsuario = async (datos: CrearUsuarioPayload): Promise<Usuario> => {
  if (!USE_MOCKS) return request<Usuario>("/usuarios", { method: "POST", body: JSON.stringify(datos) });
  await esperar();
  const usuario: Usuario = {
    id: `mock-${Date.now()}`,
    nombre: `${datos.nombre} ${datos.apellido}`,
    correo: datos.correo,
    rol: datos.rol,
    licenciatura: mock.LICENCIATURAS[Number(datos.coordinacionId) - 1] ?? "Actuaría",
    activo: true,
  };
  mock.USUARIOS.unshift(usuario);
  return usuario;
};

/** HU-02 · PATCH /usuarios/:id/asignacion */
export const cambiarAsignacion = async (id: string, datos: CambiarAsignacionPayload): Promise<void> => {
  if (!USE_MOCKS) {
    await request(`/usuarios/${id}/asignacion`, { method: "PATCH", body: JSON.stringify(datos) });
    return;
  }
  await esperar();
  const usuario = mock.USUARIOS.find((elemento) => elemento.id === id);
  if (usuario) {
    usuario.rol = datos.rol;
    usuario.licenciatura = mock.LICENCIATURAS[Number(datos.coordinacionId) - 1] ?? usuario.licenciatura;
  }
};

/** HU-02 · POST /usuarios/:id/restablecer */
export const restablecerContrasenaDeUsuario = async (id: string): Promise<void> => {
  if (!USE_MOCKS) await request(`/usuarios/${id}/restablecer`, { method: "POST" });
  else await esperar();
};

/** HU-02 · PATCH /usuarios/:id/estado */
export const cambiarEstadoUsuario = async (id: string, activo: boolean, motivo?: string): Promise<void> => {
  if (!USE_MOCKS) {
    await request(`/usuarios/${id}/estado`, { method: "PATCH", body: JSON.stringify({ activo, motivo }) });
    return;
  }
  await esperar();
  const usuario = mock.USUARIOS.find((elemento) => elemento.id === id);
  if (usuario) usuario.activo = activo;
};

/** HU-04 · GET /catalogos */
export const obtenerCatalogos = async (): Promise<Catalogos> => {
  if (!USE_MOCKS) return request<Catalogos>("/catalogos");
  const lista = (nombres: readonly string[]) => nombres.map((nombre, i) => ({ id: String(i + 1), nombre }));
  return {
    categorias: lista(mock.CATEGORIAS),
    areas: lista(["Secretaría Académica", "Secretaría General", "Biblioteca", "Centro de Cómputo"]),
    organismos: lista(["Comités Interinstitucionales para la Evaluación de la Educación Superior A.C. (CIEES)", "Consejo para la Acreditación de la Enseñanza del Derecho A.C. (CONAED)"]),
    licenciaturas: lista(["Actuaría", "Derecho", "Economía", "Sociología"]),
  };
};

// ---------- HU-18 · Ciclos de acreditación (solo Administrador) ----------

// Modo demostración: los ciclos viven en memoria mientras la pestaña esté abierta.
let ciclosDemo: CicloAdministracion[] = [
  {
    id: "c-actuaria", nombre: "2024-2029", licenciatura: { id: "1", nombre: "Actuaría" },
    organismo: { id: "1", nombre: "Comités Interinstitucionales para la Evaluación de la Educación Superior A.C. (CIEES)" },
    fechaEmision: "2024-11-28", vigenciaInicio: "2024-11-28", vigenciaFin: "2029-11-28", estado: "VIGENTE", activo: true,
    referenciaConstancia: null, carpeta: { ruta: "/Evidencias/Actuaría/2024-2029", url: null }, plan: null,
  },
];

const cicloDemo = (datos: CicloPayload, id: string): CicloAdministracion => {
  const catalogo = (lista: string[], itemId: string) => ({ id: itemId, nombre: lista[Number(itemId) - 1] ?? "—" });
  const nombre = datos.nombre?.trim() || `${datos.vigenciaInicio.slice(0, 4)}-${datos.vigenciaFin.slice(0, 4)}`;
  const licenciatura = catalogo(["Actuaría", "Derecho", "Economía", "Sociología"], datos.licenciaturaId);
  const vencido = datos.vigenciaFin < new Date().toISOString().slice(0, 10);
  return {
    id, nombre, licenciatura, organismo: catalogo(["CIEES", "CONAED"], datos.organismoId),
    fechaEmision: datos.fechaEmision, vigenciaInicio: datos.vigenciaInicio, vigenciaFin: datos.vigenciaFin,
    estado: vencido ? "HISTORICO" : "VIGENTE", activo: !vencido, referenciaConstancia: datos.referenciaConstancia ?? null,
    carpeta: { ruta: `/Evidencias/${licenciatura.nombre}/${nombre}`, url: null }, plan: null,
  };
};

/** HU-18 · GET /ciclos */
export const listarCiclos = async (): Promise<CicloAdministracion[]> => {
  if (!USE_MOCKS) return request<CicloAdministracion[]>("/ciclos");
  await esperar(150);
  return structuredClone(ciclosDemo);
};

/** HU-18 · POST /ciclos: inicia el ciclo y crea su carpeta /Evidencias/[Licenciatura]/[nombre]/ */
export const crearCiclo = async (datos: CicloPayload): Promise<CicloAdministracion> => {
  if (!USE_MOCKS) return request<CicloAdministracion>("/ciclos", { method: "POST", body: JSON.stringify(datos) });
  await esperar();
  const nuevo = cicloDemo(datos, crypto.randomUUID());
  if (nuevo.estado === "VIGENTE" && ciclosDemo.some((c) => c.licenciatura.id === nuevo.licenciatura.id && c.activo)) {
    throw new ApiError(409, `${nuevo.licenciatura.nombre} ya tiene un ciclo activo. Podrás iniciar uno nuevo cuando termine.`);
  }
  ciclosDemo = [...ciclosDemo.map((c) => (c.licenciatura.id === nuevo.licenciatura.id && nuevo.estado === "VIGENTE" ? { ...c, estado: "HISTORICO" as const, activo: false } : c)), nuevo];
  return structuredClone(nuevo);
};

/** HU-18 · PATCH /ciclos/:id: solo mientras la coordinación no haya capturado su plan. */
export const actualizarCiclo = async (id: string, datos: CicloPayload): Promise<CicloAdministracion> => {
  if (!USE_MOCKS) return request<CicloAdministracion>(`/ciclos/${id}`, { method: "PATCH", body: JSON.stringify(datos) });
  await esperar();
  const actualizado = cicloDemo(datos, id);
  ciclosDemo = ciclosDemo.map((c) => (c.id === id ? actualizado : c));
  return structuredClone(actualizado);
};

/** HU-18 · POST /ciclos/:id/carpeta: crea la carpeta de un ciclo que no la tiene. */
export const crearCarpetaCiclo = async (id: string): Promise<CicloAdministracion> => {
  if (!USE_MOCKS) return request<CicloAdministracion>(`/ciclos/${id}/carpeta`, { method: "POST" });
  await esperar();
  const ciclo = ciclosDemo.find((c) => c.id === id);
  if (!ciclo) throw new ApiError(404, "No existe ese ciclo de acreditación.");
  ciclo.carpeta = { ruta: `/Evidencias/${ciclo.licenciatura.nombre}/${ciclo.nombre}`, url: null };
  return structuredClone(ciclo);
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
  const metas = (datos.metas ?? []).map(({ descripcion, fechaCompromiso, porcentajeEsperado }) => {
    const i = metasPrevias.findIndex((m) => m.descripcion === descripcion);
    const id = i >= 0 ? metasPrevias.splice(i, 1)[0]!.id : `m-${crypto.randomUUID()}`;
    return { id, descripcion, fechaCompromiso, porcentajeEsperado };
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

// ---------------------------------------------------------------------------
// Bloque Informe de Seguimiento (HU-07, HU-08, HU-11) · base compartida (lectura).
// Las acciones (iniciar, avances, evidencias, enviar, validar, devolver, reabrir) las agregan las líneas A y B
// debajo de esta sección; todas responden el InformeDetalle completo.
// ---------------------------------------------------------------------------

const consulta = (filtros: FiltrosInformes) => {
  const parametros = new URLSearchParams(Object.entries(filtros).filter((par): par is [string, string] => Boolean(par[1])));
  const texto = parametros.toString();
  return texto ? `?${texto}` : "";
};

/** GET /informes · Administrador: todos; Captura y Auxiliar: los de su licenciatura. */
export const listarInformes = async (filtros: FiltrosInformes = {}): Promise<InformeResumen[]> => {
  if (!USE_MOCKS) return request<InformeResumen[]>(`/informes${consulta(filtros)}`);
  await esperar(150);
  return mock.INFORMES.filter((i) => (!filtros.estado || i.estado === filtros.estado) && (!filtros.periodo || i.periodo === filtros.periodo));
};

/** GET /informes/:id */
export const obtenerInforme = async (id: string): Promise<InformeDetalle> => {
  if (!USE_MOCKS) return request<InformeDetalle>(`/informes/${encodeURIComponent(id)}`);
  await esperar(150);
  const informe = mock.INFORMES_DETALLE.find((i) => i.id === id);
  if (!informe) throw new ApiError(404, "Informe no encontrado.");
  return clonar(informe);
};

/** GET /informes/mio · ciclo vigente, semestre en curso, informe del semestre (o null) y los anteriores. */
export const obtenerMiInforme = async (): Promise<MiInforme> => {
  if (!USE_MOCKS) return request<MiInforme>("/informes/mio");
  await esperar(150);
  return clonar(mock.MI_INFORME);
};

/** GET /evidencias/:id/archivo · PDF guardado en la carpeta del ciclo (pide sesión). `enlace` viene de EvidenciaInforme. */
export const descargarEvidencia = async (enlace: string): Promise<Blob> => {
  if (USE_MOCKS) throw new ApiError(501, "Abrir evidencias guardadas requiere conectar el backend.");
  return requestBlob(enlace, "No pudimos abrir la evidencia.");
};
