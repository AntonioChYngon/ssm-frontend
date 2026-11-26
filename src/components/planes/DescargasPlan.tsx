"use client";

// HU-06 · Botones para descargar el Plan de Mejora Continua en PDF y en Word (editable), con membrete institucional.
// Los usan la coordinación (captura del plan) y el Administrador (revisión del plan).
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { descargarReportePlan, guardarArchivo, nombreReportePlan, usaMocks, type FormatoReporte } from "@/lib/api";

type Props = {
  plan: { id: string; licenciatura: string; ciclo: string };
  /** Mensaje para la pantalla (éxito o error). */
  onAviso: (aviso: { tipo: "exito" | "error"; texto: string }) => void;
  /** Modo demostración: alternativa para el PDF (por ejemplo, imprimir la tabla del navegador). */
  pdfDemo?: () => void;
  disabled?: boolean;
};

const ETIQUETA: Record<FormatoReporte, string> = { pdf: "PDF", docx: "Word" };

export const DescargasPlan = ({ plan, onAviso, pdfDemo, disabled }: Props) => {
  const [descargando, setDescargando] = useState<FormatoReporte | null>(null);

  const descargar = async (formato: FormatoReporte) => {
    setDescargando(formato);
    try {
      if (usaMocks() && formato === "pdf" && pdfDemo) {
        pdfDemo();
        onAviso({ tipo: "exito", texto: "Se abrió el reporte para imprimir o guardarlo como PDF." });
        return;
      }
      guardarArchivo(await descargarReportePlan(plan.id, formato), nombreReportePlan(plan, formato));
      onAviso({ tipo: "exito", texto: `Plan de Mejora Continua descargado en ${ETIQUETA[formato]}.` });
    } catch (error) {
      onAviso({ tipo: "error", texto: error instanceof Error ? error.message : `No pudimos generar el reporte en ${ETIQUETA[formato]}.` });
    } finally {
      setDescargando(null);
    }
  };

  return (
    <>
      <Button variant="contorno" icon="descargar" onClick={() => void descargar("pdf")} disabled={disabled || descargando !== null}>
        {descargando === "pdf" ? "Generando…" : "Descargar PDF"}
      </Button>
      <Button variant="contorno" icon="documento" onClick={() => void descargar("docx")} disabled={disabled || descargando !== null}>
        {descargando === "docx" ? "Generando…" : "Descargar Word"}
      </Button>
    </>
  );
};
