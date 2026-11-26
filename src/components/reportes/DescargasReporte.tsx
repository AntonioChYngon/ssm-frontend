"use client";

// HU-06 / HU-09 · Botones "Descargar PDF" y "Descargar Word" para los reportes con membrete institucional.
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { guardarArchivo, usaMocks, type FormatoReporte } from "@/lib/api";

type Props = {
  /** Qué se descarga, para los mensajes: "Plan de Mejora Continua", "Informe de Seguimiento". */
  documento: string;
  descargar: (formato: FormatoReporte) => Promise<Blob>;
  nombreArchivo: (formato: FormatoReporte) => string;
  /** Mensaje para la pantalla (éxito o error). */
  onAviso: (aviso: { tipo: "exito" | "error"; texto: string }) => void;
  /** Modo demostración: alternativa para el PDF (por ejemplo, imprimir la tabla del navegador). */
  pdfDemo?: () => void;
  disabled?: boolean;
};

const ETIQUETA: Record<FormatoReporte, string> = { pdf: "PDF", docx: "Word" };

export const DescargasReporte = ({ documento, descargar, nombreArchivo, onAviso, pdfDemo, disabled }: Props) => {
  const [descargando, setDescargando] = useState<FormatoReporte | null>(null);

  const obtener = async (formato: FormatoReporte) => {
    setDescargando(formato);
    try {
      if (usaMocks() && formato === "pdf" && pdfDemo) {
        pdfDemo();
        onAviso({ tipo: "exito", texto: "Se abrió el reporte para imprimir o guardarlo como PDF." });
        return;
      }
      guardarArchivo(await descargar(formato), nombreArchivo(formato));
      onAviso({ tipo: "exito", texto: `${documento} descargado en ${ETIQUETA[formato]}.` });
    } catch (error) {
      onAviso({ tipo: "error", texto: error instanceof Error ? error.message : `No pudimos generar el documento en ${ETIQUETA[formato]}.` });
    } finally {
      setDescargando(null);
    }
  };

  return (
    <>
      <Button variant="contorno" icon="descargar" onClick={() => void obtener("pdf")} disabled={disabled || descargando !== null}>
        {descargando === "pdf" ? "Generando…" : "Descargar PDF"}
      </Button>
      <Button variant="contorno" icon="documento" onClick={() => void obtener("docx")} disabled={disabled || descargando !== null}>
        {descargando === "docx" ? "Generando…" : "Descargar Word"}
      </Button>
    </>
  );
};
