// Datos de ejemplo (los mismos de las pantallas de Figma). Se usan mientras NEXT_PUBLIC_USE_MOCKS=true.
import type {
  AtencionLicenciatura,
  CicloResumen,
  EventoAuditoria,
  Incumplimiento,
  InformeDetalle,
  InformeResumen,
  MiInforme,
  Notificacion,
  RecordatoriosLicenciatura,
  PlanDetalle,
  PlanResumen,
  RecomendacionPlan,
  Usuario,
} from "./types";

export const LICENCIATURAS = [
  "Actuaría",
  "Arquitectura",
  "Derecho",
  "Economía",
  "Ingeniería Civil",
  "Matemáticas Aplicadas y Computación",
  "Pedagogía",
  "Relaciones Internacionales",
] as const;

export const CATEGORIAS = [
  "Personal académico",
  "Estudiantes",
  "Plan de estudios",
  "Evaluación del aprendizaje",
  "Formación integral",
  "Servicios de apoyo",
  "Vinculación",
  "Investigación",
  "Infraestructura",
  "Gestión administrativa",
] as const;

export const USUARIOS: Usuario[] = [
  { id: "u1", nombre: "María González", correo: "maria.gonzalez@acatlan.unam.mx", rol: "ADMINISTRADOR", licenciatura: null, activo: true, ultimoAcceso: "Hoy 09:05" },
  { id: "u2", nombre: "Jorge Ramírez", correo: "jorge.ramirez@acatlan.unam.mx", rol: "CAPTURA", licenciatura: "Actuaría", activo: true, ultimoAcceso: "Hoy 08:40" },
  { id: "u3", nombre: "Ana Torres", correo: "ana.torres@acatlan.unam.mx", rol: "AUXILIAR", licenciatura: "Actuaría", activo: true, ultimoAcceso: "Ayer 18:22" },
  { id: "u4", nombre: "Laura Méndez", correo: "laura.mendez@acatlan.unam.mx", rol: "CAPTURA", licenciatura: "Derecho", activo: true, ultimoAcceso: "Ayer 13:10" },
  { id: "u5", nombre: "Pablo Sánchez", correo: "pablo.sanchez@acatlan.unam.mx", rol: "CAPTURA", licenciatura: "Economía", activo: true, ultimoAcceso: "08/11/2026" },
  { id: "u6", nombre: "Rosa Cruz", correo: "rosa.cruz@acatlan.unam.mx", rol: "AUXILIAR", licenciatura: "Arquitectura", activo: false, ultimoAcceso: "14/09/2026" },
];

export const PLANES: PlanResumen[] = [
  { id: "actuaria", cicloId: "c-actuaria", licenciatura: "Actuaría", organismo: "CONAC", ciclo: "2024–2029", recomendaciones: 3, avance: 68, estado: "BORRADOR", actualizado: "10/11/2026" },
  { id: "derecho", cicloId: "c-derecho", licenciatura: "Derecho", organismo: "CONAED", ciclo: "2024–2029", recomendaciones: 15, avance: 91, estado: "APROBADO", actualizado: "02/10/2026" },
  { id: "economia", cicloId: "c-economia", licenciatura: "Economía", organismo: "CONACE", ciclo: "2024–2029", recomendaciones: 9, avance: 30, estado: "DEVUELTO", actualizado: "05/11/2026" },
  { id: "mac", cicloId: "c-mac", licenciatura: "Matemáticas Aplicadas y Computación", organismo: "CONAIC", ciclo: "2024–2029", recomendaciones: 11, avance: 64, estado: "EN_REVISION", actualizado: "09/11/2026" },
  { id: "arquitectura", cicloId: "c-arquitectura", licenciatura: "Arquitectura", organismo: "ANPADEH", ciclo: "2024–2029", recomendaciones: 14, avance: 45, estado: "APROBADO", actualizado: "18/09/2026" },
  { id: "rrii", cicloId: "c-rrii", licenciatura: "Relaciones Internacionales", organismo: "ACCECISO", ciclo: "2024–2029", recomendaciones: 8, avance: 72, estado: "APROBADO", actualizado: "22/08/2026" },
  { id: "civil", cicloId: "c-civil", licenciatura: "Ingeniería Civil", organismo: "CACEI", ciclo: "2024–2029", recomendaciones: 17, avance: 20, estado: "DEVUELTO", actualizado: "01/11/2026" },
  { id: "pedagogia", cicloId: "c-pedagogia", licenciatura: "Pedagogía", organismo: "CEPPE", ciclo: "2024–2029", recomendaciones: 10, avance: 0, estado: "BORRADOR", actualizado: "—" },
];

