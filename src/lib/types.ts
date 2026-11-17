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

export type CoordinacionOpcion = { id: string; nombre: string; licenciaturaId: string; licenciatura: string };

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
export type Catalogos = { categorias: ItemCatalogo[]; areas: ItemCatalogo[]; organismos: ItemCatalogo[] };

/** HU-04 · POST /ciclos/:cicloId/plan/recomendaciones (indicadorId o indicador nuevo) */
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
