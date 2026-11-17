import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { EstadoBadge } from "@/lib/types";
import { Icon, type IconName } from "./Icon";

const BADGE_CLASS: Record<EstadoBadge, string> = {
  Completado: "completado",
  Validado: "validado",
  Pendiente: "pendiente",
  "En revisión": "en-revision",
  "En validación": "en-revision",
  Devuelto: "devuelto",
  Vencido: "vencido",
  Borrador: "borrador",
  Nuevo: "nuevo",
};

export const Badge = ({ estado, children }: { estado: EstadoBadge; children?: ReactNode }) => (
  <span className={`badge badge--${BADGE_CLASS[estado]}`}>{children ?? estado}</span>
);

export const Tag = ({ children, neutral }: { children: ReactNode; neutral?: boolean }) => (
  <span className={neutral ? "tag tag--neutral" : "tag"}>
    <Icon name="etiqueta" size={14} />
    {children}
  </span>
);

type CardProps = { title?: string; subtitle?: string; actions?: ReactNode; flush?: boolean; className?: string; children?: ReactNode; style?: CSSProperties };

export const Card = ({ title, subtitle, actions, flush, className, children, style }: CardProps) => (
  <section className={["card", flush ? "card--flush" : "", className ?? ""].join(" ")} style={style}>
    {(title || actions) && (
      <header className="card__head">
        <div className="card__titles">
          {title && <h2 className="t-h3">{title}</h2>}
          {subtitle && <p className="t-small t-muted" style={{ margin: 0 }}>{subtitle}</p>}
        </div>
        {actions}
      </header>
    )}
    {children}
  </section>
);

export type Tono = "azul" | "verde" | "naranja" | "rojo";

export const KpiCard = ({ tono, titulo, valor, detalle, icon }: { tono: Tono; titulo: string; valor: string; detalle: string; icon: IconName }) => (
  <section className={`card kpi tone-${tono}`}>
    <div className="row" style={{ "--gap": "12px" } as CSSProperties}>
      <span className="kpi__icon"><Icon name={icon} size={22} /></span>
      <span className="t-medium t-muted">{titulo}</span>
    </div>
    <span className="t-kpi">{valor}</span>
    <span className="kpi__detail">{detalle}</span>
  </section>
);

export type AlertTipo = "exito" | "error" | "advertencia" | "info";
const ALERT_ICON: Record<AlertTipo, IconName> = { exito: "check", error: "alerta", advertencia: "reloj", info: "info" };

export const Alert = ({ tipo, children }: { tipo: AlertTipo; children: ReactNode }) => (
  <div className={`alert alert--${tipo}`} role={tipo === "error" ? "alert" : "status"}>
    <Icon name={ALERT_ICON[tipo]} size={22} />
    <div>{children}</div>
  </div>
);

export const Progress = ({ value, width = 120, color }: { value: number; width?: number; color?: string }) => {
  const bar = color ?? (value >= 100 ? "var(--color-success)" : value >= 50 ? "var(--color-primary)" : value > 0 ? "var(--color-warning)" : "var(--color-danger)");
  return (
    <span className="progress" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <span className="progress__track" style={{ "--w": `${width}px` } as CSSProperties}>
        <span className="progress__bar" style={{ width: `${Math.min(value, 100)}%`, "--bar": bar } as CSSProperties} />
      </span>
      <span className="t-small t-medium">{value}%</span>
    </span>
  );
};

export type Crumb = { label: string; href?: string };

export const Breadcrumb = ({ items }: { items: Crumb[] }) => (
  <nav aria-label="Ruta de navegación">
    <ol className="breadcrumb">
      {items.map((item, index) => {
        const last = index === items.length - 1;
        return (
          <li key={item.label} className="row" style={{ "--gap": "6px" } as CSSProperties}>
            {last || !item.href ? <span aria-current={last ? "page" : undefined}>{item.label}</span> : <Link href={item.href}>{item.label}</Link>}
            {!last && <Icon name="chevron-derecha" size={14} className="t-muted" />}
          </li>
        );
      })}
    </ol>
  </nav>
);

export const Avatar = ({ iniciales, size = 36, accent }: { iniciales: string; size?: number; accent?: boolean }) => (
  <span
    className="avatar t-small"
    style={{ width: size, height: size, background: accent ? "var(--color-accent)" : "var(--color-primary-tint)", color: "var(--color-primary)", fontSize: size > 60 ? 28 : 14 }}
  >
    {iniciales}
  </span>
);

export const EmptyState = ({ titulo, mensaje, icon = "carpeta", action }: { titulo: string; mensaje: string; icon?: IconName; action?: ReactNode }) => (
  <div className="empty">
    <span className="empty__art"><Icon name={icon} size={48} /></span>
    <h3 className="t-h3">{titulo}</h3>
    <p className="t-muted" style={{ margin: 0 }}>{mensaje}</p>
    {action}
  </div>
);

export type Paso = "hecho" | "actual" | "pendiente";

export const Stepper = ({ pasos, actual }: { pasos: string[]; actual: number }) => (
  <ol className="stepper" style={{ listStyle: "none", padding: 0, margin: 0 }}>
    {pasos.map((paso, index) => {
      const estado: Paso = index < actual ? "hecho" : index === actual ? "actual" : "pendiente";
      const bg = estado === "hecho" ? "var(--color-success)" : estado === "actual" ? "var(--color-primary)" : "var(--color-gray-200)";
      return (
        <li key={paso} className="row" style={{ "--gap": "12px" } as CSSProperties} aria-current={estado === "actual" ? "step" : undefined}>
          <span className="stepper__dot" style={{ background: bg, color: estado === "pendiente" ? "var(--color-text-muted)" : "var(--color-white)" }}>
            {estado === "hecho" ? <Icon name="check" size={18} /> : index + 1}
          </span>
          <span className={estado === "actual" ? "t-medium" : estado === "pendiente" ? "t-muted" : ""}>{paso}</span>
          {index < pasos.length - 1 && <span className="stepper__line" style={estado === "hecho" ? { background: "var(--color-success)" } : undefined} />}
        </li>
      );
    })}
  </ol>
);

export type Column<T> = { header: string; width?: number; render: (row: T) => ReactNode };

export const DataTable = <T,>({ columns, rows, rowKey, caption }: { columns: Column<T>[]; rows: T[]; rowKey: (row: T) => string; caption?: string }) => (
  <div className="table-wrap">
    <table className="table">
      {caption && <caption className="sr-only">{caption}</caption>}
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column.header} scope="col" style={column.width ? { width: column.width } : undefined}>{column.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={rowKey(row)}>
            {columns.map((column) => (
              <td key={column.header}>{column.render(row)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const PageTitle = ({ title, subtitle, actions, crumbs }: { title: string; subtitle?: string; actions?: ReactNode; crumbs?: Crumb[] }) => (
  <>
    {crumbs && <Breadcrumb items={crumbs} />}
    <div className="page-title">
      <div className="grow">
        <h1 className="t-h1">{title}</h1>
        {subtitle && <p className="t-muted" style={{ margin: "4px 0 0" }}>{subtitle}</p>}
      </div>
      {actions && <div className="row row--wrap" style={{ "--gap": "12px" } as CSSProperties}>{actions}</div>}
    </div>
  </>
);
