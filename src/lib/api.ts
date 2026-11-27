// Cliente del API de ssm-backend. Mientras NEXT_PUBLIC_USE_MOCKS=true responde con datos de ejemplo,
// así el front se puede desarrollar sin backend. Cada función documenta el endpoint que consumirá.
import * as mock from "./mock-data";
import type {
  AtencionLicenciatura,
  CicloHistorico,
  DetalleHistorico,
  AvancePayload,
  CambiarAsignacionPayload,
  Actividad,
  Catalogos,
  CicloAdministracion,
  CicloPayload,
  CoordinacionOpcion,
  CrearUsuarioPayload,
  DevolverInformePayload,
  EventoAuditoria,
  EnlacePayload,
  EvidenciaInforme,
  DevolverPlanPayload,
  FiltrosBitacora,
  FiltrosInformes,
  FiltrosTransversales,
  GrupoTransversal,
  GrupoTransversalPayload,
  GuardarMetasPayload,
  InformeDetalle,
  InformeResumen,
  Incumplimiento,
  MiInforme,
  MiPlan,
  Notificacion,
  PaginaBitacora,
  PlanDetalle,
  PlanResumen,
  RecomendacionPayload,
  RecomendacionPlan,
  RecomendacionTransversal,
  RecordatoriosLicenciatura,
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

/** HU-10 · GET /recordatorios: fechas límite próximas, vencidas y rezagos de la licenciatura (banner al iniciar sesión). */
export const obtenerRecordatorios = async (): Promise<RecordatoriosLicenciatura> =>
  USE_MOCKS ? mock.RECORDATORIOS : request<RecordatoriosLicenciatura>("/recordatorios");

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

/** HU-13 en modo demostración: ids del catálogo de ejemplo (1 Actuaría, 2 Derecho, 3 Economía, 4 Sociología) → nombres. */
const LICENCIATURAS_DEMO = ["Actuaría", "Derecho", "Economía", "Sociología"];
const nombresDemo = (licenciaturaIds?: string) =>
  licenciaturaIds ? licenciaturaIds.split(",").map((id) => LICENCIATURAS_DEMO[Number(id) - 1]).filter((n): n is string => Boolean(n)) : null;

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
export const listarCiclos = async (licenciaturaIds?: string): Promise<CicloAdministracion[]> => {
  if (!USE_MOCKS) return request<CicloAdministracion[]>(`/ciclos${consulta({ licenciaturaIds })}`);
  await esperar(150);
  const nombres = nombresDemo(licenciaturaIds);
  return structuredClone(ciclosDemo).filter((c) => !nombres || nombres.includes(c.licenciatura.nombre));
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
export const listarPlanes = async (licenciaturaIds?: string): Promise<PlanResumen[]> => {
  if (!USE_MOCKS) return request<PlanResumen[]>(`/planes${consulta({ licenciaturaIds })}`);
  await esperar(150);
  const usuario = leerUsuarioSesion();
  const nombres = nombresDemo(licenciaturaIds);
  const todos = mock.PLANES.map((p) => (p.id === planDemo.id ? resumenDemo() : p)).filter((p) => !nombres || nombres.includes(p.licenciatura));
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
export type FormatoReporte = "pdf" | "docx";

/** HU-06 · GET /planes/:id/pdf o /planes/:id/docx: Plan de Mejora Continua con membrete institucional. */
export const descargarReportePlan = async (id: string, formato: FormatoReporte = "pdf"): Promise<Blob> => {
  if (USE_MOCKS) throw new ApiError(501, `El reporte ${formato === "docx" ? "en Word" : "PDF"} del servidor requiere conectar el backend.`);
  return requestBlob(`/planes/${encodeURIComponent(id)}/${formato}`);
};

/** HU-09 · GET /informes/:id/pdf o /informes/:id/docx: Informe de Seguimiento con membrete y evidencias como hipervínculos. */
export const descargarReporteInforme = async (id: string, formato: FormatoReporte = "pdf"): Promise<Blob> => {
  if (USE_MOCKS) throw new ApiError(501, `El informe ${formato === "docx" ? "en Word" : "en PDF"} requiere conectar el backend.`);
  return requestBlob(`/informes/${encodeURIComponent(id)}/${formato}`, "No pudimos generar el informe.");
};

/** Nombre de archivo del informe: Informe_de_Seguimiento_Actuaria_2026-2.pdf */
export const nombreReporteInforme = (informe: { licenciatura: string; periodo: string }, formato: FormatoReporte) =>
  `Informe_de_Seguimiento_${informe.licenciatura}_${informe.periodo}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-]+/g, "_") + `.${formato}`;

// HU-09 · Los enlaces a evidencias de los reportes exportados abren /evidencias/:id en una pestaña nueva, que no trae
// sesión (vive en sessionStorage). Esa página guarda a dónde volver y el login la regresa ahí. Solo se aceptan rutas
// /evidencias/... para que nadie use el login como redirección a otro sitio.
const CLAVE_DESTINO = "ssm.destino";
const DESTINO_PERMITIDO = /^\/evidencias\/[A-Za-z0-9-]+$/;

export const guardarDestinoTrasLogin = (ruta: string) => {
  if (DESTINO_PERMITIDO.test(ruta)) window.sessionStorage.setItem(CLAVE_DESTINO, ruta);
};

/** Devuelve el destino pendiente (una sola vez) o null. */
export const tomarDestinoTrasLogin = (): string | null => {
  const ruta = window.sessionStorage.getItem(CLAVE_DESTINO);
  window.sessionStorage.removeItem(CLAVE_DESTINO);
  return ruta && DESTINO_PERMITIDO.test(ruta) ? ruta : null;
};

/** Nombre de archivo del reporte: Plan_de_Mejora_Actuaria_2024-2029.docx */
export const nombreReportePlan = (plan: { licenciatura: string; ciclo: string }, formato: FormatoReporte) =>
  `Plan_de_Mejora_${plan.licenciatura}_${plan.ciclo}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-]+/g, "_") + `.${formato}`;

/** Ofrece un archivo al navegador para guardarlo. */
export const guardarArchivo = (archivo: Blob, nombre: string) => {
  const url = URL.createObjectURL(archivo);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
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

/** HU-14 · Reporte obligatorio por fecha de corte y porcentaje esperado. */
export const obtenerIncumplimientos = async (filtros: { fechaCorte: string; porcentajeEsperado: number; licenciaturaIds?: string; cicloId?: string }): Promise<Incumplimiento[]> => {
  const parametros = new URLSearchParams({ fechaCorte: filtros.fechaCorte, porcentajeEsperado: String(filtros.porcentajeEsperado) });
  if (filtros.licenciaturaIds) parametros.set("licenciaturaIds", filtros.licenciaturaIds);
  // HU-16: sobre un ciclo histórico.
  if (filtros.cicloId) parametros.set("cicloId", filtros.cicloId);
  if (!USE_MOCKS) return request<Incumplimiento[]>(`/reportes/incumplimiento?${parametros}`);
  return mock.INCUMPLIMIENTOS.filter((f) => f.real < filtros.porcentajeEsperado && (!filtros.licenciaturaIds || filtros.licenciaturaIds.split(",").includes(f.licenciaturaId)))
    .map((f) => ({ ...f, esperado: filtros.porcentajeEsperado, brecha: filtros.porcentajeEsperado - f.real }));
};

/** HU-15 · Resumen por estatus; sin filtro devuelve todas las licenciaturas. */
export const obtenerResumenAtencion = async (licenciaturaIds?: string, cicloId?: string): Promise<AtencionLicenciatura[]> => {
  // HU-16: con cicloId, el resumen es de ese ciclo (vigente o histórico).
  if (!USE_MOCKS) return request<AtencionLicenciatura[]>(`/reportes/atencion${consulta({ licenciaturaIds, cicloId })}`);
  return licenciaturaIds ? mock.ATENCION.filter((a) => licenciaturaIds.split(",").includes(a.licenciaturaId)) : mock.ATENCION;
};

// ---------------------------------------------------------------------------
// Bloque Informe de Seguimiento (HU-07, HU-08, HU-11) · base compartida (lectura).
// Las acciones (iniciar, avances, evidencias, enviar, validar, devolver, reabrir) las agregan las líneas A y B
// debajo de esta sección; todas responden el InformeDetalle completo.
// ---------------------------------------------------------------------------

const consulta = (filtros: Record<string, string | number | undefined>) => {
  const parametros = new URLSearchParams(
    Object.entries(filtros)
      .filter((par): par is [string, string | number] => par[1] !== undefined && par[1] !== "")
      .map(([clave, valor]) => [clave, String(valor)]),
  );
  const texto = parametros.toString();
  return texto ? `?${texto}` : "";
};

/** GET /informes · Administrador: todos; Captura y Auxiliar: los de su licenciatura. */
export const listarInformes = async (filtros: FiltrosInformes = {}): Promise<InformeResumen[]> => {
  if (!USE_MOCKS) return request<InformeResumen[]>(`/informes${consulta(filtros)}`);
  await esperar(150);
  const nombres = nombresDemo(filtros.licenciaturaIds);
  return mock.INFORMES.filter(
    (i) => (!filtros.estado || i.estado === filtros.estado) && (!filtros.periodo || i.periodo === filtros.periodo) && (!nombres || nombres.includes(i.licenciatura)),
  );
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

// ---------- HU-08 · Revisión del informe (solo Administrador) ----------

/** Modo demostración: aplica la decisión sobre la copia en memoria del informe. */
const decidirDemo = async (id: string, cambio: (i: InformeDetalle) => void): Promise<InformeDetalle> => {
  await esperar();
  const informe = mock.INFORMES_DETALLE.find((i) => i.id === id);
  if (!informe) throw new ApiError(404, "Informe no encontrado.");
  cambio(informe);
  return clonar(informe);
};

const revisionDemo = (decision: "APROBADO" | "DEVUELTO", comentario: string | null, datos?: DevolverInformePayload) => ({
  id: crypto.randomUUID(), decision, comentario, revisor: "Administración SSM",
  fecha: new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date()),
  observaciones: datos?.observaciones ?? [],
});

const devolverDemo = (i: InformeDetalle, comentario: string, datos: DevolverInformePayload) => {
  const revision = revisionDemo("DEVUELTO", comentario, datos);
  Object.assign(i, { estado: "DEVUELTO", aprobadoEn: null, editable: true, bloqueo: null, ultimaRevision: revision, revisiones: [...i.revisiones, revision] });
  i.avances.forEach((a) => { a.observacionRevision = datos.observaciones?.find((o) => o.recomendacionId === a.recomendacionId)?.comentario ?? null; });
};

/** POST /informes/:id/validar */
export const validarInforme = async (id: string, comentario?: string): Promise<InformeDetalle> => {
  if (!USE_MOCKS) return request<InformeDetalle>(`/informes/${id}/validar`, { method: "POST", body: JSON.stringify({ comentario }) });
  return decidirDemo(id, (i) => {
    if (i.estado !== "EN_REVISION") throw new ApiError(409, "Solo se pueden validar informes que están en revisión.");
    const revision = revisionDemo("APROBADO", comentario?.trim() || null);
    Object.assign(i, { estado: "APROBADO", aprobadoEn: new Date().toISOString(), editable: false, bloqueo: "APROBADO", ultimaRevision: revision, revisiones: [...i.revisiones, revision] });
    i.avances.forEach((a) => { a.observacionRevision = null; });
  });
};

/** POST /informes/:id/devolver */
export const devolverInforme = async (id: string, datos: DevolverInformePayload): Promise<InformeDetalle> => {
  if (!USE_MOCKS) return request<InformeDetalle>(`/informes/${id}/devolver`, { method: "POST", body: JSON.stringify(datos) });
  return decidirDemo(id, (i) => {
    if (i.estado !== "EN_REVISION") throw new ApiError(409, "Solo se pueden devolver informes que están en revisión.");
    devolverDemo(i, datos.motivo, datos);
  });
};

/** POST /informes/:id/reabrir (informe aprobado; motivo obligatorio). */
export const reabrirInforme = async (id: string, datos: DevolverInformePayload): Promise<InformeDetalle> => {
  if (!USE_MOCKS) return request<InformeDetalle>(`/informes/${id}/reabrir`, { method: "POST", body: JSON.stringify(datos) });
  return decidirDemo(id, (i) => {
    if (i.estado !== "APROBADO") throw new ApiError(409, "Solo se pueden reabrir informes aprobados.");
    devolverDemo(i, `Reapertura: ${datos.motivo}`, datos);
  });
};

// ---------- HU-07 · Captura del informe (Captura y Auxiliar) ----------

/** Modo demostración: el informe de la coordinación vive en memoria (se arma con el plan de ejemplo de Actuaría). */
let miInformeDemo: InformeDetalle | null = null;

const recalcularDemo = (i: InformeDetalle) => {
  i.conAvance = i.avances.filter((a) => a.porcentaje !== null).length;
  i.evidencias = i.avances.reduce((total, a) => total + a.evidencias.length, 0);
  i.avances.forEach((a) => { a.evidenciaObligatoria = a.porcentaje === 100; });
};

const editableDemo = (): InformeDetalle => {
  if (!miInformeDemo) throw new ApiError(404, "Informe no encontrado.");
  if (!miInformeDemo.editable) throw new ApiError(409, "El informe está en revisión o ya fue aprobado; no se puede editar.");
  return miInformeDemo;
};

const avanceDemo = (recomendacionId: string) => {
  const a = editableDemo().avances.find((x) => x.recomendacionId === recomendacionId);
  if (!a) throw new ApiError(404, "La recomendación no pertenece al plan de este informe.");
  return a;
};

const evidenciaDemo = (recomendacionId: string, datos: Pick<EvidenciaInforme, "origen" | "nombre" | "tamano" | "enlace" | "externo">) => {
  const a = avanceDemo(recomendacionId);
  if (a.porcentaje === null) throw new ApiError(400, `Captura primero el % de avance de la recomendación ${a.numero} y después agrega su evidencia.`);
  a.evidencias.push({ id: crypto.randomUUID(), cargadaPor: "Coordinación (demostración)", cargadaEn: new Date().toISOString(), ...datos });
  recalcularDemo(editableDemo());
  return clonar(editableDemo());
};

/** POST /ciclos/:cicloId/informes · "Iniciar informe del semestre" (si ya existe, devuelve el mismo). */
export const iniciarInforme = async (cicloId: string): Promise<InformeDetalle> => {
  if (!USE_MOCKS) return request<InformeDetalle>(`/ciclos/${cicloId}/informes`, { method: "POST" });
  await esperar();
  if (!miInformeDemo) {
    const periodo = mock.MI_INFORME.periodo!;
    miInformeDemo = {
      id: "inf-act-2027-1", informeId: "i-act-2027-1", cicloId, licenciaturaId: "1", licenciatura: mock.CICLO_ACTUARIA.licenciatura,
      ciclo: mock.CICLO_ACTUARIA.nombre, periodo: periodo.nombre, fechaInicio: periodo.fechaInicio, fechaFin: periodo.fechaFin, fechaCorte: periodo.fechaCorte,
      estado: "BORRADOR", enviadoEn: null, aprobadoEn: null, recomendaciones: mock.RECOMENDACIONES.length, conAvance: 0, evidencias: 0,
      organismo: mock.CICLO_ACTUARIA.organismo, vigenciaInicio: mock.CICLO_ACTUARIA.vigenciaInicio, vigenciaFin: mock.CICLO_ACTUARIA.vigenciaFin,
      editable: true, bloqueo: null, ultimaRevision: null, revisiones: [],
      avances: mock.RECOMENDACIONES.map((r) => {
        const vencidas = r.metas.filter((m) => m.fechaCompromiso && m.fechaCompromiso <= periodo.fechaCorte && m.porcentajeEsperado !== null);
        return {
          recomendacionId: r.id, numero: r.numero, categoria: r.categoria, indicador: r.indicador, recomendacion: r.descripcion, fechaCumplimiento: r.fechaCumplimiento,
          metas: r.metas.map((m) => ({ descripcion: m.descripcion, fechaCompromiso: m.fechaCompromiso, porcentajeEsperado: m.porcentajeEsperado })),
          esperadoAlCorte: vencidas.length ? Math.max(...vencidas.map((m) => m.porcentajeEsperado as number)) : null,
          porcentaje: null, observaciones: null, evidenciaObligatoria: false, observacionRevision: null, evidencias: [],
        };
      }),
    };
  }
  mock.MI_INFORME.informe = miInformeDemo;
  return clonar(miInformeDemo);
};

/** PUT /informes/:id/avances/:recomendacionId · % entero de 0 a 100 y observaciones. */
export const guardarAvance = async (id: string, recomendacionId: string, datos: AvancePayload): Promise<InformeDetalle> => {
  if (!USE_MOCKS) return request<InformeDetalle>(`/informes/${id}/avances/${recomendacionId}`, { method: "PUT", body: JSON.stringify(datos) });
  await esperar(200);
  const a = avanceDemo(recomendacionId);
  a.porcentaje = datos.porcentaje;
  a.observaciones = datos.observaciones?.trim() || null;
  recalcularDemo(editableDemo());
  return clonar(editableDemo());
};

/** POST /informes/:id/avances/:recomendacionId/enlaces · Plan B. */
export const agregarEnlaceEvidencia = async (id: string, recomendacionId: string, datos: EnlacePayload): Promise<InformeDetalle> => {
  if (!USE_MOCKS) return request<InformeDetalle>(`/informes/${id}/avances/${recomendacionId}/enlaces`, { method: "POST", body: JSON.stringify(datos) });
  await esperar(200);
  return evidenciaDemo(recomendacionId, { origen: "URL", nombre: datos.nombre?.trim() || new URL(datos.url).hostname, tamano: null, enlace: datos.url.trim(), externo: true });
};

/**
 * POST /informes/:id/avances/:recomendacionId/evidencias (multipart, campo "archivo").
 * Usa XMLHttpRequest porque fetch no informa el progreso de la subida. `alProgreso` recibe 0–100;
 * al llegar a 100 el servidor está convirtiendo a PDF.
 */
export const subirEvidenciaInforme = (id: string, recomendacionId: string, archivo: File, alProgreso: (porcentaje: number) => void): Promise<InformeDetalle> => {
  if (USE_MOCKS) {
    return new Promise((resolver, rechazar) => {
      let avance = 0;
      const timer = window.setInterval(() => {
        avance = Math.min(100, avance + 25);
        alProgreso(avance);
        if (avance < 100) return;
        window.clearInterval(timer);
        try {
          resolver(evidenciaDemo(recomendacionId, { origen: "ARCHIVO", nombre: archivo.name, tamano: archivo.size, enlace: "/evidencias/demo/archivo", externo: false }));
        } catch (error) {
          rechazar(error);
        }
      }, 250);
    });
  }
  return new Promise((resolver, rechazar) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}/informes/${id}/avances/${recomendacionId}/evidencias`);
    const token = window.sessionStorage.getItem(CLAVE_TOKEN);
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) alProgreso(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => {
      const cuerpo = (() => { try { return JSON.parse(xhr.responseText) as unknown; } catch { return {}; } })();
      if (xhr.status >= 200 && xhr.status < 300) return resolver(cuerpo as InformeDetalle);
      const mensaje = (cuerpo as { message?: string | string[] }).message;
      rechazar(new ApiError(xhr.status, (Array.isArray(mensaje) ? mensaje[0] : mensaje) ?? "No pudimos subir el archivo."));
    };
    xhr.onerror = () => rechazar(new ApiError(0, "Se perdió la conexión al subir el archivo. Reintenta."));
    const datos = new FormData();
    datos.append("archivo", archivo);
    xhr.send(datos);
  });
};

/** DELETE /evidencias/:id · solo con el informe editable; el archivo se conserva en la carpeta. */
export const quitarEvidenciaInforme = async (evidenciaId: string): Promise<InformeDetalle> => {
  if (!USE_MOCKS) return request<InformeDetalle>(`/evidencias/${evidenciaId}`, { method: "DELETE" });
  await esperar(200);
  const informe = editableDemo();
  informe.avances.forEach((a) => { a.evidencias = a.evidencias.filter((e) => e.id !== evidenciaId); });
  recalcularDemo(informe);
  return clonar(informe);
};

/** POST /informes/:id/enviar · revisa que esté completo y avisa a la Administración (HU-11). */
export const enviarInforme = async (id: string): Promise<InformeDetalle> => {
  if (!USE_MOCKS) return request<InformeDetalle>(`/informes/${id}/enviar`, { method: "POST" });
  await esperar();
  const informe = editableDemo();
  const faltan = informe.avances
    .map((a) => (a.porcentaje === null ? `Recomendación ${a.numero}: falta el % de avance` : a.porcentaje === 100 && a.evidencias.length === 0 ? `Recomendación ${a.numero}: falta al menos una evidencia (está al 100 %)` : null))
    .filter(Boolean);
  if (faltan.length) throw new ApiError(400, `Completa el informe antes de enviarlo. ${faltan.join("; ")}.`);
  Object.assign(informe, { estado: "EN_REVISION", editable: false, bloqueo: "EN_REVISION", enviadoEn: new Date().toISOString() });
  return clonar(informe);
};

// ---------- HU-03 · Bitácora de auditoría (solo Administrador) ----------

/** GET /auditoria · del más reciente al más antiguo, con filtros y paginación. */
export const listarBitacora = async (filtros: FiltrosBitacora = {}): Promise<PaginaBitacora> => {
  if (!USE_MOCKS) return request<PaginaBitacora>(`/auditoria${consulta(filtros)}`);
  await esperar(150);
  const texto = filtros.q?.trim().toLowerCase();
  const nombres = nombresDemo(filtros.licenciaturaIds);
  const eventos = mock.BITACORA.filter(
    (e) =>
      (!filtros.rol || e.rol === filtros.rol) &&
      (!nombres || (e.licenciatura !== null && nombres.includes(e.licenciatura))) &&
      (!texto || `${e.usuario.nombre} ${e.usuario.correo} ${e.campo} ${e.anterior ?? ""} ${e.nuevo ?? ""}`.toLowerCase().includes(texto)),
  );
  return { total: eventos.length, pagina: 1, limite: eventos.length, eventos };
};

/** GET /auditoria/recomendaciones/:id · línea de tiempo de una recomendación (plan e informes), de la más antigua a la más reciente. */
export const historialRecomendacion = async (recomendacionId: string): Promise<EventoAuditoria[]> => {
  if (!USE_MOCKS) return request<EventoAuditoria[]>(`/auditoria/recomendaciones/${recomendacionId}`);
  await esperar(150);
  return mock.BITACORA.filter((e) => e.entidadId === recomendacionId).reverse();
};

// ---------- HU-17 · Recomendaciones transversales (solo Administrador) ----------

// Modo demostración: unas recomendaciones de ejemplo y los grupos en memoria.
const recDemo = (id: string, licenciatura: string, recomendacion: string, avance: number | null, vigente = true): RecomendacionTransversal => ({
  id,
  licenciatura: { id: String(LICENCIATURAS_DEMO.indexOf(licenciatura) + 1), nombre: licenciatura },
  ciclo: { id: `c-${licenciatura}-${vigente}`, nombre: vigente ? "2024-2029" : "2019-2024", vigente },
  planEstado: "APROBADO",
  categoria: "Infraestructura y Equipamiento",
  indicador: "9.1 Laboratorios y equipo",
  recomendacion,
  transversal: false,
  grupo: null,
  avance,
});
let gruposDemo: { id: string; nombre: string; descripcion: string | null }[] = [{ id: "g1", nombre: "Renovación de equipo de cómputo", descripcion: "Laboratorios con equipo y software actualizado" }];
const recomendacionesDemo: RecomendacionTransversal[] = [
  { ...recDemo("r1", "Actuaría", "Renovar el equipo de cómputo de los laboratorios de modelación", 40), transversal: true, grupo: { id: "g1", nombre: "Renovación de equipo de cómputo" } },
  { ...recDemo("r2", "Economía", "Actualizar el software estadístico del laboratorio", 75), transversal: true, grupo: { id: "g1", nombre: "Renovación de equipo de cómputo" } },
  recDemo("r3", "Derecho", "Adquirir bibliografía especializada en derecho digital", 20),
  recDemo("r4", "Sociología", "Ampliar el acervo bibliográfico digital", null),
  recDemo("r5", "Derecho", "Suscribir bases de datos jurídicas en línea", 0, false),
];
const enAlcanceDemo = (r: RecomendacionTransversal, ciclos: FiltrosTransversales["ciclos"] = "vigentes") =>
  ciclos === "todos" || (ciclos === "vigentes") === r.ciclo.vigente;
const filtrarDemo = (f: FiltrosTransversales) => {
  const nombres = nombresDemo(f.licenciaturaIds);
  const texto = f.q?.trim().toLowerCase();
  return structuredClone(recomendacionesDemo).filter(
    (r) =>
      enAlcanceDemo(r, f.ciclos) &&
      (!nombres || nombres.includes(r.licenciatura.nombre)) &&
      (!f.soloTransversales || r.transversal) &&
      (!f.grupoId || r.grupo?.id === f.grupoId) &&
      (!texto || `${r.recomendacion} ${r.indicador} ${r.grupo?.nombre ?? ""}`.toLowerCase().includes(texto)),
  );
};

const parametrosTransversales = (f: FiltrosTransversales) =>
  consulta({ licenciaturaIds: f.licenciaturaIds, ciclos: f.ciclos, soloTransversales: f.soloTransversales ? "true" : undefined, grupoId: f.grupoId, q: f.q?.trim() || undefined, cicloId: f.cicloId });

/** GET /transversales/recomendaciones · consulta con el filtro "Mostrar sólo recomendaciones transversales". */
export const consultarRecomendacionesTransversales = async (filtros: FiltrosTransversales): Promise<RecomendacionTransversal[]> => {
  if (!USE_MOCKS) return request<RecomendacionTransversal[]>(`/transversales/recomendaciones${parametrosTransversales(filtros)}`);
  await esperar(150);
  return filtrarDemo(filtros);
};

/** GET /transversales/grupos · vista agrupada con las licenciaturas que comparten cada grupo y su avance consolidado. */
export const listarGruposTransversales = async (filtros: FiltrosTransversales): Promise<GrupoTransversal[]> => {
  if (!USE_MOCKS) return request<GrupoTransversal[]>(`/transversales/grupos${parametrosTransversales({ ...filtros, soloTransversales: undefined, q: undefined })}`);
  await esperar(150);
  const recs = filtrarDemo({ ...filtros, soloTransversales: true, grupoId: undefined, q: undefined });
  return gruposDemo
    .map((g) => {
      const miembros = recs.filter((r) => r.grupo?.id === g.id);
      const licenciaturas = [...new Set(miembros.map((r) => r.licenciatura.nombre))].sort((a, b) => a.localeCompare(b, "es"));
      const avanceConsolidado = miembros.length ? Math.round(miembros.reduce((s, r) => s + (r.avance ?? 0), 0) / miembros.length) : null;
      return { ...g, licenciaturas, recomendaciones: miembros, avanceConsolidado };
    })
    .filter((g) => !filtros.grupoId || g.id === filtros.grupoId);
};

/** POST /transversales/grupos */
export const crearGrupoTransversal = async (datos: GrupoTransversalPayload): Promise<{ id: string; nombre: string; descripcion: string | null }> => {
  if (!USE_MOCKS) return request<{ id: string; nombre: string; descripcion: string | null }>("/transversales/grupos", { method: "POST", body: JSON.stringify(datos) });
  await esperar();
  if (gruposDemo.some((g) => g.nombre === datos.nombre.trim())) throw new ApiError(409, `Ya existe un grupo llamado "${datos.nombre.trim()}".`);
  const nuevo = { id: crypto.randomUUID(), nombre: datos.nombre.trim(), descripcion: datos.descripcion?.trim() || null };
  gruposDemo = [...gruposDemo, nuevo];
  return nuevo;
};

/** PATCH /transversales/grupos/:id */
export const editarGrupoTransversal = async (id: string, datos: GrupoTransversalPayload): Promise<void> => {
  if (!USE_MOCKS) {
    await request(`/transversales/grupos/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(datos) });
    return;
  }
  await esperar();
  gruposDemo = gruposDemo.map((g) => (g.id === id ? { ...g, nombre: datos.nombre.trim(), descripcion: datos.descripcion?.trim() || null } : g));
  recomendacionesDemo.forEach((r) => { if (r.grupo?.id === id) r.grupo = { id, nombre: datos.nombre.trim() }; });
};

