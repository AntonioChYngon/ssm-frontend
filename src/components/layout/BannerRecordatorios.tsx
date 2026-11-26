"use client";

// HU-10 · Banner destacado al iniciar sesión con los recordatorios de la licenciatura: fechas límite próximas, fechas
// vencidas y rezagos contra los hitos. Lo calcula el backend en el momento (GET /recordatorios), así que desaparece en
// cuanto se captura el avance. "Ocultar" lo esconde en esta sesión hasta que aparezca un recordatorio nuevo.
import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { obtenerRecordatorios } from "@/lib/api";
import type { Recordatorio, TipoRecordatorio } from "@/lib/types";

const CLAVE_OCULTOS = "ssm.recordatorios.ocultos";

const ETIQUETA: Record<TipoRecordatorio, string> = {
  FECHA_LIMITE: "Fecha límite próxima",
  VENCIDA: "Fecha límite vencida",
  REZAGO: "Rezago detectado",
};

const fechaLegible = (fecha: string) => fecha.split("-").reverse().join("/");

const plazo = (dias: number | null) => {
  if (dias === null) return "";
  if (dias < 0) return ` (venció hace ${-dias} ${dias === -1 ? "día" : "días"})`;
  if (dias === 0) return " (vence hoy)";
  return dias === 1 ? " (falta 1 día)" : ` (faltan ${dias} días)`;
};

const firma = (lista: Recordatorio[]) => lista.map((r) => r.clave).sort().join("|");

const leerOcultos = () => {
  try {
    return window.sessionStorage.getItem(CLAVE_OCULTOS);
  } catch {
    return null;
  }
};

const resumen = (lista: Recordatorio[]) =>
  (["FECHA_LIMITE", "VENCIDA", "REZAGO"] as const)
    .map((tipo) => [tipo, lista.filter((r) => r.tipo === tipo).length] as const)
    .filter(([, n]) => n > 0)
    .map(([tipo, n]) => `${ETIQUETA[tipo]}: ${n}`)
    .join(" · ");

export const BannerRecordatorios = () => {
  const [recordatorios, setRecordatorios] = useState<Recordatorio[]>([]);
  const [oculto, setOculto] = useState(true);

  useEffect(() => {
    let vigente = true;
    obtenerRecordatorios()
      .then(({ recordatorios: lista }) => {
        if (!vigente) return;
        setRecordatorios(lista);
        setOculto(leerOcultos() === firma(lista));
      })
      // Sin recordatorios no se muestra nada; un error aquí no debe estorbar el resto de la pantalla.
      .catch(() => { if (vigente) setRecordatorios([]); });
    return () => { vigente = false; };
  }, []);

  if (oculto || recordatorios.length === 0) return null;

  const ocultar = () => {
    try {
      window.sessionStorage.setItem(CLAVE_OCULTOS, firma(recordatorios));
    } catch {
      // Sin sessionStorage solo se oculta mientras la pantalla siga abierta.
    }
    setOculto(true);
  };

  const n = recordatorios.length;
  return (
    <section className="alert alert--advertencia recordatorios" role="status" aria-label="Recordatorios de seguimiento">
      <Icon name="reloj" size={22} />
      <div className="recordatorios__cuerpo">
        <strong>{n === 1 ? "Tienes 1 recordatorio de seguimiento" : `Tienes ${n} recordatorios de seguimiento`}</strong>
        <div className="t-small">{resumen(recordatorios)}</div>
        <details>
          <summary>Ver detalle</summary>
          <ul className="recordatorios__lista">
            {recordatorios.map((r) => (
              <li key={r.clave}>
                <div className="t-medium">{ETIQUETA[r.tipo]} · {r.indicador}</div>
                <div>{r.recomendacion}</div>
                <div className="t-small">Meta pendiente: {r.meta}</div>
                <div className="t-small">
                  % comprometido: {r.comprometido} % · % actual: {r.actual} %
                  {r.fechaHito && <> · Hito: {fechaLegible(r.fechaHito)}</>}
                  {" · "}Fecha límite: {r.fechaLimite ? fechaLegible(r.fechaLimite) + plazo(r.diasRestantes) : "sin fecha"}
                </div>
              </li>
            ))}
          </ul>
        </details>
        <div className="t-small">
          <Link href="/licenciatura/informe">Capturar avances</Link>. Puedes seguir capturando avances y evidencias aunque la fecha ya haya pasado.
        </div>
      </div>
      <button type="button" className="recordatorios__cerrar" aria-label="Ocultar recordatorios" onClick={ocultar}>
        <Icon name="cerrar" size={20} />
      </button>
    </section>
  );
};
