"use client";

// HU-19 · Centro de ayuda: manual digital por secciones con índice lateral, adaptado al rol, y videotutoriales.
// HU-20 · Descarga del manual impreso en PDF. El contenido vive en src/lib/ayuda.ts; esta pantalla solo lo muestra.
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert, Card, EmptyState, PageTitle, Tag } from "@/components/ui/Display";
import { Icon } from "@/components/ui/Icon";
import { leerUsuarioSesion } from "@/lib/api";
import { MANUAL_IMPRESO, seccionesPara, videosPara } from "@/lib/ayuda";
import type { Rol } from "@/lib/types";

const ETIQUETA_ROL: Record<Rol, string> = { ADMINISTRADOR: "Administrador", CAPTURA: "Captura", AUXILIAR: "Auxiliar" };

const AyudaPage = () => {
  const [rol, setRol] = useState<Rol | null>(null);

  useEffect(() => {
    setRol(leerUsuarioSesion()?.rol ?? null);
  }, []);

  if (!rol) return <p className="t-muted" aria-busy="true">Cargando la ayuda…</p>;

  const secciones = seccionesPara(rol);
  const videos = videosPara(rol);
  const temas = [...new Set(videos.map((v) => v.tema))];

  return (
    <>
      <PageTitle
        crumbs={[{ label: "Inicio", href: rol === "ADMINISTRADOR" ? "/admin/dashboard" : "/licenciatura/dashboard" }, { label: "Ayuda" }]}
        title="Centro de ayuda"
        subtitle={`Manual de usuario y videotutoriales para el perfil ${ETIQUETA_ROL[rol]}.`}
        actions={
          MANUAL_IMPRESO.disponible ? (
            <a className="btn btn--contorno" href={MANUAL_IMPRESO.ruta} download={MANUAL_IMPRESO.nombre}>
              <Icon name="descargar" size={20} />Descargar manual (PDF)
            </a>
          ) : (
            <Button variant="contorno" icon="descargar" disabled title="El manual impreso estará disponible pronto">Descargar manual (PDF)</Button>
          )
        }
      />

      <div className="row row--top row--responsive" style={{ gap: 24 }}>
        <nav className="card side-340 ayuda-indice" aria-label="Índice del manual">
          <div className="t-medium" style={{ padding: "4px 12px 8px" }}>Índice</div>
          {secciones.map((s, i) => (
            <a key={s.id} href={`#${s.id}`} className="sidebar__item">{i + 1}. {s.titulo}</a>
          ))}
          <a href="#videotutoriales" className="sidebar__item"><Icon name="video" size={18} />Videotutoriales</a>
        </nav>

        <div className="stack grow" style={{ gap: 24, minWidth: 0 }}>
          {!MANUAL_IMPRESO.disponible && <Alert tipo="info">El manual y los videotutoriales se están preparando. Mientras tanto, cada sección resume lo que cubrirá.</Alert>}

          {secciones.map((s, i) => (
            <Card key={s.id} title={`${i + 1}. ${s.titulo}`} subtitle={s.resumen}>
              <section id={s.id} className="stack ayuda-seccion" style={{ gap: 8 }}>
                {s.contenido.length ? (
                  <ol className="stack" style={{ gap: 8, margin: 0, paddingLeft: 20 }}>
                    {s.contenido.map((paso) => <li key={paso}>{paso}</li>)}
                  </ol>
                ) : (
                  <span><Tag neutral>En preparación</Tag></span>
                )}
              </section>
            </Card>
          ))}

          <Card title="Videotutoriales" subtitle="Videos cortos organizados por tema.">
            <section id="videotutoriales" className="stack ayuda-seccion" style={{ gap: 16 }}>
              {videos.length === 0 && <EmptyState titulo="Próximamente" mensaje="Aquí aparecerán los videotutoriales de cada tema." />}
              {temas.map((tema) => (
                <div key={tema} className="stack" style={{ gap: 12 }}>
                  <h3 className="t-h3" style={{ margin: 0 }}>{tema}</h3>
                  <div className="ayuda-videos">
                    {videos.filter((v) => v.tema === tema).map((v) => (
                      <figure key={v.urlInsertar} className="stack" style={{ gap: 6, margin: 0 }}>
                        <iframe
                          src={v.urlInsertar}
                          title={v.titulo}
                          loading="lazy"
                          allow="encrypted-media; picture-in-picture; fullscreen"
                          referrerPolicy="strict-origin-when-cross-origin"
                          className="ayuda-video"
                        />
                        <figcaption className="row" style={{ gap: 8, justifyContent: "space-between" }}>
                          <span className="t-medium">{v.titulo}</span>
                          <span className="t-small t-muted">{v.duracion}</span>
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          </Card>
        </div>
      </div>
    </>
  );
};

export default AyudaPage;
