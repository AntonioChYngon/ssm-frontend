"use client";

// HU-07 · Agregar evidencias a una recomendación: archivo (Plan A: se convierte a PDF en el servidor) o enlace (Plan B).
// Cada archivo tiene su fila en la cola: SUBIENDO (barra de progreso) → CONVIRTIENDO → LISTO | ERROR (reintentar o usar enlace).
import { useRef, useState } from "react";
import { Button, IconButton } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Display";
import { TextField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { ApiError, agregarEnlaceEvidencia, subirEvidenciaInforme } from "@/lib/api";
import { EXTENSIONES_EVIDENCIA, MB_EVIDENCIA, errorArchivo, esEnlaceValido, tamanoLegible } from "@/lib/reglas-informe";
import type { AvanceDetalle, InformeDetalle, SubidaEvidencia } from "@/lib/types";

type Props = {
  informeId: string;
  avance: AvanceDetalle;
  /** Integra el informe que devuelve el servidor. */
  aplicar: (informe: InformeDetalle) => void;
  /** Para 409 (el informe cambió de estado): la pantalla recarga y avisa. */
  alConflicto: (mensaje: string) => void;
};

type Subida = SubidaEvidencia & { archivo: File };

const ETIQUETA: Record<SubidaEvidencia["estado"], string> = {
  SUBIENDO: "Subiendo…",
  CONVIRTIENDO: "Convirtiendo a PDF…",
  LISTO: "Listo",
  ERROR: "No se pudo agregar",
};

export const CargaEvidencias = ({ informeId, avance, aplicar, alConflicto }: Props) => {
  const input = useRef<HTMLInputElement | null>(null);
  const [cola, setCola] = useState<Subida[]>([]);
  const [conEnlace, setConEnlace] = useState(false);
  const [url, setUrl] = useState("");
  const [nombre, setNombre] = useState("");
  const [errorEnlace, setErrorEnlace] = useState<string | null>(null);
  const [guardandoEnlace, setGuardandoEnlace] = useState(false);
  const sinAvance = avance.porcentaje === null;

  const actualizar = (id: string, cambio: Partial<Subida>) => setCola((c) => c.map((s) => (s.id === id ? { ...s, ...cambio } : s)));

  const subir = async (subida: Subida) => {
    actualizar(subida.id, { estado: "SUBIENDO", progreso: 0, mensajeError: undefined });
    try {
      const informe = await subirEvidenciaInforme(informeId, avance.recomendacionId, subida.archivo, (progreso) =>
        actualizar(subida.id, { progreso, estado: progreso >= 100 ? "CONVIRTIENDO" : "SUBIENDO" }),
      );
      actualizar(subida.id, { estado: "LISTO", progreso: 100 });
      aplicar(informe);
      // La evidencia ya aparece en la lista; la fila de la cola se retira poco después.
      window.setTimeout(() => setCola((c) => c.filter((s) => s.id !== subida.id)), 2500);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setCola((c) => c.filter((s) => s.id !== subida.id));
        alConflicto(error.message);
        return;
      }
      actualizar(subida.id, { estado: "ERROR", mensajeError: error instanceof ApiError ? error.message : "No pudimos subir el archivo." });
      // Si falla la conversión o la carpeta (503), se ofrece de una vez el enlace (Plan B).
      if (error instanceof ApiError && error.status === 503) setConEnlace(true);
    }
  };

  const agregarArchivos = (lista: FileList | null) => {
    if (!lista) return;
    const nuevas: Subida[] = Array.from(lista).map((archivo) => {
      const problema = errorArchivo(archivo);
      return {
        id: crypto.randomUUID(),
        recomendacionId: avance.recomendacionId,
        nombreOriginal: archivo.name,
        tamano: tamanoLegible(archivo.size),
        estado: problema ? "ERROR" : "SUBIENDO",
        progreso: 0,
        mensajeError: problema ?? undefined,
        archivo,
      };
    });
    setCola((c) => [...nuevas, ...c]);
    // Una a la vez: el servidor convierte un archivo por vez.
    void nuevas.filter((s) => s.estado !== "ERROR").reduce((anterior, s) => anterior.then(() => subir(s)), Promise.resolve());
    if (input.current) input.current.value = "";
  };

  const guardarEnlace = async () => {
    if (!esEnlaceValido(url)) {
      setErrorEnlace("Escribe un enlace completo que empiece con http:// o https://.");
      return;
    }
    setErrorEnlace(null);
    setGuardandoEnlace(true);
    try {
      aplicar(await agregarEnlaceEvidencia(informeId, avance.recomendacionId, { url: url.trim(), nombre: nombre.trim() || undefined }));
      setUrl("");
      setNombre("");
      setConEnlace(false);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) alConflicto(error.message);
      else setErrorEnlace(error instanceof ApiError ? error.message : "No pudimos guardar el enlace.");
    } finally {
      setGuardandoEnlace(false);
    }
  };

  if (sinAvance) {
    return <span className="t-small t-muted">Guarda primero el % de avance para poder agregar evidencias.</span>;
  }

  return (
    <div className="stack" style={{ gap: 10, marginTop: 8 }}>
      <div className="row row--wrap" style={{ gap: 8 }}>
        <input
          ref={input}
          type="file"
          className="sr-only"
          accept={EXTENSIONES_EVIDENCIA.join(",")}
          multiple
          aria-label={`Subir evidencias de la recomendación ${avance.numero}`}
          onChange={(e) => agregarArchivos(e.target.files)}
        />
        <Button variant="contorno" icon="subir" onClick={() => input.current?.click()}>Subir archivo</Button>
        <Button variant="texto" icon="archivo" onClick={() => setConEnlace((v) => !v)} aria-expanded={conEnlace}>Agregar enlace</Button>
        <span className="t-small t-muted">PDF, Word, Excel o PowerPoint, hasta {MB_EVIDENCIA} MB. Se guardan como PDF.</span>
      </div>

      {cola.length > 0 && (
        <ul className="stack" style={{ margin: 0, padding: 0, listStyle: "none", gap: 8 }} aria-label="Archivos en carga">
          {cola.map((s) => (
            <li key={s.id} className="row muted-box" style={{ gap: 10, padding: "8px 12px" }}>
              <Icon name={s.estado === "ERROR" ? "alerta" : s.estado === "LISTO" ? "check" : "cargando"} size={18} className={s.estado === "ERROR" ? "t-danger" : "t-primary"} />
              <div className="stack grow" style={{ gap: 4 }}>
                <span className="t-medium">{s.nombreOriginal} <span className="t-small t-muted">· {s.tamano}</span></span>
                {s.estado === "ERROR" ? (
                  <span className="t-small t-danger" role="alert">{s.mensajeError}</span>
                ) : (
                  <div className="row" style={{ gap: 8 }} aria-live="polite">
                    {s.estado === "SUBIENDO" && <Progress value={s.progreso} width={160} />}
                    <span className="t-small t-muted">{ETIQUETA[s.estado]}</span>
                  </div>
                )}
              </div>
              {s.estado === "ERROR" && !errorArchivo(s.archivo) && (
                <Button variant="texto" icon="restablecer" onClick={() => void subir(s)}>Reintentar</Button>
              )}
              {s.estado === "ERROR" && (
                <IconButton icon="cerrar" label={`Quitar ${s.nombreOriginal} de la lista`} onClick={() => setCola((c) => c.filter((x) => x.id !== s.id))} />
              )}
            </li>
          ))}
        </ul>
      )}

      {conEnlace && (
        <div className="stack muted-box" style={{ gap: 8, padding: 12 }}>
          <span className="t-small t-muted">Usa un enlace si el archivo ya está en Drive u otro sitio, o si la conversión falló.</span>
          <div className="row row--top row--responsive" style={{ gap: 12 }}>
            <div className="grow">
              <TextField label="Enlace de la evidencia" type="url" placeholder="https://…" value={url} error={errorEnlace ?? undefined} onChange={(e) => { setUrl(e.target.value); setErrorEnlace(null); }} />
            </div>
            <div style={{ width: 240 }}>
              <TextField label="Nombre (opcional)" placeholder="Ej. Acta del comité" value={nombre} maxLength={255} onChange={(e) => setNombre(e.target.value)} />
            </div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <Button icon="check" disabled={guardandoEnlace || !url.trim()} onClick={() => void guardarEnlace()}>Guardar enlace</Button>
            <Button variant="texto" onClick={() => { setConEnlace(false); setErrorEnlace(null); }}>Cancelar</Button>
          </div>
        </div>
      )}
    </div>
  );
};
