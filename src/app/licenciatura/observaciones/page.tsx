"use client";

import { useState } from "react";
import { Button, LinkButton } from "@/components/ui/Button";
import { Alert, Avatar, Badge, Card, PageTitle } from "@/components/ui/Display";
import { Icon } from "@/components/ui/Icon";
import { ChipGroup } from "@/components/ui/Interactive";
import { DEVOLUCIONES } from "@/lib/mock-data";

const ObservacionesPage = () => {
  const [filtro, setFiltro] = useState("Todas (5)");
  const pendientes = DEVOLUCIONES.flatMap((d) => d.items).filter((i) => !i.atendida).length;

  return (
    <>
      <PageTitle
        crumbs={[{ label: "Inicio", href: "/licenciatura/dashboard" }, { label: "Observaciones" }]}
        title="Observaciones del Administrador"
        subtitle="Historial de devoluciones de tu plan y tus informes. Atiende cada observación y vuelve a enviar."
        actions={<LinkButton href="/licenciatura/plan" icon="documento">Ir al plan de mejora</LinkButton>}
      />
      <ChipGroup label="Filtrar observaciones" options={["Todas (5)", `Pendientes (${pendientes})`, "Atendidas (2)"]} onChange={setFiltro} />
      {DEVOLUCIONES.map((d) => {
        const abierta = d.items.some((i) => !i.atendida);
        const items = d.items.filter((i) => filtro.startsWith("Todas") || (filtro.startsWith("Pendientes") ? !i.atendida : i.atendida));
        if (!items.length) return null;
        return (
          <Card key={d.id} style={{ gap: 14 }}>
            <div className="row" style={{ gap: 12 }}>
              <Avatar iniciales="MG" />
              <div className="grow">
                <h2 className="t-h3">Devolución del {d.fecha} · {d.documento}</h2>
                <span className="t-small t-muted">{d.autor} · Administradora</span>
              </div>
              {abierta ? <Badge estado="Devuelto" /> : <Badge estado="Completado">Atendida</Badge>}
            </div>
            <blockquote className="row muted-box" style={{ gap: 10, margin: 0 }}><Icon name="mensaje" size={20} className="t-muted" /><em>“{d.mensaje}”</em></blockquote>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {items.map((i) => (
                <li key={i.texto} className="list-row">
                  <Icon name={i.atendida ? "check" : "alerta"} size={22} className={i.atendida ? "t-success" : "t-warning"} />
                  <div className="grow">
                    <div className="t-medium">{i.recomendacion}</div>
                    <div className="t-muted">{i.texto}</div>
                  </div>
                  <Badge estado={i.atendida ? "Completado" : "Pendiente"}>{i.atendida ? "Atendida" : "Pendiente"}</Badge>
                  {!i.atendida && <LinkButton href="/licenciatura/plan" variant="contorno" icon="chevron-derecha">Atender</LinkButton>}
                </li>
              ))}
            </ul>
            {abierta && <div className="row" style={{ justifyContent: "flex-end" }}><Button icon="enviar" disabled={pendientes > 0}>Reenviar a validación</Button></div>}
          </Card>
        );
      })}
      {pendientes > 0 && <Alert tipo="advertencia">Podrás reenviar el plan cuando atiendas las {pendientes} observaciones pendientes.</Alert>}
    </>
  );
};

export default ObservacionesPage;
