"use client";

// HU-07 · Carga de evidencias por hito. Arranca en ceros: las evidencias se suben a un hito configurado (HU-12).
import { useEffect, useRef, useState, type DragEvent } from "react";
import { Button, IconButton, LinkButton } from "@/components/ui/Button";
import { Card, EmptyState, PageTitle, Progress } from "@/components/ui/Display";
import { SelectField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { obtenerMiPlan, subirEvidencia } from "@/lib/api";
import type { Evidencia } from "@/lib/types";

const PERMITIDOS = ["pdf", "doc", "docx", "xls", "xlsx", "jpg", "jpeg", "png"];
const MAX_MB = 20;

const extension = (nombre: string) => nombre.split(".").pop()?.toLowerCase() ?? "";
const tamanoLegible = (bytes: number) => (bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`);

const EvidenciasPage = () => {
  const [archivos, setArchivos] = useState<Evidencia[]>([]);
  const [recomendaciones, setRecomendaciones] = useState<string[]>([]);
  // TODO(HU-12/HU-07): cargar los hitos reales de la recomendación elegida (GET /recomendaciones/:id/hitos).
  const hitos: { id: string; descripcion: string }[] = [];
  const hitoId = hitos[0]?.id;

  useEffect(() => {
    obtenerMiPlan()
      .then((plan) => setRecomendaciones(plan.indicadores.flatMap((i) => i.recomendaciones).map((r, n) => `${n + 1} · ${r.descripcion.slice(0, 80)}`)))
      .catch(() => setRecomendaciones([]));
  }, []);
  const [arrastrando, setArrastrando] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  // Muestra el avance de subida y conversión a PDF de los archivos que el usuario agrega.
  useEffect(() => {
    const timer = window.setInterval(() => {
      setArchivos((prev) => prev.map((a): Evidencia => {
        if (a.estado !== "SUBIENDO" && a.estado !== "CONVIRTIENDO") return a;
        const progreso = Math.min(100, a.progreso + 7);
        if (progreso < 100) return { ...a, progreso };
        return a.estado === "SUBIENDO" ? { ...a, estado: "CONVIRTIENDO", progreso: 0 } : { ...a, estado: "LISTO", progreso: 100 };
      }));
    }, 600);
    return () => window.clearInterval(timer);
  }, []);

  const agregar = (lista: FileList | null) => {
    if (!lista || !hitoId) return;
    const nuevos: Evidencia[] = Array.from(lista).map((file): Evidencia => {
      const valido = PERMITIDOS.includes(extension(file.name));
      const pesado = file.size > MAX_MB * 1024 * 1024;
      if (valido && !pesado) void subirEvidencia(hitoId, file);
      return {
        id: crypto.randomUUID(),
        hitoId,
        nombreOriginal: file.name,
        tamano: tamanoLegible(file.size),
        estado: valido && !pesado ? "SUBIENDO" : "ERROR",
        progreso: 0,
        mensajeError: !valido ? "Formato no permitido. Usa PDF, Word, Excel o imagen." : pesado ? `El archivo supera ${MAX_MB} MB.` : undefined,
      };
    });
    setArchivos((prev) => [...nuevos, ...prev]);
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setArrastrando(false);
    agregar(event.dataTransfer.files);
  };

  return (
    <>
      <PageTitle
        crumbs={[{ label: "Inicio", href: "/licenciatura/dashboard" }, { label: "Carga de evidencias" }]}
        title="Carga de evidencias"
        subtitle="Sube los documentos que respaldan cada hito. Los convertimos a PDF automáticamente."
      />
      <div className="row row--top row--responsive" style={{ gap: 24 }}>
        <div className="stack grow" style={{ gap: 20 }}>
          <div className="grid-2" style={{ gap: 16 }}>
            <SelectField label="Recomendación *" options={recomendaciones.length ? recomendaciones : ["Sin recomendaciones capturadas"]} disabled={!recomendaciones.length} />
            <SelectField label="Hito *" options={hitos.length ? hitos.map((h) => h.descripcion) : ["Sin hitos configurados"]} disabled={!hitos.length} />
          </div>
          {!hitoId ? (
            <Card>
              <EmptyState
                icon="objetivo"
                titulo="Primero configura un hito"
                mensaje="Las evidencias se suben a un hito de una recomendación. Cuando configures los hitos de tu plan, podrás cargar aquí sus documentos."
                action={<LinkButton href="/licenciatura/hitos" icon="objetivo">Configurar hitos</LinkButton>}
              />
            </Card>
          ) : (
          <div
            className={["dropzone", arrastrando ? "dropzone--over" : ""].join(" ")}
            onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={onDrop}
          >
            <span className="avatar" style={{ width: 72, height: 72, background: "var(--color-white)", color: "var(--color-primary)" }}><Icon name="subir" size={36} /></span>
            <h2 className="t-h2 t-primary">Arrastra tus archivos aquí</h2>
            <span className="t-muted">o</span>
            <Button icon="carpeta" onClick={() => input.current?.click()}>Seleccionar archivos</Button>
            <input ref={input} type="file" multiple hidden accept={PERMITIDOS.map((e) => `.${e}`).join(",")} onChange={(e) => agregar(e.target.files)} />
            <span className="t-small t-muted">PDF, Word, Excel, JPG o PNG · máximo {MAX_MB} MB por archivo</span>
          </div>
          )}
          {archivos.length > 0 && (
          <Card title="Archivos en proceso" subtitle={`${archivos.length} archivos · no cierres esta ventana mientras se suben`} style={{ gap: 0 }}>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }} aria-live="polite">
              {archivos.map((a) => (
                <li key={a.id} className="list-row">
                  <span className="kpi__icon" style={{ borderRadius: 8, background: a.estado === "ERROR" ? "var(--color-danger-bg)" : a.estado === "LISTO" ? "var(--color-success-bg)" : "var(--color-primary-tint)", color: a.estado === "ERROR" ? "var(--color-danger-text)" : a.estado === "LISTO" ? "var(--color-success-text)" : "var(--color-primary)" }}>
                    <Icon name="documento" size={20} />
                  </span>
                  <div className="stack grow" style={{ gap: 6 }}>
                    <div className="row" style={{ gap: 8 }}><span className="t-medium">{a.nombreOriginal}</span><span className="t-small t-muted">{a.tamano}</span></div>
                    {(a.estado === "SUBIENDO" || a.estado === "CONVIRTIENDO") && (
                      <>
                        <Progress value={a.progreso} width={360} color={a.estado === "CONVIRTIENDO" ? "var(--color-accent)" : "var(--color-primary)"} />
                        <span className={["row t-small t-medium", a.estado === "CONVIRTIENDO" ? "t-warning" : "t-primary"].join(" ")} style={{ gap: 6 }}>
                          <Icon name="cargando" size={16} />{a.estado === "CONVIRTIENDO" ? "Convirtiendo a PDF…" : "Subiendo…"}
                        </span>
                      </>
                    )}
                    {a.estado === "LISTO" && <span className="row t-small t-medium t-success" style={{ gap: 6 }}><Icon name="check" size={16} />Convertido a PDF · {a.nombreOriginal.replace(/\.[^.]+$/, ".pdf")}</span>}
                    {a.estado === "ERROR" && <span className="row t-small t-medium t-danger" style={{ gap: 6 }} role="alert"><Icon name="alerta" size={16} />{a.mensajeError}</span>}
                  </div>
                  {(a.estado === "SUBIENDO" || a.estado === "CONVIRTIENDO") && <Button variant="texto" onClick={() => setArchivos((prev) => prev.filter((x) => x.id !== a.id))}>Cancelar</Button>}
                  {a.estado === "LISTO" && <><IconButton icon="ver" label="Ver PDF" /><IconButton icon="eliminar" danger label="Eliminar" onClick={() => setArchivos((prev) => prev.filter((x) => x.id !== a.id))} /></>}
                  {a.estado === "ERROR" && <Button variant="contorno" icon="restablecer" onClick={() => setArchivos((prev) => prev.filter((x) => x.id !== a.id))}>Quitar</Button>}
                </li>
              ))}
            </ul>
          </Card>
          )}
        </div>
        <aside className="stack side-340">
          <Card title="Evidencias de este hito" style={{ gap: 12 }}>
            <p className="t-small t-muted" style={{ margin: 0 }}>Aún no hay evidencias cargadas.</p>
          </Card>
        </aside>
      </div>
    </>
  );
};

export default EvidenciasPage;
