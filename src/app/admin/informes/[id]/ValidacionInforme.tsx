"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, IconButton } from "@/components/ui/Button";
import { Badge, Card, PageTitle, Progress } from "@/components/ui/Display";
import { TextAreaField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { ConfirmModal } from "@/components/ui/Interactive";
import type { InformeResumen } from "@/lib/types";

const HITOS = [
  { nombre: "Contratación de 2 PTC", real: 100, esperado: 100 },
  { nombre: "Actualizar optativas", real: 40, esperado: 50 },
  { nombre: "Licencias de software", real: 100, esperado: 100 },
  { nombre: "Curso de ciencia de datos", real: 0, esperado: 30 },
];

const TOTAL_PAGINAS = 14;

export const ValidacionInforme = ({ informe }: { informe: InformeResumen }) => {
  const router = useRouter();
  const [pagina, setPagina] = useState(2);
  const [zoom, setZoom] = useState(100);
  const [modal, setModal] = useState<"validar" | "devolver" | null>(null);
  // URL del PDF servido por el backend (GET /informes/:id/pdf). Mientras no exista, se muestra una vista previa simulada.
  const pdfUrl = process.env.NEXT_PUBLIC_USE_MOCKS === "false" ? `${process.env.NEXT_PUBLIC_API_URL}/informes/${informe.id}/pdf#page=${pagina}` : null;

  return (
    <>
      <PageTitle
        crumbs={[{ label: "Inicio", href: "/admin/dashboard" }, { label: "Informes de seguimiento", href: "/admin/informes" }, { label: `${informe.licenciatura} · ${informe.periodo}` }]}
        title={`Informe de seguimiento · ${informe.licenciatura} ${informe.periodo}`}
        subtitle={`Enviado el ${informe.fechaEnvio} · ${informe.hitosReportados} de ${informe.hitosTotales} hitos reportados`}
        actions={<><Button variant="peligro" icon="mensaje" onClick={() => setModal("devolver")}>Devolver</Button><Button icon="check" onClick={() => setModal("validar")}>Validar informe</Button></>}
      />
      <div className="row row--top row--responsive" style={{ gap: 24 }}>
        <section className="card card--flush grow" aria-label="Visor PDF integrado">
          <div className="row" style={{ padding: "10px 12px 10px 16px", borderBottom: "1px solid var(--color-gray-200)", gap: 12 }}>
            <Icon name="documento" className="t-danger" />
            <span className="t-medium grow">Informe_{informe.licenciatura.replace(/\s/g, "_")}_{informe.periodo}.pdf</span>
            <IconButton icon="flecha-izquierda" label="Página anterior" onClick={() => setPagina((p) => Math.max(1, p - 1))} />
            <span aria-live="polite">Página {pagina} de {TOTAL_PAGINAS}</span>
            <IconButton icon="chevron-derecha" label="Página siguiente" onClick={() => setPagina((p) => Math.min(TOTAL_PAGINAS, p + 1))} />
            <Button variant="contorno" aria-label="Alejar" onClick={() => setZoom((z) => Math.max(50, z - 10))}>−</Button>
            <span className="t-medium">{zoom}%</span>
            <Button variant="contorno" aria-label="Acercar" onClick={() => setZoom((z) => Math.min(200, z + 10))}>+</Button>
            <IconButton icon="descargar" label="Descargar PDF" />
          </div>
          <div style={{ background: "var(--color-gray-200)", padding: 32, display: "flex", justifyContent: "center", minHeight: 640 }}>
            {pdfUrl ? (
              <iframe title="Visor del informe en PDF" src={pdfUrl} style={{ width: "100%", minHeight: 640, border: 0 }} />
            ) : (
              <div className="card" style={{ width: 560 * (zoom / 100), padding: 48, borderRadius: 0 }} aria-label="Vista previa simulada del PDF">
                <h2 className="t-h3 t-primary">2. Avance por recomendación</h2>
                {[100, 94, 97, 64, 100, 90, 82].map((w, i) => <span key={i} style={{ display: "block", height: 8, width: `${w}%`, borderRadius: 4, background: "var(--color-gray-200)" }} />)}
                <span className="t-small t-muted">Evidencia: Acta_Comite_Carrera.pdf</span>
              </div>
            )}
          </div>
        </section>
        <aside className="stack side-340">
          <Card title="Datos del informe">
            {[["Estado", <Badge key="b" estado="En revisión" />], ["Periodo", informe.periodo], ["Fecha de corte", "30/10/2026"], ["Hitos reportados", `${informe.hitosReportados} / ${informe.hitosTotales}`], ["Evidencias", "18 PDF"]].map(([k, v]) => (
              <div key={String(k)} className="row"><span className="t-muted grow">{k}</span><span className="t-medium">{v}</span></div>
            ))}
          </Card>
          <Card title="Hitos del periodo" style={{ gap: 12 }}>
            {HITOS.map((h) => (
              <div key={h.nombre} className="stack" style={{ gap: 4 }}>
                <div className="row t-small"><span className="t-medium grow">{h.nombre}</span><span className="t-muted">esp. {h.esperado}%</span></div>
                <Progress value={h.real} width={230} />
              </div>
            ))}
          </Card>
          <Card>
            <TextAreaField label="Observaciones para el Capturista" placeholder="Escribe aquí si devuelves el informe…" rows={3} />
          </Card>
        </aside>
      </div>
      <ConfirmModal
        open={modal !== null}
        tipo={modal ?? "validar"}
        titulo={modal === "devolver" ? "¿Devolver este informe?" : "¿Validar este informe de seguimiento?"}
        mensaje={modal === "devolver" ? "El informe regresará al Capturista para su corrección. Indica qué debe cambiar." : "El avance reportado quedará aprobado y se notificará a la licenciatura. Esta acción no se puede deshacer."}
        confirmLabel={modal === "devolver" ? "Sí, devolver informe" : "Sí, validar informe"}
        onCancel={() => setModal(null)}
        onConfirm={() => { setModal(null); router.push("/admin/informes"); }}
      />
    </>
  );
};
