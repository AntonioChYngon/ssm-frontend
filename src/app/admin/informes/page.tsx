"use client";

// Informes de seguimiento (HU-07/HU-08). Arranca en ceros: aún no hay informes capturados.
import { useEffect, useState } from "react";
import { LinkButton } from "@/components/ui/Button";
import { Badge, Card, DataTable, EmptyState, KpiCard, PageTitle } from "@/components/ui/Display";
import { listarInformes } from "@/lib/api";
import { ESTADO_DOCUMENTO_BADGE, type InformeResumen } from "@/lib/types";

const InformesPage = () => {
  const [informes, setInformes] = useState<InformeResumen[]>([]);

  useEffect(() => {
    listarInformes().then(setInformes).catch(() => setInformes([]));
  }, []);

  const contar = (estado: InformeResumen["estado"]) => informes.filter((i) => i.estado === estado).length;

  return (
    <>
      <PageTitle
        crumbs={[{ label: "Inicio", href: "/admin/dashboard" }, { label: "Informes de seguimiento" }]}
        title="Informes de seguimiento"
        subtitle="Informes periódicos que reportan el avance de cada plan validado."
      />
      <div className="grid-4">
        <KpiCard tono="azul" titulo="Informes recibidos" valor={String(informes.length)} detalle="en todos los periodos" icon="documento" />
        <KpiCard tono="naranja" titulo="Por revisar" valor={String(contar("EN_REVISION"))} detalle="enviados por las coordinaciones" icon="reloj" />
        <KpiCard tono="rojo" titulo="Devueltos" valor={String(contar("DEVUELTO"))} detalle="esperando corrección" icon="mensaje" />
        <KpiCard tono="verde" titulo="Validados" valor={String(contar("VALIDADO"))} detalle="aprobados por la Unidad" icon="check" />
      </div>
      {informes.length === 0 ? (
        <Card>
          <EmptyState titulo="Aún no hay informes de seguimiento" mensaje="Las coordinaciones podrán capturar su informe cuando su Plan de Mejora esté validado." />
        </Card>
      ) : (
        <DataTable<InformeResumen>
          caption="Informes de seguimiento"
          rows={informes}
          rowKey={(i) => i.id}
          columns={[
            { header: "Licenciatura", render: (i) => <span className="t-medium">{i.licenciatura}</span> },
            { header: "Periodo", width: 120, render: (i) => i.periodo },
            { header: "Hitos reportados", width: 170, render: (i) => `${i.hitosReportados} / ${i.hitosTotales}` },
            { header: "Fecha de envío", width: 160, render: (i) => i.fechaEnvio },
            { header: "Estado", width: 140, render: (i) => <Badge estado={ESTADO_DOCUMENTO_BADGE[i.estado]} /> },
            { header: "Acción", width: 140, render: (i) => <LinkButton href={`/admin/informes/${i.id}`} variant="contorno" icon="ver">Ver</LinkButton> },
          ]}
        />
      )}
    </>
  );
};

export default InformesPage;
