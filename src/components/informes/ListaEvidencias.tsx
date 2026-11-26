"use client";

// Bloque Informe · Evidencias de una recomendación (HU-08: abren en una pestaña nueva).
// La línea A (HU-07) agrega "Subir archivo", "Agregar enlace" y "Quitar" con la propiedad `acciones`.
import { useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { ApiError, descargarEvidencia } from "@/lib/api";
import { esEnlaceValido, fechaHoraLegible, tamanoLegible } from "@/lib/reglas-informe";
import type { EvidenciaInforme } from "@/lib/types";

/**
 * Archivo guardado por el backend: la pestaña se abre ANTES de pedir el PDF (si se abre después de un await,
 * el navegador la bloquea como ventana emergente) y luego se le carga el PDF como blob:.
 */
const abrirArchivo = async (evidencia: EvidenciaInforme) => {
  const pestana = window.open("", "_blank");
  try {
    const blob = await descargarEvidencia(evidencia.enlace);
    const url = URL.createObjectURL(blob);
    if (pestana) pestana.location.href = url;
    else window.location.assign(url);
    // Se libera cuando la pestaña ya cargó el PDF.
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (error) {
    pestana?.close();
    throw error;
  }
};

type Props = {
  evidencias: EvidenciaInforme[];
  /** Mensaje cuando no hay evidencias (p. ej. "Falta evidencia: está al 100 %"). */
  vacio?: ReactNode;
  /** Controles por evidencia (línea A: "Quitar"). */
  acciones?: (evidencia: EvidenciaInforme) => ReactNode;
};

export const ListaEvidencias = ({ evidencias, vacio, acciones }: Props) => {
  const [error, setError] = useState<string | null>(null);

  if (evidencias.length === 0) return <span className="t-small t-muted">{vacio ?? "Sin evidencias."}</span>;

  const abrir = (evidencia: EvidenciaInforme) => {
    setError(null);
    abrirArchivo(evidencia).catch((e) => setError(e instanceof ApiError ? e.message : "No pudimos abrir la evidencia."));
  };

  return (
    <div className="stack" style={{ gap: 6 }}>
      <ul className="stack" style={{ margin: 0, padding: 0, listStyle: "none", gap: 6 }}>
        {evidencias.map((e) => {
          const detalle = [e.origen === "ARCHIVO" ? `PDF${e.tamano ? ` · ${tamanoLegible(e.tamano)}` : ""}` : "Enlace", e.cargadaPor, fechaHoraLegible(e.cargadaEn)].join(" · ");
          return (
            <li key={e.id} className="row" style={{ gap: 8 }}>
              <Icon name={e.origen === "ARCHIVO" ? "documento" : "archivo"} size={18} className="t-primary" />
              <div className="stack grow" style={{ gap: 0 }}>
                {e.externo ? (
                  // Solo se pintan enlaces http(s); cualquier otro esquema se muestra como texto.
                  esEnlaceValido(e.enlace) ? (
                    <a href={e.enlace} target="_blank" rel="noopener noreferrer" className="t-medium">
                      {e.nombre} <span className="sr-only">(se abre en una pestaña nueva)</span>
                    </a>
                  ) : (
                    <span className="t-medium">{e.nombre} (enlace no válido)</span>
                  )
                ) : (
                  <button type="button" className="link-boton t-medium" onClick={() => abrir(e)}>
                    {e.nombre} <span className="sr-only">(se abre en una pestaña nueva)</span>
                  </button>
                )}
                <span className="t-small t-muted">{detalle}</span>
              </div>
              {acciones?.(e)}
            </li>
          );
        })}
      </ul>
      {error && <span className="t-small t-danger" role="alert">{error}</span>}
    </div>
  );
};
