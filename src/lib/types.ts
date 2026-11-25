// Contrato de datos compartido con ssm-backend (mismos nombres que los DTO de NestJS).
// Si cambias algo aquí, actualiza también ssm-backend/src/common/enums.ts y los DTO.

export type Rol = "ADMINISTRADOR" | "CAPTURA" | "AUXILIAR";
export type EstadoDocumento = "BORRADOR" | "EN_REVISION" | "DEVUELTO" | "VALIDADO";
export type EstadoEvidencia = "SUBIENDO" | "CONVIRTIENDO" | "LISTO" | "ERROR";
export type TipoNotificacion = "VENCIMIENTO" | "META" | "DEVOLUCION" | "PLAN";
export type CanalNotificacion = "CORREO" | "IN_APP" | "AMBOS";

export type EstadoBadge = "Completado" | "Validado" | "Pendiente" | "En revisión" | "En validación" | "Devuelto" | "Vencido" | "Borrador" | "Nuevo";

export const ESTADO_DOCUMENTO_BADGE: Record<EstadoDocumento, EstadoBadge> = {
  BORRADOR: "Borrador",
  EN_REVISION: "En revisión",
  DEVUELTO: "Devuelto",
  VALIDADO: "Validado",
};

/** Estados del Plan de Mejora: mismos códigos que version_plan.estado (CHECK ck_plan_estado). */
export type EstadoPlan = "BORRADOR" | "EN_REVISION" | "APROBADO" | "DEVUELTO";

export const ESTADO_PLAN_BADGE: Record<EstadoPlan, EstadoBadge> = {
  BORRADOR: "Borrador",
  EN_REVISION: "En validación",
  APROBADO: "Validado",
  DEVUELTO: "Devuelto",
};

export const ROL_LABEL: Record<Rol, string> = {
  ADMINISTRADOR: "Administrador",
  CAPTURA: "Captura",
  AUXILIAR: "Auxiliar",
};

export type Usuario = {
  id: string;
  nombre: string;
  correo: string;
  rol: Rol;
  licenciatura: string | null;
  /** Coordinación asignada (null para el Administrador). */
  coordinacion?: string | null;
  activo: boolean;
  /** La cuenta usa una contraseña temporal: debe cambiarla antes de entrar al sistema. */
  debeCambiarContrasena?: boolean;
  /** Solo en el listado de usuarios del Administrador. */
  ultimoAcceso?: string;
};

/** HU-04 · GET /planes. Una fila por ciclo con su versión más reciente. */
export type PlanResumen = {
  id: string;
  cicloId: string;
  licenciatura: string;
  organismo: string;
  ciclo: string;
  recomendaciones: number;
  avance: number;
  estado: EstadoPlan;
  actualizado: string;
};

/** Meta de una recomendación. fechaCompromiso y porcentajeEsperado se llenan en la Configuración de Metas. */
export type MetaPlan = {
  id: string;
  descripcion: string;
  /** AAAA-MM-DD */
  fechaCompromiso: string | null;
  porcentajeEsperado: number | null;
};

/** Recomendación del plan, en el orden de captura: Categoría, Indicador, Recomendación, Acciones, Metas, Área, Fecha. */
export type RecomendacionPlan = {
  id: string;
  numero: number;
  categoriaId: string;
  categoria: string;
  indicador: string;
  descripcion: string;
  /** Acciones para atender la recomendación */
  acciones: string[];
  metas: MetaPlan[];
  areaResponsable: string | null;
  /** AAAA-MM-DD */
  fechaCumplimiento: string | null;
  /** Observación del Administrador en la última devolución. */
  observacion: string | null;
};

export type RevisionResumen = {
  id?: string;
  decision: "APROBADO" | "DEVUELTO";
  comentario: string | null;
  revisor: string;
  fecha: string;
  observaciones?: Array<{ recomendacionId: string | null; comentario: string }>;
};

/** HU-04 · GET /planes/:id */
export type PlanDetalle = PlanResumen & {
  vigenciaInicio: string;
  vigenciaFin: string;
  /** true en BORRADOR o DEVUELTO */
  editable: boolean;
  /** Primera fecha permitida para configurar metas; debe ser superada, no igualada. */
  fechaMinimaMeta?: string;
  recomendacionesDetalle: RecomendacionPlan[];
  ultimaRevision: RevisionResumen | null;
  revisiones?: RevisionResumen[];
};

