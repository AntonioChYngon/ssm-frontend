"use client";

// Reporte de incumplimiento (HU-13). Sin informes capturados todavía no hay hitos que comparar: arranca en ceros.
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert, Badge, Card, DataTable, EmptyState, PageTitle, Progress } from "@/components/ui/Display";
import { SelectField, TextField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { obtenerCatalogos } from "@/lib/api";
import { fechaCorta } from "@/lib/reglas";
import type { Incumplimiento } from "@/lib/types";

const BRECHAS = { "Cualquier brecha": 0, "Brecha > 10 puntos": 10, "Brecha > 25 puntos": 25 } as const;
type Brecha = keyof typeof BRECHAS;
const TODAS = "Todas las licenciaturas";

const IncumplimientoPage = () => {
  const [licenciaturas, setLicenciaturas] = useState<string[]>([]);
  const [fechaCorte, setFechaCorte] = useState("");
  const [brecha, setBrecha] = useState<Brecha>("Cualquier brecha");
  const [licenciatura, setLicenciatura] = useState(TODAS);
  const [generado, setGenerado] = useState<string | null>(null);
  // TODO(HU-13): GET /reportes/incumplimiento?fechaCorte=&brecha=&licenciaturaId=
  const filas: Incumplimiento[] = [];

  useEffect(() => {
    obtenerCatalogos().then((c) => setLicenciaturas(c.licenciaturas.map((l) => l.nombre))).catch(() => setLicenciaturas([]));
  }, []);

  return (
    <>
      <PageTitle
        crumbs={[{ label: "Inicio", href: "/admin/dashboard" }, { label: "Reportes" }, { label: "Incumplimiento" }]}
        title="Reporte de incumplimiento"
        subtitle="Hitos cuyo avance real está por debajo del porcentaje esperado a la fecha de corte."
      />
      <Card>
        <div className="row row--end row--responsive">
          <div className="grow"><TextField label="Fecha de corte" icon="calendario" type="date" value={fechaCorte} onChange={(e) => setFechaCorte(e.target.value)} /></div>
          <div className="grow"><SelectField label="% esperado" options={Object.keys(BRECHAS)} value={brecha} onChange={(e) => setBrecha(e.target.value as Brecha)} /></div>
          <div className="grow"><SelectField label="Licenciatura" options={[TODAS, ...licenciaturas]} value={licenciatura} onChange={(e) => setLicenciatura(e.target.value)} /></div>
          <Button variant="texto" onClick={() => { setFechaCorte(""); setBrecha("Cualquier brecha"); setLicenciatura(TODAS); setGenerado(null); }}>Limpiar</Button>
          <Button icon="filtro" disabled={!fechaCorte} onClick={() => setGenerado(fechaCorte)}>Generar reporte</Button>
        </div>
      </Card>
      {generado && <Alert tipo="exito">No hay hitos incumplidos al {fechaCorta(generado)} con estos filtros.</Alert>}
      {filas.length === 0 ? (
        <Card>
          <EmptyState icon="tendencia-baja" titulo="Sin hitos para comparar" mensaje="El reporte compara los hitos configurados contra el avance de los informes de seguimiento. Aún no hay ninguno registrado." />
        </Card>
      ) : (
        <DataTable<Incumplimiento>
          caption="Hitos incumplidos"
          rows={filas}
          rowKey={(i) => i.hito}
          columns={[
            { header: "Licenciatura", width: 250, render: (i) => <span className="t-medium">{i.licenciatura}</span> },
            { header: "Hito", render: (i) => i.hito },
            { header: "Fecha compromiso", width: 170, render: (i) => i.fechaCompromiso },
            { header: "% esperado", width: 120, render: (i) => `${i.esperado}%` },
            { header: "% real", width: 150, render: (i) => <Progress value={i.real} width={80} /> },
            { header: "Brecha", width: 120, render: (i) => <Badge estado={i.esperado - i.real >= 30 ? "Vencido" : "Pendiente"}>−{i.esperado - i.real} pts</Badge> },
          ]}
        />
      )}
      <p className="row t-small t-muted" style={{ gap: 8, margin: 0 }}><Icon name="info" size={18} />La brecha es la diferencia entre el % esperado y el % real reportado en el último informe capturado.</p>
    </>
  );
};

export default IncumplimientoPage;
