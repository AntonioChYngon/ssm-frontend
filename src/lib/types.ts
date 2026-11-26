// Contrato de datos compartido con ssm-backend (mismos nombres que los DTO de NestJS).
// Si cambias algo aquí, actualiza también ssm-backend/src/common/enums.ts y los DTO.

export type Rol = "ADMINISTRADOR" | "CAPTURA" | "AUXILIAR";
export type EstadoEvidencia = "SUBIENDO" | "CONVIRTIENDO" | "LISTO" | "ERROR";
export type TipoNotificacion = "VENCIMIENTO" | "META" | "DEVOLUCION" | "PLAN";

export type EstadoBadge = "Completado" | "Validado" | "Pendiente" | "En revisión" | "En validación" | "Devuelto" | "Vencido" | "Borrador" | "Nuevo";

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
  /** Fecha de alta en el sistema (ISO 8601); viene de GET /auth/me. */
  creadoEn?: string;
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

export type CicloResumen = {
  id: string;
  /** HU-18: p. ej. "2024-2029". */
  nombre: string;
  licenciatura: string;
  organismo: string;
  vigenciaInicio: string;
  vigenciaFin: string;
  /** false cuando ya pasó la fecha de fin: la captura queda bloqueada y se muestra `mensaje`. */
  activo: boolean;
  mensaje: string | null;
};

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

/** HU-07 · Archivo en la cola de subida de la pantalla del informe (estado local, no viene del servidor). */
export type SubidaEvidencia = {
  id: string;
  recomendacionId: string;
  nombreOriginal: string;
  tamano: string;
  estado: EstadoEvidencia;
  progreso: number;
  subidoEn?: string;
  mensajeError?: string;
};

// ---------------------------------------------------------------------------
// Bloque Informe de Seguimiento (HU-07, HU-08, HU-11). Debe coincidir con ssm-backend/src/modules/informes/contrato.ts.
// ---------------------------------------------------------------------------

/** Mismos códigos que version_informe.estado. */
export type EstadoInforme = "BORRADOR" | "EN_REVISION" | "APROBADO" | "DEVUELTO";

export const ESTADO_INFORME_BADGE: Record<EstadoInforme, EstadoBadge> = {
  BORRADOR: "Borrador",
  EN_REVISION: "En revisión",
  APROBADO: "Validado",
  DEVUELTO: "Devuelto",
};

/** Por qué la coordinación no puede editar. Lo calcula solo el backend. */
export type BloqueoInforme = "CICLO_CERRADO" | "EN_REVISION" | "APROBADO";

/** GET /informes. id = version_informe_id. */
export type InformeResumen = {
  id: string;
  informeId: string;
  cicloId: string;
  licenciaturaId: string;
  licenciatura: string;
  ciclo: string;
  /** Semestre: "2027-1". */
  periodo: string;
  fechaInicio: string;
  fechaFin: string;
  fechaCorte: string;
  estado: EstadoInforme;
  /** ISO 8601 */
  enviadoEn: string | null;
  aprobadoEn: string | null;
  recomendaciones: number;
  conAvance: number;
  evidencias: number;
};

export type EvidenciaInforme = {
  id: string;
  origen: "ARCHIVO" | "URL";
  nombre: string;
  /** Bytes del PDF; null en enlaces. */
  tamano: number | null;
  /**
   * externo = true: URL que se abre directo en una pestaña nueva (enlace o Drive).
   * externo = false: ruta del API (/evidencias/:id/archivo) que se descarga con la sesión y se abre como blob:.
   */
  enlace: string;
  externo: boolean;
  cargadaPor: string;
  /** ISO 8601 */
  cargadaEn: string;
};

export type MetaInforme = { descripcion: string; fechaCompromiso: string | null; porcentajeEsperado: number | null };

export type AvanceDetalle = {
  recomendacionId: string;
  numero: number;
  categoria: string;
  indicador: string;
  recomendacion: string;
  fechaCumplimiento: string | null;
  metas: MetaInforme[];
  /** Mayor % esperado de las metas que vencen hasta el corte (null si ninguna). */
  esperadoAlCorte: number | null;
  /** null = aún no se captura. */
  porcentaje: number | null;
  observaciones: string | null;
  /** true al 100 %: necesita al menos una evidencia para enviar. */
  evidenciaObligatoria: boolean;
  /** Observación del Administrador en la última devolución o reapertura. */
  observacionRevision: string | null;
  evidencias: EvidenciaInforme[];
};

/** GET /informes/:id (y respuesta de toda acción que modifica el informe). */
export type InformeDetalle = InformeResumen & {
  organismo: string;
  vigenciaInicio: string;
  vigenciaFin: string;
  editable: boolean;
  bloqueo: BloqueoInforme | null;
  avances: AvanceDetalle[];
  ultimaRevision: RevisionResumen | null;
  revisiones: RevisionResumen[];
};

export type PeriodoActual = { nombre: string; fechaInicio: string; fechaFin: string; fechaCorte: string };