export const CICLO_ACTUARIA: CicloResumen = { id: "c-actuaria", nombre: "2024-2029", licenciatura: "Actuaría", organismo: "CONAC", vigenciaInicio: "2024-11-28", vigenciaFin: "2029-11-28", activo: true, mensaje: null };

export const RECOMENDACIONES: RecomendacionPlan[] = [
  {
    id: "r1", numero: 1, categoriaId: "1", categoria: "Personal académico", indicador: "1.3 Perfil del profesorado",
    descripcion: "Incrementar el número de profesores de tiempo completo con posgrado en el área actuarial.",
    acciones: ["Gestionar 2 plazas de PTC y apoyar la titulación de posgrado."],
    metas: [
      { id: "m1", descripcion: "Contratación de 2 PTC", fechaCompromiso: "2026-11-30", porcentajeEsperado: 90 },
    ],
    areaResponsable: "Coordinación de Actuaría", fechaCumplimiento: "2026-12-15", observacion: null,
  },
  {
    id: "r2", numero: 2, categoriaId: "3", categoria: "Plan de estudios", indicador: "4.2 Actualización del plan de estudios",
    descripcion: "Actualizar las asignaturas optativas para incluir ciencia de datos y modelos de riesgo.",
    acciones: ["1) Diagnóstico con el Comité de Carrera. 2) Propuesta de 3 optativas nuevas. 3) Aprobación por el Consejo Técnico."],
    metas: [
      { id: "m2", descripcion: "Diagnóstico con el Comité de Carrera", fechaCompromiso: "2025-06-30", porcentajeEsperado: 25 },
      { id: "m3", descripcion: "Propuesta de 3 optativas nuevas", fechaCompromiso: "2025-12-15", porcentajeEsperado: 50 },
      { id: "m4", descripcion: "Aprobación del Consejo Técnico", fechaCompromiso: "2026-06-30", porcentajeEsperado: 80 },
    ],
    areaResponsable: "Comité de Carrera", fechaCumplimiento: "2027-06-30", observacion: null,
  },
  {
    id: "r3", numero: 3, categoriaId: "9", categoria: "Infraestructura", indicador: "9.1 Laboratorios y equipo",
    descripcion: "Equipar el laboratorio de cómputo con software estadístico licenciado.",
    acciones: ["Adquirir licencias y capacitar a docentes."],
    metas: [{ id: "m5", descripcion: "Licencias instaladas en el laboratorio", fechaCompromiso: null, porcentajeEsperado: null }],
    areaResponsable: null, fechaCumplimiento: null, observacion: null,
  },
];

/** Plan de Actuaría en modo demostración (lo modifica src/lib/api.ts en memoria). */
export const PLAN_ACTUARIA: PlanDetalle = {
  ...PLANES[0]!,
  vigenciaInicio: CICLO_ACTUARIA.vigenciaInicio,
  vigenciaFin: CICLO_ACTUARIA.vigenciaFin,
  editable: true,
  recomendacionesDetalle: RECOMENDACIONES,
  ultimaRevision: null,
};

// ---------- Bloque Informe: mismos casos que db/datos_desarrollo.sql del backend ----------

