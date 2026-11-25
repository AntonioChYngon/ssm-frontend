"use client";

// Bloque Informe · Estado de la pantalla. El servidor manda: cada acción devuelve el InformeDetalle completo
// y el hook reemplaza el estado; la interfaz nunca recalcula reglas (editable, bloqueo, % esperado).
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, obtenerInforme, obtenerMiInforme } from "@/lib/api";
import type { InformeDetalle, MiInforme } from "@/lib/types";

export const MENSAJE_CAMBIO_ESTADO = "El informe cambió de estado mientras tanto. Se recargó con la información más reciente.";

const mensajeDe = (error: unknown, porDefecto: string) => (error instanceof ApiError ? error.message : porDefecto);

type Estado<T> = {
  datos: T | null;
  cargando: boolean;
  /** Error al cargar (la pantalla no tiene datos que mostrar). */
  error: string | null;
  /** Error o aviso de la última acción; la pantalla sigue mostrando los datos. */
  aviso: string | null;
  /** true mientras corre una acción (para deshabilitar botones). */
  ocupado: boolean;
};

/**
 * Carga `cargar()` al montar y expone `ejecutar(accion)`: corre una acción del API que devuelve el informe
 * actualizado y lo integra con `integrar`. Ante 409 avisa y recarga; ante otro error lo deja en `aviso`.
 */
const useDocumento = <T,>(cargar: () => Promise<T>, integrar: (actual: T, informe: InformeDetalle) => T) => {
  const [estado, setEstado] = useState<Estado<T>>({ datos: null, cargando: true, error: null, aviso: null, ocupado: false });
  const cargarRef = useRef(cargar);
  cargarRef.current = cargar;

  const recargar = useCallback(async (aviso: string | null = null) => {
    setEstado((e) => ({ ...e, cargando: e.datos === null }));
    try {
      const datos = await cargarRef.current();
      setEstado({ datos, cargando: false, error: null, aviso, ocupado: false });
    } catch (error) {
      setEstado((e) => ({ ...e, cargando: false, ocupado: false, error: e.datos ? null : mensajeDe(error, "No pudimos cargar el informe."), aviso: e.datos ? mensajeDe(error, "No pudimos actualizar el informe.") : null }));
    }
  }, []);

  // Se vuelve a cargar si cambia la fuente (p. ej. otro id en la misma pantalla).
  useEffect(() => {
    void recargar();
  }, [recargar, cargar]);

  /** Devuelve true si la acción se completó. */
  const ejecutar = useCallback(
    async (accion: () => Promise<InformeDetalle>): Promise<boolean> => {
      setEstado((e) => ({ ...e, ocupado: true, aviso: null }));
      try {
        const informe = await accion();
        setEstado((e) => ({ ...e, ocupado: false, datos: e.datos ? integrar(e.datos, informe) : e.datos }));
        return true;
      } catch (error) {
        if (error instanceof ApiError && error.status === 409) {
          await recargar(`${error.message} ${MENSAJE_CAMBIO_ESTADO}`);
        } else {
          setEstado((e) => ({ ...e, ocupado: false, aviso: mensajeDe(error, "No pudimos completar la operación. Intenta de nuevo.") }));
        }
        return false;
      }
    },
    [integrar, recargar],
  );

  const cerrarAviso = useCallback(() => setEstado((e) => ({ ...e, aviso: null })), []);

  return { ...estado, recargar: () => recargar(), ejecutar, cerrarAviso };
};

const reemplazar = (_: InformeDetalle, informe: InformeDetalle) => informe;
const enMiInforme = (actual: MiInforme, informe: InformeDetalle): MiInforme => ({ ...actual, informe });

/** Administrador y consulta por id: /admin/informes/[id]. */
export const useInforme = (id: string) => {
  const cargar = useCallback(() => obtenerInforme(id), [id]);
  const { datos, ...resto } = useDocumento(cargar, reemplazar);
  return { informe: datos, ...resto };
};

/** Coordinación: /licenciatura/informe (ciclo, semestre en curso, su informe y los anteriores). */
export const useMiInforme = () => {
  const { datos, ...resto } = useDocumento(obtenerMiInforme, enMiInforme);
  return { mio: datos, ...resto };
};
