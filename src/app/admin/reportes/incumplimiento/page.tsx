"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert, Badge, Card, DataTable, PageTitle, Progress } from "@/components/ui/Display";
import { SelectField, TextField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { INCUMPLIMIENTOS, LICENCIATURAS } from "@/lib/mock-data";
import type { Incumplimiento } from "@/lib/types";

const BRECHAS = { "Cualquier brecha": 0, "Brecha > 10 puntos": 10, "Brecha > 25 puntos": 25 } as const;
type Brecha = keyof typeof BRECHAS;

const IncumplimientoPage = () => {
  const [fechaCorte, setFechaCorte] = useState("2026-11-30");
  const [brecha, setBrecha] = useState<Brecha>("Brecha > 10 puntos");
  const [licenciatura, setLicenciatura] = useState("Todas las licenciaturas");
  const [aplicado, setAplicado] = useState({ brecha, licenciatura });

  const filas = useMemo(
    () => INCUMPLIMIENTOS.filter((i) => i.esperado - i.real > BRECHAS[aplicado.brecha] && (aplicado.licenciatura.startsWith("Todas") || i.licenciatura === aplicado.licenciatura)),
    [aplicado],
  );
  const afectadas = new Set(filas.map((f) => f.licenciatura)).size;

  return (
    <>
      <PageTitle
        crumbs={[{ label: "Inicio", href: "/admin/dashboard" }, { label: "Reportes" }, { label: "Incumplimiento" }]}
        title="Reporte de incumplimiento"
        subtitle="Metas cuyo avance real está por debajo del porcentaje esperado a la fecha de corte."
        actions={<><Button variant="contorno" icon="descargar">Exportar PDF</Button><Button variant="secundario" icon="descargar">Exportar Excel</Button></>}
      />
      <Card>
        <div className="row row--end row--responsive">
          <div className="grow"><TextField label="Fecha de corte" icon="calendario" type="date" value={fechaCorte} onChange={(e) => setFechaCorte(e.target.value)} /></div>
          <div className="grow"><SelectField label="% esperado" options={Object.keys(BRECHAS)} value={brecha} onChange={(e) => setBrecha(e.target.value as Brecha)} /></div>
          <div className="grow"><SelectField label="Licenciatura" options={["Todas las licenciaturas", ...LICENCIATURAS]} value={licenciatura} onChange={(e) => setLicenciatura(e.target.value)} /></div>
          <Button variant="texto" onClick={() => { setBrecha("Cualquier brecha"); setLicenciatura("Todas las licenciaturas"); }}>Limpiar</Button>
          <Button icon="filtro" onClick={() => setAplicado({ brecha, licenciatura })}>Generar reporte</Button>
        </div>
      </Card>
      <Alert tipo={filas.length ? "error" : "exito"}>
        {filas.length ? `${filas.length} metas incumplidas en ${afectadas} licenciaturas al ${fechaCorte.split("-").reverse().join("/")}.` : "No hay metas incumplidas con estos filtros."}
      </Alert>
      <DataTable<Incumplimiento>
        caption="Metas incumplidas"
        rows={filas}
        rowKey={(i) => `${i.licenciatura}-${i.meta}`}
        columns={[
          { header: "Licenciatura", width: 250, render: (i) => <span className="t-medium">{i.licenciatura}</span> },
          { header: "Meta", render: (i) => i.meta },
          { header: "Fecha compromiso", width: 170, render: (i) => i.fechaCompromiso },
          { header: "% esperado", width: 120, render: (i) => `${i.esperado}%` },
          { header: "% real", width: 150, render: (i) => <Progress value={i.real} width={80} /> },
          { header: "Brecha", width: 120, render: (i) => <Badge estado={i.esperado - i.real >= 30 ? "Vencido" : "Pendiente"}>−{i.esperado - i.real} pts</Badge> },
        ]}
      />
      <p className="row t-small t-muted" style={{ gap: 8, margin: 0 }}><Icon name="info" size={18} />La brecha es la diferencia entre el % esperado y el % real reportado en el último informe.</p>
    </>
  );
};

export default IncumplimientoPage;
