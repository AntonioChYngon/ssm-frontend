"use client";

// HU-13 · Selector de una, varias o todas las licenciaturas (solo Administrador). La selección se guarda en la URL
// (?licenciaturas=1,2) para compartirla y conservarla al recargar. Captura y Auxiliar no lo ven: el backend ya
// limita sus consultas a su licenciatura.
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Field";
import { leerUsuarioSesion, obtenerCatalogos } from "@/lib/api";
import type { ItemCatalogo } from "@/lib/types";

const PARAMETRO = "licenciaturas";

const leerDeUrl = () => {
  if (typeof window === "undefined") return [];
  const valor = new URLSearchParams(window.location.search).get(PARAMETRO) ?? "";
  return valor.split(",").filter((id) => /^\d+$/.test(id));
};

/**
 * Ids seleccionados (vacío = todas) sincronizados con la URL sin recargar la página.
 * Se usa window.history en lugar de useSearchParams para no obligar a envolver cada pantalla en Suspense.
 */
export const useLicenciaturasEnUrl = () => {
  const [ids, setIds] = useState<string[]>([]);
  const [listo, setListo] = useState(false);
  useEffect(() => {
    setIds(leerDeUrl());
    setListo(true);
  }, []);
  const cambiar = useCallback((nuevos: string[]) => {
    setIds(nuevos);
    const url = new URL(window.location.href);
    if (nuevos.length) url.searchParams.set(PARAMETRO, nuevos.join(","));
    else url.searchParams.delete(PARAMETRO);
    window.history.replaceState(null, "", url.toString());
  }, []);
  /** Valor para el parámetro licenciaturaIds del API (undefined = todas). */
  const parametro = ids.length ? ids.join(",") : undefined;
  return { ids, cambiar, parametro, listo };
};

type Props = { seleccion: string[]; alCambiar: (ids: string[]) => void };

export const SelectorLicenciaturas = ({ seleccion, alCambiar }: Props) => {
  const [opciones, setOpciones] = useState<ItemCatalogo[]>([]);
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef<HTMLDivElement | null>(null);
  const panelId = useId();
  // Se lee la sesión después de montar (en el servidor no hay sessionStorage) para no romper la hidratación.
  const [esAdministrador, setEsAdministrador] = useState(false);

  useEffect(() => {
    setEsAdministrador(leerUsuarioSesion()?.rol === "ADMINISTRADOR");
    obtenerCatalogos().then((c) => setOpciones(c.licenciaturas)).catch(() => setOpciones([]));
  }, []);

  // Cierra al hacer clic fuera o con Escape.
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      if (contenedor.current && !contenedor.current.contains(e.target as Node)) setAbierto(false);
    };
    const escape = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", escape);
    };
  }, [abierto]);

  if (!esAdministrador) return null;

  const todas = seleccion.length === 0;
  const etiqueta = todas
    ? "Todas las licenciaturas"
    : seleccion.length === 1
      ? opciones.find((o) => o.id === seleccion[0])?.nombre ?? "1 licenciatura"
      : `${seleccion.length} licenciaturas`;
  const alternar = (id: string) => alCambiar(seleccion.includes(id) ? seleccion.filter((x) => x !== id) : [...seleccion, id]);

  return (
    <div ref={contenedor} className="stack" style={{ gap: 4, position: "relative", minWidth: 260 }}>
      <span className="field__label">Licenciaturas</span>
      <Button variant="contorno" icon="filtro" aria-expanded={abierto} aria-controls={panelId} onClick={() => setAbierto((v) => !v)}>
        {etiqueta}
      </Button>
      {abierto && (
        <div
          id={panelId}
          role="group"
          aria-label="Elegir licenciaturas"
          className="card"
          style={{ position: "absolute", top: "100%", left: 0, zIndex: 20, marginTop: 4, width: 320, maxHeight: 360, overflowY: "auto", gap: 6 }}
        >
          <Checkbox label="Todas las licenciaturas" checked={todas} onChange={() => alCambiar([])} />
          <hr style={{ border: 0, borderTop: "1px solid var(--color-gray-200)", margin: "4px 0" }} />
          {opciones.map((o) => (
            <Checkbox key={o.id} label={o.nombre} checked={seleccion.includes(o.id)} onChange={() => alternar(o.id)} />
          ))}
          {opciones.length === 0 && <span className="t-small t-muted">Cargando licenciaturas…</span>}
        </div>
      )}
    </div>
  );
};