/** GET /informes/mio */
export type MiInforme = {
  ciclo: CicloResumen;
  /** Semestre en curso (null si hoy está fuera de la vigencia). */
  periodo: PeriodoActual | null;
  /** Sin plan aprobado no se puede iniciar el informe. */
  planAprobado: boolean;
  /** Informe del semestre en curso (null si aún no se inicia). */
  informe: InformeDetalle | null;
  /** Semestres anteriores del mismo ciclo, del más reciente al más antiguo. */
  anteriores: InformeResumen[];
};

/** HU-07 · PUT /informes/:id/avances/:recomendacionId */
export type AvancePayload = { porcentaje: number; observaciones?: string };
/** HU-07 · POST /informes/:id/avances/:recomendacionId/enlaces */
export type EnlacePayload = { url: string; nombre?: string };

/** HU-08 · POST /informes/:id/devolver y /reabrir */
export type DevolverInformePayload = { motivo: string; observaciones?: Array<{ recomendacionId: string; comentario: string }> };

export type FiltrosInformes = {
  estado?: EstadoInforme;
  licenciaturaId?: string;
  /** HU-13: ids separados por coma. */
  licenciaturaIds?: string;
  cicloId?: string;
  periodo?: string;
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

/** HU-03 · Área de la bitácora (filtro "Tipo de acción"). */
export type AreaBitacora = "SESIONES" | "CUENTAS" | "PLAN" | "INFORME" | "CICLOS";

/** HU-03 · GET /auditoria y GET /auditoria/recomendaciones/:id (debe coincidir con ssm-backend/src/modules/auditoria/bitacora.ts). */
export type EventoAuditoria = {
  id: string;
  /** ISO 8601 */
  fecha: string;
  usuario: { id: string; nombre: string; correo: string };
  rol: string;
  tipo: TipoActividad;
  accion: string;
  entidad: string;
  entidadId: string;
  campo: string;
  anterior: string | null;
  nuevo: string | null;
  /** "Economía · Recomendación: …" (null si lo modificado ya no existe). */
  contexto: string | null;
  licenciatura: string | null;
};

export type PaginaBitacora = { total: number; pagina: number; limite: number; eventos: EventoAuditoria[] };

export type FiltrosBitacora = {
  rol?: Rol;
  area?: AreaBitacora;
  /** AAAA-MM-DD */
  desde?: string;
  hasta?: string;
  q?: string;
  /** HU-13: ids separados por coma. */
  licenciaturaIds?: string;
  pagina?: number;
  limite?: number;
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
export type Catalogos = { categorias: ItemCatalogo[]; areas: ItemCatalogo[]; organismos: ItemCatalogo[]; licenciaturas: ItemCatalogo[] };

/** HU-18 · GET /ciclos (Administrador): ciclos de cada licenciatura con su carpeta y el estado de su plan. */
export type CicloAdministracion = {
  id: string;
  nombre: string;
  licenciatura: ItemCatalogo;
  organismo: ItemCatalogo;
  /** AAAA-MM-DD */
  fechaEmision: string;
  vigenciaInicio: string;
  vigenciaFin: string;
  estado: "VIGENTE" | "CERRADO" | "HISTORICO";
  activo: boolean;
  referenciaConstancia: string | null;
  carpeta: { ruta: string; url: string | null } | null;
  plan: { versionId: string; numero: number; estado: EstadoPlan; recomendaciones: number } | null;
};

/** HU-18 · POST /ciclos y PATCH /ciclos/:id. Sin nombre, el backend usa "AAAA-AAAA". */
export type CicloPayload = {
  licenciaturaId: string;
  organismoId: string;
  nombre?: string;
  fechaEmision: string;
  vigenciaInicio: string;
  vigenciaFin: string;
  referenciaConstancia?: string;
};

/**
 * HU-04 · Guardar borrador: POST /ciclos/:cicloId/plan/recomendaciones (nueva) · PUT /recomendaciones/:id (existente).
 * Obligatorios en borrador: categoriaId, indicador y descripcion. Los demás se exigen al enviar a validación.
 */
/** Meta capturada en la pantalla del plan. */
export type MetaPayload = { descripcion: string; fechaCompromiso: string | null; porcentajeEsperado: number | null };

export type RecomendacionPayload = {
  categoriaId: string;
  /** Texto abierto */
  indicador: string;
  descripcion: string;
  /** Acciones para atender la recomendación */
  acciones?: string[];
  /** HU-04/HU-12: fecha y % se pueden capturar aquí o después en Metas (null = sin configurar). */
  metas?: MetaPayload[];
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

/** Mi perfil · GET /auth/actividad: últimos movimientos de la propia cuenta. */
export type TipoActividad = "SESION" | "SEGURIDAD" | "PLAN" | "CUENTAS" | "CICLOS" | "OTRO";
export type Actividad = { id: string; tipo: TipoActividad; descripcion: string; fecha: string };
