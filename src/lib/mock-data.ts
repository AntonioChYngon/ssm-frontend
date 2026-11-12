// Datos de ejemplo (los mismos de las pantallas de Figma). Se usan mientras NEXT_PUBLIC_USE_MOCKS=true.
import type {
  AtencionLicenciatura,
  AvanceLicenciatura,
  Devolucion,
  Evidencia,
  EventoBitacora,
  Hito,
  Incumplimiento,
  InformeResumen,
  Notificacion,
  PlanResumen,
  Recomendacion,
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
  { id: "u2", nombre: "Jorge Ramírez", correo: "jorge.ramirez@acatlan.unam.mx", rol: "CAPTURISTA", licenciatura: "Actuaría", activo: true, ultimoAcceso: "Hoy 08:40" },
  { id: "u3", nombre: "Ana Torres", correo: "ana.torres@acatlan.unam.mx", rol: "AUXILIAR", licenciatura: "Actuaría", activo: true, ultimoAcceso: "Ayer 18:22" },
  { id: "u4", nombre: "Laura Méndez", correo: "laura.mendez@acatlan.unam.mx", rol: "CAPTURISTA", licenciatura: "Derecho", activo: true, ultimoAcceso: "Ayer 13:10" },
  { id: "u5", nombre: "Pablo Sánchez", correo: "pablo.sanchez@acatlan.unam.mx", rol: "CAPTURISTA", licenciatura: "Economía", activo: true, ultimoAcceso: "08/11/2026" },
  { id: "u6", nombre: "Rosa Cruz", correo: "rosa.cruz@acatlan.unam.mx", rol: "AUXILIAR", licenciatura: "Arquitectura", activo: false, ultimoAcceso: "14/09/2026" },
];

export const PLANES: PlanResumen[] = [
  { id: "actuaria", licenciatura: "Actuaría", organismo: "CONAC", ciclo: "2024–2029", recomendaciones: 12, avance: 68, estado: "EN_REVISION", actualizado: "10/11/2026" },
  { id: "derecho", licenciatura: "Derecho", organismo: "CONAED", ciclo: "2024–2029", recomendaciones: 15, avance: 91, estado: "VALIDADO", actualizado: "02/10/2026" },
  { id: "economia", licenciatura: "Economía", organismo: "CONACE", ciclo: "2024–2029", recomendaciones: 9, avance: 30, estado: "DEVUELTO", actualizado: "05/11/2026" },
  { id: "mac", licenciatura: "Matemáticas Aplicadas y Computación", organismo: "CONAIC", ciclo: "2024–2029", recomendaciones: 11, avance: 64, estado: "EN_REVISION", actualizado: "09/11/2026" },
  { id: "arquitectura", licenciatura: "Arquitectura", organismo: "ANPADEH", ciclo: "2024–2029", recomendaciones: 14, avance: 45, estado: "VALIDADO", actualizado: "18/09/2026" },
  { id: "rrii", licenciatura: "Relaciones Internacionales", organismo: "ACCECISO", ciclo: "2024–2029", recomendaciones: 8, avance: 72, estado: "VALIDADO", actualizado: "22/08/2026" },
  { id: "civil", licenciatura: "Ingeniería Civil", organismo: "CACEI", ciclo: "2024–2029", recomendaciones: 17, avance: 20, estado: "DEVUELTO", actualizado: "01/11/2026" },
  { id: "pedagogia", licenciatura: "Pedagogía", organismo: "CEPPE", ciclo: "2024–2029", recomendaciones: 10, avance: 0, estado: "BORRADOR", actualizado: "—" },
];

export const RECOMENDACIONES: Recomendacion[] = [
  { id: "r1", numero: 1, categoria: "Personal académico", criterio: "1.3 Perfil del profesorado", texto: "Incrementar el número de profesores de tiempo completo con posgrado en el área actuarial.", acciones: "Gestionar 2 plazas de PTC y apoyar la titulación de posgrado.", responsable: "Coordinación de Actuaría", fechaInicio: "15/01/2025", fechaTermino: "30/11/2026", hitos: 3, esperadoAlCorte: 60 },
  { id: "r2", numero: 2, categoria: "Plan de estudios", criterio: "4.2 Actualización del plan de estudios", texto: "Actualizar las asignaturas optativas para incluir ciencia de datos y modelos de riesgo.", acciones: "1) Diagnóstico con el Comité de Carrera. 2) Propuesta de 3 optativas nuevas. 3) Aprobación por el Consejo Técnico.", responsable: "Comité de Carrera", fechaInicio: "15/01/2025", fechaTermino: "30/06/2030", hitos: 4, esperadoAlCorte: 50, observacion: "Falta adjuntar el acta del Comité de Carrera que aprueba la actualización." },
  { id: "r3", numero: 3, categoria: "Infraestructura", criterio: "9.1 Laboratorios y equipo", texto: "Equipar el laboratorio de cómputo con software estadístico licenciado.", acciones: "Adquirir licencias y capacitar a docentes.", responsable: "Secretaría Administrativa", fechaInicio: "01/02/2025", fechaTermino: "15/12/2026", hitos: 2, esperadoAlCorte: 100 },
];

