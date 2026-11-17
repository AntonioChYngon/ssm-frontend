// Reglas que el formulario revisa antes de llamar al backend. El backend aplica las mismas
// (ssm-backend/src/modules/planes/reglas.ts); si cambias una, cambia la otra. Ver docs/decisiones.md del backend.

/** Porcentajes escritos como "80%", "80 %", "12.5%" o "12,5%". */
const PORCENTAJE = /(\d{1,3}(?:[.,]\d{1,2})?)\s*%/g;

/** D2 · Cada meta expresa su objetivo en porcentaje, de 0% a 100%. Regresa el error o null. */
export const errorMetaMedible = (meta: string): string | null => {
  const porcentajes = [...meta.matchAll(PORCENTAJE)].map((m) => Number((m[1] ?? "").replace(",", ".")));
  if (porcentajes.length === 0) return `"${meta.slice(0, 40)}" debe indicar su objetivo en porcentaje (por ejemplo, "Capacitar al 80% de la planta docente").`;
  if (porcentajes.some((p) => p > 100)) return `El porcentaje de "${meta.slice(0, 40)}" debe estar entre 0% y 100%.`;
  return null;
};

/** Una línea por elemento, sin vacíos. */
export const lineas = (texto: string) => texto.split("\n").map((l) => l.trim()).filter(Boolean);

/** AAAA-MM-DD → DD/MM/AAAA */
export const fechaCorta = (fecha: string) => fecha.split("-").reverse().join("/");

/** AAAA-MM-DD y una fecha real del calendario. */
export const esFechaValida = (fecha: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const d = new Date(`${fecha}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === fecha;
};

export const VIGENCIA_MAXIMA_ANIOS = 5;

const sumarAnios = (fecha: string, anios: number) => `${Number(fecha.slice(0, 4)) + anios}${fecha.slice(4)}`;

/** D7 · Vigencia escrita por la Administradora. Regresa el error o null (misma regla que el backend). */
export const errorVigencia = (f: { fechaEmision: string; vigenciaInicio: string; vigenciaFin: string }): string | null => {
  if (![f.fechaEmision, f.vigenciaInicio, f.vigenciaFin].every(esFechaValida)) return "Escribe la fecha de emisión y las dos fechas de la vigencia.";
  if (f.vigenciaFin <= f.vigenciaInicio) return "La vigencia debe terminar después de la fecha de inicio.";
  if (f.vigenciaFin > sumarAnios(f.vigenciaInicio, VIGENCIA_MAXIMA_ANIOS)) return `La vigencia no puede durar más de ${VIGENCIA_MAXIMA_ANIOS} años.`;
  if (f.fechaEmision > f.vigenciaFin) return "La fecha de emisión debe ser anterior al fin de la vigencia.";
  return null;
};
