// Contrato de datos compartido con ssm-backend (mismos nombres que los DTO de NestJS).
// Si cambias algo aquí, actualiza también ssm-backend/src/common/enums.ts y los DTO.

export type Rol = "ADMINISTRADOR" | "CAPTURA" | "AUXILIAR";
export type EstadoDocumento = "BORRADOR" | "EN_REVISION" | "DEVUELTO" | "VALIDADO";
export type EstadoEvidencia = "SUBIENDO" | "CONVIRTIENDO" | "LISTO" | "ERROR";
export type TipoNotificacion = "VENCIMIENTO" | "HITO" | "DEVOLUCION";
export type CanalNotificacion = "CORREO" | "IN_APP" | "AMBOS";

export type EstadoBadge = "Completado" | "Validado" | "Pendiente" | "En revisión" | "Devuelto" | "Vencido" | "Borrador" | "Nuevo";

export const ESTADO_DOCUMENTO_BADGE: Record<EstadoDocumento, EstadoBadge> = {
  BORRADOR: "Borrador",
  EN_REVISION: "En revisión",
  DEVUELTO: "Devuelto",
  VALIDADO: "Validado",
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
  /** Solo en el listado de usuarios del Administrador. */
  ultimoAcceso?: string;
};

export type PlanResumen = {
  id: string;
  licenciatura: string;
  organismo: string;
  ciclo: string;
  recomendaciones: number;
  avance: number;
  estado: EstadoDocumento;
  actualizado: string;
};

export type Recomendacion = {
  id: string;
  numero: number;
  categoria: string;
  criterio: string;
  texto: string;
  acciones: string;
  responsable: string;
  fechaInicio: string;
  fechaTermino: string;
  hitos: number;
  esperadoAlCorte: number;
  observacion?: string;
};

export type Hito = {
  id: string;
  recomendacionId: string;
  descripcion: string;
  fechaCompromiso: string;
  porcentajeEsperado: number;
  porcentajeReal: number;
};

export type Evidencia = {
  id: string;
  hitoId: string;
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
  hitosReportados: number;
  hitosTotales: number;
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
  hito: string;
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

/** HU-04 · GET /catalogos */
export type ItemCatalogo = { id: string; nombre: string };
export type Catalogos = { categorias: ItemCatalogo[]; areas: ItemCatalogo[]; organismos: ItemCatalogo[]; licenciaturas: ItemCatalogo[] };

/** HU-04 · GET /ciclos (solo Administradora): un ciclo de acreditación con el estado de su plan. */
export type CicloResumen = {
  id: string;
  licenciatura: ItemCatalogo;
  organismo: ItemCatalogo;
  /** AAAA-MM-DD. Todas las escribe la Administradora (decisión D7). */
  fechaEmision: string;
  vigenciaInicio: string;
  vigenciaFin: string;
  estado: "VIGENTE" | "CERRADO" | "HISTORICO";
  referenciaConstancia: string | null;
  plan: { versionId: string; numero: number; estado: EstadoVersionPlan; recomendaciones: number } | null;
};

/** HU-04 · POST /ciclos y PATCH /ciclos/:cicloId */
export type CicloPayload = {
  licenciaturaId: string;
  organismoId: string;
  fechaEmision: string;
  vigenciaInicio: string;
  vigenciaFin: string;
  referenciaConstancia?: string;
};

/** Estados de version_plan en el backend (CHECK ck_plan_estado). */
export type EstadoVersionPlan = "BORRADOR" | "EN_REVISION" | "APROBADO" | "DEVUELTO";

export const ESTADO_VERSION_BADGE: Record<EstadoVersionPlan, EstadoBadge> = {
  BORRADOR: "Borrador",
  EN_REVISION: "En revisión",
  APROBADO: "Validado",
  DEVUELTO: "Devuelto",
};

/** Una recomendación con todo lo que muestra la tabla "Plan de Mejora Continua" (Anexo 1). */
export type RecomendacionPlan = {
  id: string;
  descripcion: string;
  acciones: string[];
  /** Cada meta expresa su objetivo en porcentaje (decisión D2). */
  metas: string[];
  areas: ItemCatalogo[];
  /** AAAA-MM-DD */
  fechaCumplimiento: string;
  etiquetaFecha: string | null;
};

export type IndicadorPlan = {
  id: string;
  clave: string | null;
  descripcion: string;
  categoria: ItemCatalogo;
  recomendaciones: RecomendacionPlan[];
};

/** HU-04 · GET /mi-plan y GET /ciclos/:cicloId/plan. `version` es null si el ciclo aún no tiene plan. */
export type PlanDeMejora = {
  cicloId: string;
  licenciatura: string;
  organismo: string;
  /** AAAA-MM-DD: la fecha de cumplimiento debe quedar dentro de este rango. */
  vigenciaInicio: string;
  vigenciaFin: string;
  version: { id: string; numero: number; estado: EstadoVersionPlan; editable: boolean } | null;
  indicadores: IndicadorPlan[];
};

/** HU-04 · POST /ciclos/:cicloId/plan/recomendaciones (indicadorId o indicador nuevo) → RecomendacionPlan */
export type NuevaRecomendacionPayload = {
  categoriaId: string;
  indicadorId?: string;
  indicador?: string;
  descripcion: string;
  acciones: string[];
  metas: string[];
  areaIds: string[];
  /** AAAA-MM-DD, dentro de la vigencia del ciclo */
  fechaCumplimiento: string;
  etiquetaFecha?: string;
};

// HU-15 · GET /reportes/atencion?licenciaturaId= → AtencionLicenciatura[] (definido arriba)
