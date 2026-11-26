"use client";

// HU-09 · Descargar el Informe de Seguimiento en PDF y Word, con membrete y evidencias como hipervínculos.
import { DescargasReporte } from "@/components/reportes/DescargasReporte";
import { descargarReporteInforme, nombreReporteInforme } from "@/lib/api";

type Props = {
  informe: { id: string; licenciatura: string; periodo: string };
  onAviso: (aviso: { tipo: "exito" | "error"; texto: string }) => void;
  disabled?: boolean;
};

export const DescargasInforme = ({ informe, ...resto }: Props) => (
  <DescargasReporte
    documento="Informe de Seguimiento"
    descargar={(formato) => descargarReporteInforme(informe.id, formato)}
    nombreArchivo={(formato) => nombreReporteInforme(informe, formato)}
    {...resto}
  />
);