export const HITOS: Hito[] = [
  { id: "h1", recomendacionId: "r2", descripcion: "Diagnóstico con el Comité de Carrera", fechaCompromiso: "2025-06-30", porcentajeEsperado: 25, porcentajeReal: 25 },
  { id: "h2", recomendacionId: "r2", descripcion: "Propuesta de 3 optativas nuevas", fechaCompromiso: "2025-12-15", porcentajeEsperado: 50, porcentajeReal: 40 },
  { id: "h3", recomendacionId: "r2", descripcion: "Aprobación del Consejo Técnico", fechaCompromiso: "2026-06-30", porcentajeEsperado: 80, porcentajeReal: 0 },
  { id: "h4", recomendacionId: "r2", descripcion: "Primera impartición de optativas", fechaCompromiso: "2027-01-15", porcentajeEsperado: 90, porcentajeReal: 0 },
];

export const PROXIMOS_HITOS = [
  { hito: "Curso de ciencia de datos", recomendacion: "Recomendación 2", vence: "05/11/2026", real: 0, esperado: 30, estado: "Vencido" as const },
  { hito: "Actualizar optativas", recomendacion: "Recomendación 2", vence: "20/11/2026", real: 40, esperado: 50, estado: "Pendiente" as const },
  { hito: "Contratación de 2 PTC", recomendacion: "Recomendación 1", vence: "30/11/2026", real: 80, esperado: 90, estado: "Pendiente" as const },
  { hito: "Reporte de licencias", recomendacion: "Recomendación 3", vence: "15/12/2026", real: 100, esperado: 100, estado: "Completado" as const },
];

export const EVIDENCIAS_EN_PROCESO: Evidencia[] = [
  { id: "e1", hitoId: "h2", nombreOriginal: "acta_comite_carrera.docx", tamano: "245 KB", estado: "CONVIRTIENDO", progreso: 65 },
  { id: "e2", hitoId: "h2", nombreOriginal: "propuesta_optativas.xlsx", tamano: "88 KB", estado: "SUBIENDO", progreso: 30 },
  { id: "e3", hitoId: "h2", nombreOriginal: "foto_reunion_comite.jpg", tamano: "1.2 MB", estado: "LISTO", progreso: 100 },
  { id: "e4", hitoId: "h2", nombreOriginal: "presentacion_consejo.pptx", tamano: "4.8 MB", estado: "ERROR", progreso: 0, mensajeError: "No se pudo convertir. Guárdalo como PDF y reintenta." },
];

export const EVIDENCIAS_HITO = [
  { nombre: "minuta_diagnostico.pdf", fecha: "02/07/2025" },
  { nombre: "encuesta_egresados.pdf", fecha: "28/06/2025" },
  { nombre: "lista_asistencia.pdf", fecha: "28/06/2025" },
];

export const INFORMES: InformeResumen[] = [
  { id: "actuaria-2026-2", licenciatura: "Actuaría", periodo: "2026-2", hitosReportados: 10, hitosTotales: 12, fechaEnvio: "10/11/2026", estado: "EN_REVISION" },
  { id: "mac-2026-2", licenciatura: "Matemáticas Aplicadas y Comp.", periodo: "2026-2", hitosReportados: 8, hitosTotales: 11, fechaEnvio: "09/11/2026", estado: "EN_REVISION" },
  { id: "derecho-2026-2", licenciatura: "Derecho", periodo: "2026-2", hitosReportados: 15, hitosTotales: 15, fechaEnvio: "28/10/2026", estado: "VALIDADO" },
  { id: "rrii-2026-2", licenciatura: "Relaciones Internacionales", periodo: "2026-2", hitosReportados: 7, hitosTotales: 8, fechaEnvio: "25/10/2026", estado: "VALIDADO" },
  { id: "economia-2026-2", licenciatura: "Economía", periodo: "2026-2", hitosReportados: 3, hitosTotales: 9, fechaEnvio: "20/10/2026", estado: "DEVUELTO" },
  { id: "arquitectura-2026-2", licenciatura: "Arquitectura", periodo: "2026-2", hitosReportados: 11, hitosTotales: 14, fechaEnvio: "15/10/2026", estado: "VALIDADO" },
];

