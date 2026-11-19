"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { Alert, Badge } from "@/components/ui/Display";
import { Button, IconButton } from "@/components/ui/Button";
import { Radio } from "@/components/ui/Field";
import { Icon, type IconName } from "@/components/ui/Icon";
import { ChipGroup, Drawer } from "@/components/ui/Interactive";
import { ApiError, listarNotificaciones, marcarNotificacionLeida, marcarTodasLasNotificacionesLeidas } from "@/lib/api";
import type { CanalNotificacion, Notificacion, TipoNotificacion } from "@/lib/types";

const TIPO: Record<TipoNotificacion, { icon: IconName; bg: string; fg: string; filtro: string }> = {
  VENCIMIENTO: { icon: "reloj", bg: "var(--color-danger-bg)", fg: "var(--color-danger-text)", filtro: "Vencidos" },
  META: { icon: "objetivo", bg: "var(--color-warning-bg)", fg: "var(--color-warning-text)", filtro: "Metas" },
  DEVOLUCION: { icon: "mensaje", bg: "var(--color-primary-tint)", fg: "var(--color-primary)", filtro: "Devoluciones" },
  PLAN: { icon: "documento", bg: "var(--color-primary-tint)", fg: "var(--color-primary)", filtro: "Planes" },
};

export const NotificationPanel = ({ open, onClose, onUnreadCountChange }: { open: boolean; onClose: () => void; onUnreadCountChange?: (count: number) => void }) => {
  const [items, setItems] = useState<Notificacion[]>([]);
  const [filtro, setFiltro] = useState("Todas");
  const [canal, setCanal] = useState<CanalNotificacion>("AMBOS");
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [intentosCarga, setIntentosCarga] = useState(0);

  useEffect(() => {
    if (!open) return;
    let vigente = true;
    setCargando(true);
    setErrorCarga(null);
    listarNotificaciones()
      .then((avisos) => { if (vigente) setItems(avisos); })
      .catch((error: unknown) => {
        if (!vigente) return;
        setErrorCarga(error instanceof ApiError
          ? error.message
          : "No pudimos cargar las notificaciones. Revisa tu conexión e inténtalo de nuevo.");
      })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, [open, intentosCarga]);

  const visibles = items.filter((n) => filtro === "Todas" || TIPO[n.tipo]?.filtro === filtro);
  const nuevas = items.filter((n) => !n.leida).length;

  useEffect(() => onUnreadCountChange?.(nuevas), [nuevas, onUnreadCountChange]);
  const alternarLeida = async (id: string) => {
    const aviso = items.find((n) => n.id === id);
    if (!aviso || aviso.leida) return;
    setErrorAccion(null);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)));
    try {
      await marcarNotificacionLeida(id);
    } catch (error) {
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, leida: false } : n)));
      setErrorAccion(error instanceof Error ? error.message : "No se pudo marcar la notificación como leída.");
    }
  };
  const marcarTodas = async () => {
    const pendientes = items.filter((n) => !n.leida).map((n) => n.id);
    if (pendientes.length === 0) return;
    setErrorAccion(null);
    setItems((prev) => prev.map((n) => ({ ...n, leida: true })));
    try {
      await marcarTodasLasNotificacionesLeidas();
    } catch (error) {
      const ids = new Set(pendientes);
      setItems((prev) => prev.map((n) => ids.has(n.id) ? { ...n, leida: false } : n));
      setErrorAccion(error instanceof Error ? error.message : "No se pudieron marcar todas como leídas.");
    }
  };

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
        <ChipGroup label="Filtrar notificaciones" options={["Todas", "Vencidos", "Metas", "Devoluciones", "Planes"]} onChange={setFiltro} />
      </div>
      <div className="row" style={{ padding: "0 16px 4px 24px" }}>
        <span className="t-small t-medium t-muted">Recientes</span>
        <span className="spacer" />
        <Button variant="texto" icon="check" onClick={marcarTodas}>Marcar todas como leídas</Button>
      </div>
      {errorAccion && <div style={{ padding: "8px 24px" }}><Alert tipo="error">{errorAccion}</Alert></div>}
      {errorCarga && (
        <div className="stack" role="alert" style={{ padding: "8px 24px", gap: 8 }}>
          <Alert tipo="error">{errorCarga}</Alert>
          <Button variant="contorno" onClick={() => setIntentosCarga((anterior) => anterior + 1)} disabled={cargando}>
            Reintentar
          </Button>
        </div>
      )}
      <ul style={{ listStyle: "none", margin: 0, padding: 0, overflowY: "auto", flex: 1, borderTop: "1px solid var(--color-gray-200)" }}>
        {cargando && items.length === 0 && <li className="t-small t-muted" role="status" style={{ padding: "16px 24px" }}>Cargando notificaciones…</li>}
        {!cargando && !errorCarga && visibles.length === 0 && <li className="t-small t-muted" style={{ padding: "16px 24px" }}>No tienes notificaciones.</li>}
        {visibles.map((n) => {
          const tipo = TIPO[n.tipo] ?? TIPO.PLAN;
          return (
            <li key={n.id} className={["notif", n.leida ? "" : "notif--unread"].join(" ")}>
              <input type="checkbox" aria-label={`Marcar “${n.titulo}” como leída`} checked={n.leida} onChange={() => void alternarLeida(n.id)} style={{ width: 22, height: 22, accentColor: "var(--color-primary)" }} />
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
