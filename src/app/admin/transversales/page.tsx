"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, PageTitle, Tag } from "@/components/ui/Display";
import { Icon } from "@/components/ui/Icon";
import { ETIQUETAS, TRANSVERSALES } from "@/lib/mock-data";

const TransversalesPage = () => {
  const [etiqueta, setEtiqueta] = useState("Todas");
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set(TRANSVERSALES[0]?.items.map((i) => i.texto)));

  const alternar = (texto: string) =>
    setSeleccion((prev) => {
      const next = new Set(prev);
      if (next.has(texto)) next.delete(texto);
      else next.add(texto);
      return next;
    });

  const grupos = TRANSVERSALES.filter((g) => etiqueta === "Todas" || g.grupo === etiqueta);

  return (
    <>
      <PageTitle
        crumbs={[{ label: "Inicio", href: "/admin/dashboard" }, { label: "Reportes" }, { label: "Recomendaciones transversales" }]}
        title="Recomendaciones transversales"
        subtitle="Etiqueta y agrupa recomendaciones que se repiten en varias licenciaturas para atenderlas de forma conjunta."
        actions={<><Button variant="contorno" icon="etiqueta">Nueva etiqueta</Button><Button variant="contorno" icon="descargar">Exportar</Button></>}
      />
      <div className="row row--top row--responsive" style={{ gap: 24 }}>
        <Card title="Etiquetas" className="side-340" style={{ gap: 4 }}>
          {ETIQUETAS.map((e) => {
            const activa = e.nombre === etiqueta;
            return (
              <button key={e.nombre} type="button" onClick={() => setEtiqueta(e.nombre)} aria-pressed={activa} className="row"
                style={{ gap: 8, minHeight: 44, padding: "0 12px", border: 0, borderRadius: 8, cursor: "pointer", textAlign: "left", background: activa ? "var(--color-primary-tint)" : "transparent", color: activa ? "var(--color-primary)" : undefined }}>
                <Icon name={e.nombre === "Sin etiqueta" ? "alerta" : "etiqueta"} size={18} />
                <span className={["grow", activa ? "t-medium" : ""].join(" ")}>{e.nombre}</span>
                <span className="t-small t-medium t-muted">{e.total}</span>
              </button>
            );
          })}
        </Card>
        <div className="stack grow">
          {seleccion.size > 0 && (
            <div className="row" style={{ gap: 12, padding: "8px 12px 8px 16px", borderRadius: 8, background: "var(--color-accent-tint)", border: "1px solid var(--color-accent)" }}>
              <Icon name="check" size={20} />
              <span className="t-medium grow">{seleccion.size} recomendaciones seleccionadas</span>
              <Button variant="contorno" icon="etiqueta">Etiquetar</Button>
              <Button icon="capas">Agrupar</Button>
            </div>
          )}
          {grupos.map((g) => (
            <Card key={g.grupo} title={g.grupo} subtitle={g.resumen} actions={<Button variant="texto" icon="chevron-derecha">Ver todas</Button>} style={{ gap: 0 }}>
              {g.items.map((item) => (
                <label key={item.texto} className="list-row" style={{ cursor: "pointer" }}>
                  <input type="checkbox" checked={seleccion.has(item.texto)} onChange={() => alternar(item.texto)} style={{ width: 22, height: 22, accentColor: "var(--color-primary)" }} />
                  <div className="stack grow" style={{ gap: 6 }}>
                    <span>{item.texto}</span>
                    <div className="row" style={{ gap: 8 }}><Tag neutral>{item.licenciatura}</Tag><Tag>{g.grupo}</Tag></div>
                  </div>
                </label>
              ))}
            </Card>
          ))}
        </div>
      </div>
    </>
  );
};

export default TransversalesPage;