/** DELETE /transversales/grupos/:id · sus recomendaciones dejan de ser transversales. */
export const eliminarGrupoTransversal = async (id: string): Promise<void> => {
  if (!USE_MOCKS) {
    await request(`/transversales/grupos/${encodeURIComponent(id)}`, { method: "DELETE" });
    return;
  }
  await esperar();
  gruposDemo = gruposDemo.filter((g) => g.id !== id);
  recomendacionesDemo.forEach((r) => { if (r.grupo?.id === id) Object.assign(r, { grupo: null, transversal: false }); });
};

/** POST /transversales/marcar · selector: una o varias recomendaciones como transversales en un grupo. */
export const marcarTransversales = async (grupoId: string, recomendacionIds: string[]): Promise<void> => {
  if (!USE_MOCKS) {
    await request("/transversales/marcar", { method: "POST", body: JSON.stringify({ grupoId, recomendacionIds }) });
    return;
  }
  await esperar();
  const grupo = gruposDemo.find((g) => g.id === grupoId);
  if (!grupo) throw new ApiError(404, "Grupo transversal no encontrado.");
  recomendacionesDemo.forEach((r) => { if (recomendacionIds.includes(r.id)) Object.assign(r, { grupo: { id: grupo.id, nombre: grupo.nombre }, transversal: true }); });
};

