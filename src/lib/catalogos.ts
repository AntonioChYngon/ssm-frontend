// Catálogos oficiales del SSM: copia de ssm-backend/db/ssm_mariadb.sql (categorías) y db/catalogos_base.sql (lo demás).
// Con backend, la fuente de verdad es GET /catalogos. Esta copia solo alimenta el modo demostración.
// Si cambias un catálogo en el backend, cámbialo aquí también.

export const CATEGORIAS = [
  "Personal Académico",
  "Estudiantes",
  "Plan de Estudios",
  "Evaluación del Aprendizaje",
  "Formación Integral",
  "Servicios de Apoyo para el Aprendizaje",
  "Vinculación y Extensión",
  "Investigación",
  "Infraestructura y Equipamiento",
  "Gestión y Administración",
] as const;

export const LICENCIATURAS = [
  "Actuaría",
  "Arquitectura",
  "Ciencia de Datos",
  "Ciencias Políticas y Administración Pública",
  "Comunicación",
  "Derecho",
  "Derecho (Sistema de Universidad Abierta)",
  "Diseño Gráfico",
  "Economía",
  "Enseñanza de Inglés",
  "Enseñanza de Idioma como Lengua Extranjera",
  "Filosofía",
  "Historia",
  "Ingeniería Civil",
  "Lengua y Literatura Hispánicas",
  "Matemáticas Aplicadas y Computación",
  "Pedagogía",
  "Relaciones Internacionales",
  "Relaciones Internacionales (Sistema de Universidad Abierta)",
  "Sociología",
] as const;

export const ORGANISMOS = [
  "Consejo para la Acreditación de la Enseñanza del Derecho, A.C.",
  "Asociación para la Acreditación y Certificación de Ciencias Sociales, A.C.",
  "Comité para la Evaluación de Programas de Pedagogía y Educación, A.C.",
  "Consejo para la Acreditación de Programas Educativos en Humanidades, A.C.",
  "Consejo de Acreditación de la Comunicación, A.C.",
  "Consejo Nacional para la Acreditación de la Ciencia Económica, A.C.",
  "Consejo Nacional de Acreditación en Informática y Computación, A.C.",
  "Consejo de Acreditación de la Enseñanza de la Ingeniería, A.C.",
  "Acreditadora Nacional de Programas de Arquitectura y Disciplinas del Espacio Habitable, A.C.",
  "Consejo Mexicano para la Acreditación de Programas de Diseño, A.C.",
  "Comités Interinstitucionales para la Evaluación de la Educación Superior, A.C.",
] as const;

export const AREAS: readonly string[] = [
  "Secretaría General",
  "Secretaría Administrativa",
  "Unidad de Planeación",
  "Coordinación de Servicios Académicos",
  "Coordinación de Posgrado",
  "Unidad de Investigación Multidisciplinaria Aplicada",
  "División del SUAyED",
  "División de Ciencias Jurídicas",
  "División de Ciencias Socioeconómicas",
  "División de Diseño y Edificación",
  "División de Matemáticas e Ingeniería",
  ...LICENCIATURAS.map((l) => `Coordinación de ${l}`),
];