export const AVANCE_LICENCIATURAS: AvanceLicenciatura[] = [
  { licenciatura: "Actuaría", real: 82, esperado: 75 },
  { licenciatura: "Matemáticas Aplicadas y Comp.", real: 64, esperado: 70 },
  { licenciatura: "Arquitectura", real: 45, esperado: 60 },
  { licenciatura: "Derecho", real: 91, esperado: 80 },
  { licenciatura: "Economía", real: 30, esperado: 55 },
  { licenciatura: "Relaciones Internacionales", real: 72, esperado: 70 },
  { licenciatura: "Pedagogía", real: 58, esperado: 65 },
  { licenciatura: "Ingeniería Civil", real: 20, esperado: 50 },
];

export const INCUMPLIMIENTOS: Incumplimiento[] = [
  { licenciatura: "Ingeniería Civil", hito: "Actualizar laboratorio de materiales", fechaCompromiso: "08/11/2026", esperado: 60, real: 20 },
  { licenciatura: "Ingeniería Civil", hito: "Acervo bibliográfico", fechaCompromiso: "15/11/2026", esperado: 50, real: 25 },
  { licenciatura: "Economía", hito: "Programa de tutorías", fechaCompromiso: "15/11/2026", esperado: 55, real: 30 },
  { licenciatura: "Economía", hito: "Seguimiento de egresados", fechaCompromiso: "20/11/2026", esperado: 40, real: 10 },
  { licenciatura: "Arquitectura", hito: "Movilidad estudiantil", fechaCompromiso: "22/11/2026", esperado: 60, real: 45 },
  { licenciatura: "Pedagogía", hito: "Capacitación docente", fechaCompromiso: "30/11/2026", esperado: 65, real: 50 },
  { licenciatura: "Matemáticas Aplicadas y Comp.", hito: "Certificación de laboratorios", fechaCompromiso: "30/11/2026", esperado: 70, real: 55 },
];

export const ATENCION: AtencionLicenciatura[] = [
  { licenciatura: "Actuaría", atendidas: 7, enProceso: 4, sinAtender: 1 },
  { licenciatura: "Derecho", atendidas: 12, enProceso: 3, sinAtender: 0 },
  { licenciatura: "Economía", atendidas: 2, enProceso: 4, sinAtender: 3 },
  { licenciatura: "Matemáticas Aplicadas y Comp.", atendidas: 5, enProceso: 5, sinAtender: 1 },
  { licenciatura: "Arquitectura", atendidas: 6, enProceso: 6, sinAtender: 2 },
  { licenciatura: "Relaciones Internacionales", atendidas: 5, enProceso: 2, sinAtender: 1 },
  { licenciatura: "Ingeniería Civil", atendidas: 2, enProceso: 7, sinAtender: 4 },
  { licenciatura: "Pedagogía", atendidas: 3, enProceso: 0, sinAtender: 1 },
];

export const DEVOLUCIONES: Devolucion[] = [
  {
    id: "d1",
    fecha: "05/11/2026",
    documento: "Plan de mejora 2024–2029",
    autor: "Mtra. María González",
    mensaje: "Revisé el plan completo. Faltan evidencias de aprobación y hay fechas fuera del ciclo.",
    items: [
      { recomendacion: "Recomendación 2 · Plan de estudios", texto: "Falta adjuntar el acta del Comité de Carrera que aprueba la actualización.", atendida: false },
      { recomendacion: "Recomendación 4 · Vinculación", texto: "La fecha de término (30/06/2030) está fuera del ciclo de acreditación.", atendida: false },
      { recomendacion: "Recomendación 7 · Movilidad", texto: "Define al menos un hito con su % esperado.", atendida: false },
    ],
  },
  {
    id: "d2",
    fecha: "12/09/2026",
    documento: "Informe de seguimiento 2026-1",
    autor: "Mtra. María González",
    mensaje: "Buen avance. Solo ajusta dos porcentajes.",
    items: [
      { recomendacion: "Recomendación 1 · Personal académico", texto: "El % real del hito 2 no coincide con la evidencia.", atendida: true },
      { recomendacion: "Recomendación 3 · Infraestructura", texto: "Agrega la factura de las licencias.", atendida: true },
    ],
  },
];

export const NOTIFICACIONES: Notificacion[] = [
  { id: "n1", tipo: "VENCIMIENTO", titulo: "Hito vencido", descripcion: "“Curso de ciencia de datos” venció el 05/11/2026. Actualiza su avance.", fecha: "Hoy, 08:00", leida: false, enlace: "/licenciatura/hitos" },
  { id: "n2", tipo: "HITO", titulo: "Hito próximo", descripcion: "“Actualizar optativas” vence en 9 días (50% esperado).", fecha: "Hoy, 08:00", leida: false, enlace: "/licenciatura/hitos" },
  { id: "n3", tipo: "DEVOLUCION", titulo: "Plan devuelto", descripcion: "La Administradora devolvió tu plan con 3 observaciones.", fecha: "Ayer, 17:40", leida: false, enlace: "/licenciatura/observaciones" },
  { id: "n4", tipo: "HITO", titulo: "Hito próximo", descripcion: "“Contratación de 2 PTC” vence en 19 días (90% esperado).", fecha: "08/11/2026", leida: true, enlace: "/licenciatura/hitos" },
  { id: "n5", tipo: "DEVOLUCION", titulo: "Informe validado", descripcion: "Tu informe 2026-1 fue validado sin observaciones.", fecha: "28/10/2026", leida: true, enlace: "/licenciatura/observaciones" },
];