const resumenInforme = (d: InformeDetalle): InformeResumen => ({
  id: d.id, informeId: d.informeId, cicloId: d.cicloId, licenciaturaId: d.licenciaturaId, licenciatura: d.licenciatura, ciclo: d.ciclo,
  periodo: d.periodo, fechaInicio: d.fechaInicio, fechaFin: d.fechaFin, fechaCorte: d.fechaCorte, estado: d.estado,
  enviadoEn: d.enviadoEn, aprobadoEn: d.aprobadoEn, recomendaciones: d.avances.length,
  conAvance: d.avances.filter((a) => a.porcentaje !== null).length,
  evidencias: d.avances.reduce((total, a) => total + a.evidencias.length, 0),
});

const META_EJEMPLO = [{ descripcion: "Cumplir el 100% de las actividades programadas", fechaCompromiso: "2026-06-30", porcentajeEsperado: 50 }];

const avanceEjemplo = (
  numero: number, recomendacion: string, porcentaje: number | null, extra: Partial<InformeDetalle["avances"][number]> = {},
): InformeDetalle["avances"][number] => ({
  recomendacionId: `rec-${numero}`, numero, categoria: "Plan de Estudios", indicador: "Pertinencia del plan de estudios",
  recomendacion, fechaCumplimiento: "2027-06-30", metas: META_EJEMPLO, esperadoAlCorte: 50, porcentaje,
  observaciones: porcentaje === null ? null : "Avance de ejemplo.", evidenciaObligatoria: porcentaje === 100, observacionRevision: null, evidencias: [],
  ...extra,
});

