import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Avatar, Badge, Card, PageTitle, Tag } from "@/components/ui/Display";
import { SelectField, TextField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { BITACORA } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Bitácora de auditoría" };

const BitacoraPage = () => {
  const dias = [...new Set(BITACORA.map((e) => e.dia))];
  return (
    <>
      <PageTitle
        crumbs={[{ label: "Inicio", href: "/admin/dashboard" }, { label: "Bitácora de auditoría" }]}
        title="Bitácora de auditoría"
        subtitle="Registro inmutable de todos los cambios realizados en el sistema, con usuario y rol."
        actions={<Button variant="contorno" icon="descargar">Exportar</Button>}
      />
      <div className="row row--end row--responsive">
        <div className="grow"><TextField label="Buscar" icon="buscar" placeholder="Usuario, documento o acción" /></div>
        <div style={{ width: 180 }}><SelectField label="Rol" options={["Todos", "Administrador", "Capturista", "Auxiliar"]} /></div>
        <div style={{ width: 200 }}><SelectField label="Tipo de acción" options={["Todas", "Validación", "Devolución", "Captura", "Evidencias", "Usuarios"]} /></div>
        <div style={{ width: 280 }}><TextField label="Periodo" icon="calendario" defaultValue="01/11/2026 – 11/11/2026" /></div>
      </div>
      <Card style={{ gap: 0 }}>
        {dias.map((dia) => (
          <section key={dia}>
            <h2 className="row t-body t-medium t-primary" style={{ gap: 8, margin: 0, padding: "16px 0 8px" }}><Icon name="calendario" size={18} />{dia}</h2>
            <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {BITACORA.filter((e) => e.dia === dia).map((e) => (
                <li key={e.id} className="row row--top" style={{ gap: 16, padding: "12px 0" }}>
                  <time className="t-medium t-muted" style={{ width: 56 }}>{e.hora}</time>
                  <Avatar iniciales={e.iniciales} />
                  <div className="stack grow" style={{ gap: 4 }}>
                    <div className="row" style={{ gap: 8 }}><span className="t-medium">{e.usuario}</span><Tag neutral>{e.rol}</Tag></div>
                    <span>{e.accion}</span>
                    <a href="#" className="row t-small t-medium" style={{ gap: 6 }}><Icon name="documento" size={16} />{e.entidad}</a>
                    <span className="t-small t-muted muted-box" style={{ padding: "6px 10px", alignSelf: "flex-start" }}>{e.cambio}</span>
                  </div>
                  {e.estado && <Badge estado={e.estado} />}
                </li>
              ))}
            </ol>
          </section>
        ))}
      </Card>
      <div className="row">
        <span className="t-small t-muted">Mostrando {BITACORA.length} de 248 eventos</span>
        <span className="spacer" />
        <Button variant="contorno" icon="chevron-abajo">Cargar más eventos</Button>
      </div>
    </>
  );
};

export default BitacoraPage;