export const BITACORA: EventoBitacora[] = [
  { id: "b1", dia: "Hoy · 11 de noviembre de 2026", hora: "09:12", usuario: "María González", iniciales: "MG", rol: "Administradora", accion: "Validó el informe de seguimiento", entidad: "Relaciones Internacionales · 2026-2", cambio: "Estado: En revisión → Validado", estado: "Validado" },
  { id: "b2", dia: "Hoy · 11 de noviembre de 2026", hora: "08:47", usuario: "Jorge Ramírez", iniciales: "JR", rol: "Capturista · Actuaría", accion: "Envió el plan de mejora a validación", entidad: "Actuaría · Plan 2024–2029", cambio: "Estado: Borrador → En revisión", estado: "En revisión" },
  { id: "b3", dia: "Hoy · 11 de noviembre de 2026", hora: "08:30", usuario: "Ana Torres", iniciales: "AT", rol: "Auxiliar · Actuaría", accion: "Subió 3 evidencias (convertidas a PDF)", entidad: "Actuaría · Recomendación 2", cambio: "Archivos: acta.docx, lista.xlsx, foto.jpg", estado: "Completado" },
  { id: "b4", dia: "Ayer · 10 de noviembre de 2026", hora: "17:40", usuario: "María González", iniciales: "MG", rol: "Administradora", accion: "Devolvió el plan con 3 observaciones", entidad: "Economía · Plan 2024–2029", cambio: "Estado: En revisión → Devuelto", estado: "Devuelto" },
  { id: "b5", dia: "Ayer · 10 de noviembre de 2026", hora: "13:05", usuario: "María González", iniciales: "MG", rol: "Administradora", accion: "Restableció la contraseña de un usuario", entidad: "Usuario: rosa.cruz@acatlan.unam.mx", cambio: "Se envió contraseña temporal" },
];

export const HISTORICO = [
  { licenciatura: "Actuaría", organismo: "CONAC", recomendaciones: 14, atendidas: 93, resultado: "Reacreditada" },
  { licenciatura: "Derecho", organismo: "CONAED", recomendaciones: 16, atendidas: 100, resultado: "Reacreditada" },
  { licenciatura: "Economía", organismo: "CONACE", recomendaciones: 12, atendidas: 75, resultado: "Con observaciones" },
  { licenciatura: "Arquitectura", organismo: "ANPADEH", recomendaciones: 15, atendidas: 87, resultado: "Reacreditada" },
  { licenciatura: "Relaciones Internacionales", organismo: "ACCECISO", recomendaciones: 9, atendidas: 89, resultado: "Reacreditada" },
  { licenciatura: "Ingeniería Civil", organismo: "CACEI", recomendaciones: 18, atendidas: 72, resultado: "Con observaciones" },
];

export const TRANSVERSALES = [
  {
    grupo: "Infraestructura",
    resumen: "11 recomendaciones · 6 licenciaturas",
    items: [
      { texto: "Equipar laboratorio de cómputo con software estadístico licenciado.", licenciatura: "Actuaría" },
      { texto: "Actualizar el laboratorio de materiales y su equipo de medición.", licenciatura: "Ingeniería Civil" },
      { texto: "Ampliar el acervo bibliográfico digital especializado.", licenciatura: "Arquitectura" },
    ],
  },
  {
    grupo: "Personal académico",
    resumen: "14 recomendaciones · 8 licenciaturas",
    items: [
      { texto: "Incrementar profesores de tiempo completo con posgrado.", licenciatura: "Actuaría" },
      { texto: "Programa de formación docente en evaluación por competencias.", licenciatura: "Pedagogía" },
    ],
  },
];

export const ETIQUETAS = [
  { nombre: "Todas", total: 86 },
  { nombre: "Personal académico", total: 14 },
  { nombre: "Infraestructura", total: 11 },
  { nombre: "Plan de estudios", total: 9 },
  { nombre: "Vinculación", total: 7 },
  { nombre: "Investigación", total: 6 },
  { nombre: "Gestión administrativa", total: 5 },
  { nombre: "Sin etiqueta", total: 34 },
];