export type CicloResumen = { id: string; licenciatura: string; organismo: string; vigenciaInicio: string; vigenciaFin: string };

/** HU-04 · GET /planes/mio (plan null si aún no se captura nada en el ciclo vigente) */
export type MiPlan = { ciclo: CicloResumen; plan: PlanDetalle | null };

/** Meta con su avance real (seguimiento). */
export type Meta = {
  id: string;
  recomendacionId: string;
  descripcion: string;
  fechaCompromiso: string;
  porcentajeEsperado: number;
  porcentajeReal: number;
};

export type Evidencia = {
  id: string;
  metaId: string;
  nombreOriginal: string;
  tamano: string;
  estado: EstadoEvidencia;
  progreso: number;
  subidoEn?: string;
  mensajeError?: string;
};

export type InformeResumen = {
  id: string;
  licenciatura: string;
  periodo: string;
  metasReportadas: number;
  metasTotales: number;
  fechaEnvio: string;
  estado: EstadoDocumento;
};

export type ObservacionItem = { recomendacion: string; texto: string; atendida: boolean };

export type Devolucion = {
  id: string;
  fecha: string;
  documento: string;
  autor: string;
  mensaje: string;
  items: ObservacionItem[];
};

export type Notificacion = {
  id: string;
  tipo: TipoNotificacion;
  titulo: string;
  descripcion: string;
  fecha: string;
  leida: boolean;
  enlace: string;
};

export type EventoBitacora = {
  id: string;
  dia: string;
  hora: string;
  usuario: string;
  iniciales: string;
  rol: string;
  accion: string;
  entidad: string;
  cambio: string;
  estado?: EstadoBadge;
};

export type Incumplimiento = {
  licenciatura: string;
  meta: string;
  fechaCompromiso: string;
  esperado: number;
  real: number;
};

export type AtencionLicenciatura = { licenciatura: string; atendidas: number; enProceso: number; sinAtender: number };

export type AvanceLicenciatura = { licenciatura: string; real: number; esperado: number };

export type Sesion = { usuario: Usuario; token: string };

// ---------------------------------------------------------------------------
// Contratos de las historias en curso. Deben coincidir con los DTO del backend:
// ssm-backend/src/modules/{usuarios,planes,reportes}/*.module.ts
// Si cambias uno, cambia el otro en el mismo PR y avisa al equipo.
// ---------------------------------------------------------------------------

/** HU-02 · POST /usuarios */
export type CrearUsuarioPayload = {
  nombre: string;
  apellido: string;
  correo: string;
  rol: Exclude<Rol, "ADMINISTRADOR">;
  coordinacionId: string;
};

/** HU-02 · PATCH /usuarios/:id/asignacion */
export type CambiarAsignacionPayload = { rol: Exclude<Rol, "ADMINISTRADOR">; coordinacionId: string };

/** HU-02 · GET /usuarios/coordinaciones */
export type CoordinacionOpcion = {
  id: string;
  nombre: string;
  licenciaturaId: string;
  licenciatura: string;
};

/** HU-04 · GET /catalogos */
export type ItemCatalogo = { id: string; nombre: string };
export type Catalogos = { categorias: ItemCatalogo[]; areas: ItemCatalogo[]; organismos: ItemCatalogo[] };

/**
 * HU-04 · Guardar borrador: POST /ciclos/:cicloId/plan/recomendaciones (nueva) · PUT /recomendaciones/:id (existente).
 * Obligatorios en borrador: categoriaId, indicador y descripcion. Los demás se exigen al enviar a validación.
 */
export type RecomendacionPayload = {
  categoriaId: string;
  /** Texto abierto */
  indicador: string;
  descripcion: string;
  /** Acciones para atender la recomendación */
  acciones?: string[];
  metas?: string[];
  /** Texto abierto */
  areaResponsable?: string;
  /** AAAA-MM-DD, dentro de la vigencia del ciclo */
  fechaCumplimiento?: string;
};

/** HU-12 · PUT /recomendaciones/:id/metas (Configuración de Metas). Sin id = meta nueva. */
export type GuardarMetasPayload = {
  metas: { id?: string; descripcion: string; fechaCompromiso: string; porcentajeEsperado: number }[];
};

/** HU-05 · POST /planes/:id/devolver */
export type DevolverPlanPayload = { motivo: string; observaciones: { recomendacionId: string; comentario: string }[] };

// HU-15 · GET /reportes/atencion?licenciaturaId= → AtencionLicenciatura[] (definido arriba)