export const INFORMES_DETALLE: InformeDetalle[] = [
  {
    id: "inf-der-2027-1", informeId: "i-der-2027-1", cicloId: "c-derecho", licenciaturaId: "3", licenciatura: "Derecho", ciclo: "2024-2029",
    periodo: "2027-1", fechaInicio: "2026-08-01", fechaFin: "2027-01-31", fechaCorte: "2027-01-31", estado: "EN_REVISION",
    enviadoEn: "2026-11-20T16:00:00.000Z", aprobadoEn: null, recomendaciones: 4, conAvance: 4, evidencias: 3,
    organismo: "CONAED", vigenciaInicio: "2024-11-28", vigenciaFin: "2029-11-28", editable: false, bloqueo: "EN_REVISION",
    avances: [
      avanceEjemplo(1, "Actualizar los programas de asignatura del área procesal", 100, {
        evidencias: [
          { id: "ev1", origen: "ARCHIVO", nombre: "Programas publicados.pdf", tamano: 248_000, enlace: "/evidencias/ev1/archivo", externo: false, cargadaPor: "Coordinación Derecho", cargadaEn: "2026-11-10T15:15:00.000Z" },
          { id: "ev2", origen: "URL", nombre: "Sitio de la licenciatura", tamano: null, enlace: "https://www.acatlan.unam.mx/", externo: true, cargadaPor: "Coordinación Derecho", cargadaEn: "2026-11-10T15:20:00.000Z" },
        ],
      }),
      avanceEjemplo(2, "Incorporar prácticas de juicios orales en el plan de estudios", 60, {
        recomendacionId: "der-r2",
        observacionRevision: "Sube la guía de las prácticas diseñadas.",
        evidencias: [{ id: "ev3", origen: "ARCHIVO", nombre: "Guía de prácticas de juicios orales.pptx", tamano: 1_200_000, enlace: "/evidencias/ev3/archivo", externo: false, cargadaPor: "Coordinación Derecho", cargadaEn: "2026-11-18T19:00:00.000Z" }],
      }),
      avanceEjemplo(3, "Adquirir bibliografía especializada en derecho digital", 20),
      avanceEjemplo(4, "Suscribir bases de datos jurídicas en línea", 0, { observaciones: null }),
    ],
    ultimaRevision: { id: "rv1", decision: "DEVUELTO", comentario: "Falta soporte documental en una recomendación.", revisor: "Administración SSM", fecha: "15/11/2026", observaciones: [{ recomendacionId: "der-r2", comentario: "Sube la guía de las prácticas diseñadas." }] },
    revisiones: [{ id: "rv1", decision: "DEVUELTO", comentario: "Falta soporte documental en una recomendación.", revisor: "Administración SSM", fecha: "15/11/2026", observaciones: [{ recomendacionId: "der-r2", comentario: "Sube la guía de las prácticas diseñadas." }] }],
  },
  {
    id: "inf-eco-2027-1", informeId: "i-eco-2027-1", cicloId: "c-economia", licenciaturaId: "4", licenciatura: "Economía", ciclo: "2024-2029",
    periodo: "2027-1", fechaInicio: "2026-08-01", fechaFin: "2027-01-31", fechaCorte: "2027-01-31", estado: "BORRADOR",
    enviadoEn: null, aprobadoEn: null, recomendaciones: 3, conAvance: 2, evidencias: 0,
    organismo: "CIEES", vigenciaInicio: "2024-11-28", vigenciaFin: "2029-11-28", editable: true, bloqueo: null,
    avances: [
      avanceEjemplo(1, "Crear un sistema de seguimiento de egresados", 100, { observaciones: "Falta subir el reporte del sistema." }),
      avanceEjemplo(2, "Reducir el índice de reprobación en Matemáticas I", 50),
      avanceEjemplo(3, "Publicar resultados de investigación en revistas arbitradas", null),
    ],
    ultimaRevision: null, revisiones: [],
  },
  {
    id: "inf-eco-2026-2", informeId: "i-eco-2026-2", cicloId: "c-economia", licenciaturaId: "4", licenciatura: "Economía", ciclo: "2024-2029",
    periodo: "2026-2", fechaInicio: "2026-02-01", fechaFin: "2026-07-31", fechaCorte: "2026-07-31", estado: "APROBADO",
    enviadoEn: "2026-08-04T17:00:00.000Z", aprobadoEn: "2026-08-12T19:30:00.000Z", recomendaciones: 3, conAvance: 3, evidencias: 2,
    organismo: "CIEES", vigenciaInicio: "2024-11-28", vigenciaFin: "2029-11-28", editable: false, bloqueo: "APROBADO",
    avances: [
      avanceEjemplo(1, "Crear un sistema de seguimiento de egresados", 100, {
        evidencias: [{ id: "ev4", origen: "URL", nombre: "Tablero de egresados", tamano: null, enlace: "https://www.acatlan.unam.mx/", externo: true, cargadaPor: "Coordinación Economía", cargadaEn: "2026-07-22T16:00:00.000Z" }],
      }),
      avanceEjemplo(2, "Reducir el índice de reprobación en Matemáticas I", 100, {
        evidencias: [{ id: "ev5", origen: "ARCHIVO", nombre: "Reporte de reprobación 2026-2.xlsx", tamano: 96_000, enlace: "/evidencias/ev5/archivo", externo: false, cargadaPor: "Coordinación Economía", cargadaEn: "2026-07-25T22:30:00.000Z" }],
      }),
      avanceEjemplo(3, "Publicar resultados de investigación en revistas arbitradas", 75),
    ],
    ultimaRevision: { id: "rv2", decision: "APROBADO", comentario: null, revisor: "Administración SSM", fecha: "12/08/2026", observaciones: [] },
    revisiones: [{ id: "rv2", decision: "APROBADO", comentario: null, revisor: "Administración SSM", fecha: "12/08/2026", observaciones: [] }],
  },
];

export const INFORMES: InformeResumen[] = INFORMES_DETALLE.map(resumenInforme);

/** Pantalla de la coordinación (Actuaría) en modo demostración: plan aprobado e informe del semestre sin iniciar. */
export const MI_INFORME: MiInforme = {
  ciclo: CICLO_ACTUARIA,
  periodo: { nombre: "2027-1", fechaInicio: "2026-08-01", fechaFin: "2027-01-31", fechaCorte: "2027-01-31" },
  planAprobado: true,
  informe: null,
  anteriores: [],
};

