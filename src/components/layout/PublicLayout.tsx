import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";

const BENEFICIOS: { icon: IconName; texto: string }[] = [
  { icon: "documento", texto: "Planes de mejora por licenciatura" },
  { icon: "carpeta", texto: "Evidencias convertidas a PDF" },
  { icon: "grafica", texto: "Seguimiento de metas y avance" },
];

export const SplitLayout = ({ titulo, texto, children }: { titulo: string; texto: string; children: ReactNode }) => (
  <div className="split">
    <aside className="brand-panel">
      <div className="row" style={{ gap: 16 }}>
        <Image src="/logos/escudo-unam.png" alt="Escudo de la UNAM" width={76} height={76} priority />
        <Image src="/logos/fes-acatlan.png" alt="FES Acatlán" width={262} height={76} priority />
      </div>
      <span className="spacer" />
      <span className="brand-panel__bar" />
      <h1 className="t-display">{titulo}</h1>
      <p style={{ fontSize: 18, lineHeight: "28px", margin: 0 }}>{texto}</p>
      <ul className="stack" style={{ "--gap": "14px", listStyle: "none", padding: 0, margin: 0 } as CSSProperties}>
        {BENEFICIOS.map((b) => (
          <li key={b.texto} className="row" style={{ gap: 12 }}>
            <Icon name={b.icon} size={22} className="t-accent" />
            {b.texto}
          </li>
        ))}
      </ul>
      <span className="spacer" />
      <p className="t-small" style={{ margin: 0, opacity: 0.9 }}>Universidad Nacional Autónoma de México<br />Facultad de Estudios Superiores Acatlán</p>
    </aside>
    <main className="split__form">
      <div className="split__inner">{children}</div>
    </main>
  </div>
);

export const PublicFooter = () => (
  <>
    <hr className="divider" />
    <div className="row" style={{ gap: 24 }}>
      <Link href="/aviso-privacidad" className="row t-medium" style={{ gap: 6 }}><Icon name="escudo" size={18} />Aviso de privacidad</Link>
      <span className="t-small t-muted">© 2026 UNAM · FES Acatlán</span>
    </div>
  </>
);