/** POST /transversales/desmarcar */
export const desmarcarTransversales = async (recomendacionIds: string[]): Promise<void> => {
  if (!USE_MOCKS) {
    await request("/transversales/desmarcar", { method: "POST", body: JSON.stringify({ recomendacionIds }) });
    return;
  }
  await esperar();
  recomendacionesDemo.forEach((r) => { if (recomendacionIds.includes(r.id)) Object.assign(r, { grupo: null, transversal: false }); });
};

/** GET /transversales/reporte/:formato · reporte consolidado. */
export const descargarReporteTransversales = async (filtros: FiltrosTransversales, formato: FormatoReporte = "pdf"): Promise<Blob> => {
  if (USE_MOCKS) throw new ApiError(501, `El reporte ${formato === "docx" ? "en Word" : "en PDF"} requiere conectar el backend.`);
  return requestBlob(`/transversales/reporte/${formato}${parametrosTransversales({ licenciaturaIds: filtros.licenciaturaIds, ciclos: filtros.ciclos, cicloId: filtros.cicloId })}`, "No pudimos generar el reporte.");
};

/** Recomendaciones_Transversales_vigentes.pdf */
export const nombreReporteTransversales = (ciclos: FiltrosTransversales["ciclos"] = "vigentes", formato: FormatoReporte) =>
  `Recomendaciones_Transversales_${ciclos}.${formato}`;

