// Bloque Informe · Validaciones de la interfaz. Solo sirven para mostrar el error antes de enviar:
// la regla que manda es la del backend (ssm-backend/src/modules/informes/reglas.ts).

export const MENSAJE_PORCENTAJE = "El avance debe ser un número entero de 0 a 100.";

/** El % se escribe con teclado: entero de 0 a 100. Devuelve el número o el mensaje de error. */
export const leerPorcentaje = (texto: string): { valor: number } | { error: string } => {
  const limpio = texto.trim();
  if (!/^\d{1,3}$/.test(limpio)) return { error: MENSAJE_PORCENTAJE };
  const valor = Number(limpio);
  return valor <= 100 ? { valor } : { error: MENSAJE_PORCENTAJE };
};

export const EXTENSIONES_EVIDENCIA = [".pdf", ".docx", ".xlsx", ".pptx"] as const;
/** Mismo valor por defecto que EVIDENCIA_MAX_MB del backend. */
export const MB_EVIDENCIA = 15;

/** Revisa extensión y peso de un archivo antes de subirlo. null = válido. */
export const errorArchivo = (archivo: { name: string; size: number }): string | null => {
  const extension = archivo.name.slice(archivo.name.lastIndexOf(".")).toLowerCase();
  if (!(EXTENSIONES_EVIDENCIA as readonly string[]).includes(extension)) return "Solo se aceptan archivos .pdf, .docx, .xlsx o .pptx.";
  if (archivo.size === 0) return "El archivo está vacío.";
  if (archivo.size > MB_EVIDENCIA * 1024 * 1024) return `El archivo pesa más de ${MB_EVIDENCIA} MB.`;
  return null;
};

/** Plan B: solo enlaces http(s) completos. */
export const esEnlaceValido = (texto: string) => {
  try {
    const url = new URL(texto.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

/** 245 KB · 4.8 MB */
export const tamanoLegible = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

/** 2027-01-31 → 31/01/2027 */
export const fechaLegible = (iso: string | null) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : "—");

/** ISO con hora → 20/11/2026, 10:00 (hora de la Ciudad de México). */
export const fechaHoraLegible = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("es-MX", { dateStyle: "short", timeStyle: "short", timeZone: "America/Mexico_City" }).format(new Date(iso)) : "—";
