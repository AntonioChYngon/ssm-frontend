"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { Badge } from "@/components/ui/Display";
import { Button, IconButton } from "@/components/ui/Button";
import { Radio } from "@/components/ui/Field";
import { Icon, type IconName } from "@/components/ui/Icon";
import { ChipGroup, Drawer } from "@/components/ui/Interactive";
import { listarNotificaciones } from "@/lib/api";
import type { CanalNotificacion, Notificacion, TipoNotificacion } from "@/lib/types";

const TIPO: Record<TipoNotificacion, { icon: IconName; bg: string; fg: string; filtro: string }> = {
  VENCIMIENTO: { icon: "reloj", bg: "var(--color-danger-bg)", fg: "var(--color-danger-text)", filtro: "Vencidos" },
  HITO: { icon: "objetivo", bg: "var(--color-warning-bg)", fg: "var(--color-warning-text)", filtro: "Hitos" },
  DEVOLUCION: { icon: "mensaje", bg: "var(--color-primary-tint)", fg: "var(--color-primary)", filtro: "Devoluciones" },
};

export const NotificationPanel = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [items, setItems] = useState<Notificacion[]>([]);

  useEffect(() => {
    if (open) listarNotificaciones().then(setItems).catch(() => setItems([]));
  }, [open]);
  const [filtro, setFiltro] = useState("Todas");
  const [canal, setCanal] = useState<CanalNotificacion>("AMBOS");

  const visibles = items.filter((n) => filtro === "Todas" || TIPO[n.tipo].filtro === filtro);
  const nuevas = items.filter((n) => !n.leida).length;
  const alternarLeida = (id: string) => setItems((prev) => prev.map((n) => (n.id === id ? { ...n, leida: !n.leida } : n)));
  const marcarTodas = () => setItems((prev) => prev.map((n) => ({ ...n, leida: true })));

  return (
    <Drawer open={open} onClose={onClose} labelledBy="notif-title">
      <div className="row" style={{ padding: "20px 16px 12px 24px", gap: 12 }}>
        <Icon name="campana" className="t-primary" />
        <h2 id="notif-title" className="t-h2">Notificaciones</h2>
        {nuevas > 0 && <Badge estado="Nuevo">{nuevas} nuevas</Badge>}
        <span className="spacer" />
        <IconButton icon="cerrar" label="Cerrar notificaciones" onClick={onClose} />
      </div>
      <div style={{ padding: "0 24px 12px" }}>
        <ChipGroup label="Filtrar notificaciones" options={["Todas", "Vencidos", "Hitos", "Devoluciones"]} onChange={setFiltro} />
      </div>
      <div className="row" style={{ padding: "0 16px 4px 24px" }}>
        <span className="t-small t-medium t-muted">Recientes</span>
        <span className="spacer" />
        <Button variant="texto" icon="check" onClick={marcarTodas}>Marcar todas como leídas</Button>
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, overflowY: "auto", flex: 1, borderTop: "1px solid var(--color-gray-200)" }}>
        {visibles.length === 0 && (
          <li className="t-small t-muted" style={{ padding: "24px" }}>No tienes notificaciones.</li>
        )}
        {visibles.map((n) => {
          const tipo = TIPO[n.tipo];
          return (
            <li key={n.id} className={["notif", n.leida ? "" : "notif--unread"].join(" ")}>
              <input type="checkbox" aria-label={`Marcar “${n.titulo}” como leída`} checked={n.leida} onChange={() => alternarLeida(n.id)} style={{ width: 22, height: 22, accentColor: "var(--color-primary)" }} />
              <span className="kpi__icon" style={{ width: 40, height: 40, background: tipo.bg, color: tipo.fg }}><Icon name={tipo.icon} size={20} /></span>
              <div className="grow">
                <div className="t-medium">{n.titulo}</div>
                <p className="t-small t-muted" style={{ margin: "2px 0 4px" }}>{n.descripcion}</p>
                <div className="row t-small" style={{ gap: 12 }}>
                  <span className="t-muted">{n.fecha}</span>
                  <Link href={n.enlace} onClick={onClose} className="t-medium">Ver documento ›</Link>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <fieldset className="stack" style={{ "--gap": "4px", margin: 0, border: 0, borderTop: "1px solid var(--color-gray-200)", background: "var(--color-gray-50)", padding: "16px 24px 20px" } as CSSProperties}>
        <legend className="row t-medium" style={{ gap: 8, float: "left", width: "100%" }}><Icon name="engrane" size={20} className="t-primary" />Preferencias de entrega</legend>
        <div className="row" style={{ gap: 16 }}>
          <Radio name="canal" label="Correo" checked={canal === "CORREO"} onChange={() => setCanal("CORREO")} />
          <Radio name="canal" label="In-App" checked={canal === "IN_APP"} onChange={() => setCanal("IN_APP")} />
          <Radio name="canal" label="Ambos" checked={canal === "AMBOS"} onChange={() => setCanal("AMBOS")} />
        </div>
      </fieldset>
    </Drawer>
  );
};