export const INCUMPLIMIENTOS: Incumplimiento[] = [
  { id: "1:1", licenciaturaId: "1", licenciatura: "Ingeniería Civil", ciclo: "2024-2029", recomendacionId: "1", numeroRecomendacion: 1, indicador: "Infraestructura", recomendacion: "Actualizar los laboratorios", metaId: "1", meta: "Actualizar laboratorio de materiales", fechaCompromiso: "2026-11-08", porcentajeMeta: 60, esperado: 60, real: 20, brecha: 40 },
  { id: "2:2", licenciaturaId: "2", licenciatura: "Economía", ciclo: "2024-2029", recomendacionId: "2", numeroRecomendacion: 2, indicador: "Tutorías", recomendacion: "Fortalecer el acompañamiento", metaId: "2", meta: "Programa de tutorías", fechaCompromiso: "2026-11-15", porcentajeMeta: 55, esperado: 60, real: 30, brecha: 30 },
];

export const ATENCION: AtencionLicenciatura[] = [
  { licenciaturaId: "1", licenciatura: "Actuaría", atendidas: 7, enProceso: 4, sinAtender: 1 },
  { licenciaturaId: "2", licenciatura: "Derecho", atendidas: 12, enProceso: 3, sinAtender: 0 },
  { licenciaturaId: "3", licenciatura: "Economía", atendidas: 2, enProceso: 4, sinAtender: 3 },
  { licenciaturaId: "4", licenciatura: "Matemáticas Aplicadas y Comp.", atendidas: 5, enProceso: 5, sinAtender: 1 },
  { licenciaturaId: "5", licenciatura: "Arquitectura", atendidas: 6, enProceso: 6, sinAtender: 2 },
  { licenciaturaId: "6", licenciatura: "Relaciones Internacionales", atendidas: 5, enProceso: 2, sinAtender: 1 },
  { licenciaturaId: "7", licenciatura: "Ingeniería Civil", atendidas: 2, enProceso: 7, sinAtender: 4 },
  { licenciaturaId: "8", licenciatura: "Pedagogía", atendidas: 3, enProceso: 0, sinAtender: 1 },
];

export const RECORDATORIOS: RecordatoriosLicenciatura = {
  cicloActivo: true,
  diasAntes: 7,
  recordatorios: [
    { clave: "LIMITE:1:2026-12-15", tipo: "FECHA_LIMITE", recomendacionId: "1", indicador: "1.1 Formación docente", recomendacion: "Implementar un programa anual de actualización disciplinar", meta: "Cumplir el 100% de las actividades programadas", comprometido: 100, actual: 60, fechaHito: null, fechaLimite: "2026-12-15", diasRestantes: 5 },
    { clave: "REZAGO:2:2026-06-30:50", tipo: "REZAGO", recomendacionId: "2", indicador: "9.1 Laboratorios de cómputo", recomendacion: "Renovar el equipo de cómputo de los laboratorios", meta: "Equipo de dos laboratorios renovado", comprometido: 50, actual: 20, fechaHito: "2026-06-30", fechaLimite: "2028-06-30", diasRestantes: 580 },
  ],
};

export const NOTIFICACIONES: Notificacion[] = [
  { id: "n1", tipo: "VENCIMIENTO", titulo: "Meta vencida", descripcion: "“Curso de ciencia de datos” venció el 05/11/2026. Actualiza su avance.", fecha: "Hoy, 08:00", leida: false, enlace: "/licenciatura/metas" },
  { id: "n2", tipo: "META", titulo: "Meta próxima", descripcion: "“Actualizar optativas” vence en 9 días (50% esperado).", fecha: "Hoy, 08:00", leida: false, enlace: "/licenciatura/metas" },
  { id: "n3", tipo: "DEVOLUCION", titulo: "Plan devuelto", descripcion: "La Administradora devolvió tu plan con 3 observaciones.", fecha: "Ayer, 17:40", leida: false, enlace: "/licenciatura/plan" },
  { id: "n4", tipo: "META", titulo: "Meta próxima", descripcion: "“Contratación de 2 PTC” vence en 19 días (90% esperado).", fecha: "08/11/2026", leida: true, enlace: "/licenciatura/metas" },
  { id: "n5", tipo: "DEVOLUCION", titulo: "Informe validado", descripcion: "Tu informe 2026-1 fue validado sin observaciones.", fecha: "28/10/2026", leida: true, enlace: "/licenciatura/informe" },
];