// ---------- HU-16 · Archivo histórico ----------

const CICLOS_HISTORICOS_DEMO: CicloHistorico[] = [
  { id: "h2", nombre: "2024-2029", licenciatura: { id: "3", nombre: "Derecho" }, organismo: "CONAED", fechaEmision: "2024-11-28", vigenciaInicio: "2024-11-28", vigenciaFin: "2029-11-28", estado: "VIGENTE", activo: true, etiqueta: "28 de noviembre de 2024 al 28 de noviembre de 2029 · CONAED", carpeta: "/Evidencias/Derecho/2024-2029/" },
  { id: "h1", nombre: "2019-2024", licenciatura: { id: "3", nombre: "Derecho" }, organismo: "CONAED", fechaEmision: "2019-11-28", vigenciaInicio: "2019-11-28", vigenciaFin: "2024-11-28", estado: "HISTORICO", activo: false, etiqueta: "28 de noviembre de 2019 al 28 de noviembre de 2024 · CONAED", carpeta: "/Evidencias/Derecho/2019-2024/" },
];

/** GET /historico/ciclos · ciclos vigentes e históricos para elegir por vigencia; `fecha` busca por una fecha de la constancia. */
export const listarCiclosHistoricos = async (filtros: { licenciaturaIds?: string; fecha?: string } = {}): Promise<CicloHistorico[]> => {
  if (!USE_MOCKS) return request<CicloHistorico[]>(`/historico/ciclos${consulta({ licenciaturaIds: filtros.licenciaturaIds, fecha: filtros.fecha || undefined })}`);
  await esperar(150);
  return CICLOS_HISTORICOS_DEMO.filter((c) => !filtros.fecha || c.fechaEmision === filtros.fecha || (c.vigenciaInicio <= filtros.fecha && filtros.fecha <= c.vigenciaFin));
};

/** GET /historico/ciclos/:id · plan, informes y resumen de atención del ciclo. */
export const obtenerCicloHistorico = async (id: string): Promise<DetalleHistorico> => {
  if (!USE_MOCKS) return request<DetalleHistorico>(`/historico/ciclos/${encodeURIComponent(id)}`);
  await esperar(150);
  const ciclo = CICLOS_HISTORICOS_DEMO.find((c) => c.id === id);
  if (!ciclo) throw new ApiError(404, "Ciclo de acreditación no encontrado.");
  return { ciclo, plan: null, informes: [], atencion: null };
};
