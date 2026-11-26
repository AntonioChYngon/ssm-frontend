"use client";

// HU-06 · Descargar el Plan de Mejora Continua en PDF y Word. Lo usan la coordinación (captura) y el Administrador (revisión).
import { DescargasReporte } from "@/components/reportes/DescargasReporte";
import { descargarReportePlan, nombreReportePlan } from "@/lib/api";

type Props = {
  plan: { id: string; licenciatura: string; ciclo: string };
  onAviso: (aviso: { tipo: "exito" | "error"; texto: string }) => void;
  /** Modo demostración: alternativa para el PDF (imprimir la tabla del navegador). */
  pdfDemo?: () => void;
  disabled?: boolean;
};

export const DescargasPlan = ({ plan, ...resto }: Props) => (
  <DescargasReporte
    documento="Plan de Mejora Continua"
    descargar={(formato) => descargarReportePlan(plan.id, formato)}
    nombreArchivo={(formato) => nombreReportePlan(plan, formato)}
    {...resto}
  />
);