const hace = (minutos: number) => new Date(Date.now() - minutos * 60_000).toISOString();
const ADMIN_DEMO = { id: "u1", nombre: "María González", correo: "admin.ssm@acatlan.unam.mx" };
const CAPTURA_DEMO = { id: "u2", nombre: "Coordinación Actuaría", correo: "actuaria@acatlan.unam.mx" };
const AUXILIAR_DEMO = { id: "u3", nombre: "Ana Torres", correo: "ana.torres@acatlan.unam.mx" };

/** HU-03 · Bitácora de ejemplo (del más reciente al más antiguo). */
export const BITACORA: EventoAuditoria[] = [
  { id: "b6", fecha: hace(12), usuario: ADMIN_DEMO, rol: "ADMINISTRADOR", tipo: "PLAN", accion: "Validó un informe de seguimiento", entidad: "version_informe", entidadId: "i1", campo: "estado", anterior: "EN_REVISION", nuevo: "APROBADO", contexto: "Economía · Informe de seguimiento 2026-2", licenciatura: "Economía" },
  { id: "b5", fecha: hace(40), usuario: AUXILIAR_DEMO, rol: "AUXILIAR", tipo: "PLAN", accion: "Agregó una evidencia al informe de seguimiento", entidad: "avance_recomendacion", entidadId: "r2", campo: "evidencia agregada · Informe 2027-1", anterior: null, nuevo: "acta_comite.docx → /Evidencias/Actuaría/2024-2029/Informe-2027-1/Rec-02/…", contexto: "Actuaría · Recomendación: Actualizar las asignaturas optativas…", licenciatura: "Actuaría" },
  { id: "b4", fecha: hace(42), usuario: AUXILIAR_DEMO, rol: "AUXILIAR", tipo: "PLAN", accion: "Actualizó el avance de una recomendación del informe", entidad: "avance_recomendacion", entidadId: "r2", campo: "porcentaje · Informe 2027-1", anterior: "40", nuevo: "60", contexto: "Actuaría · Recomendación: Actualizar las asignaturas optativas…", licenciatura: "Actuaría" },
  { id: "b3", fecha: hace(60 * 5), usuario: CAPTURA_DEMO, rol: "CAPTURA", tipo: "PLAN", accion: "Editó una recomendación del plan", entidad: "recomendacion", entidadId: "r1", campo: "fecha de cumplimiento", anterior: "2026-06-30", nuevo: "2026-12-15", contexto: "Actuaría · Recomendación: Incrementar el número de profesores…", licenciatura: "Actuaría" },
  { id: "b2", fecha: hace(60 * 26), usuario: ADMIN_DEMO, rol: "ADMINISTRADOR", tipo: "CICLOS", accion: "Inició un ciclo de acreditación", entidad: "ciclo_acreditacion", entidadId: "c1", campo: "alta", anterior: null, nuevo: "2024-2029", contexto: "Sociología · Ciclo 2024-2029", licenciatura: "Sociología" },
  { id: "b1", fecha: hace(60 * 27), usuario: CAPTURA_DEMO, rol: "CAPTURA", tipo: "SESION", accion: "Inicio de sesión", entidad: "usuario", entidadId: "u2", campo: "sesion", anterior: null, nuevo: "INICIO_SESION", contexto: "Cuenta: Coordinación Actuaría (actuaria@acatlan.unam.mx)", licenciatura: "Actuaría" },
];

