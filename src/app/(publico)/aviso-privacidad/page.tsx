import type { Metadata } from "next";
import Image from "next/image";
import { LinkButton } from "@/components/ui/Button";
import { Alert, Breadcrumb } from "@/components/ui/Display";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = { title: "Aviso de privacidad" };

// TEXTO DE EJEMPLO: sustituir por el aviso oficial aprobado por la Unidad de Transparencia de la UNAM.
const SECCIONES = [
  ["Responsable del tratamiento", "La Facultad de Estudios Superiores Acatlán de la Universidad Nacional Autónoma de México es responsable del tratamiento de los datos personales que se recaban a través del Sistema de Seguimiento de Mejora (SSM)."],
  ["Datos personales que recabamos", "Nombre completo, correo electrónico institucional, rol asignado en el sistema, licenciatura de adscripción y registros de actividad (fecha y hora de acceso, cambios realizados)."],
  ["Finalidades", "Administrar las cuentas de acceso, registrar y dar seguimiento a los planes de mejora continua, enviar notificaciones sobre hitos y vencimientos, y mantener una bitácora de auditoría de los cambios."],
  ["Transferencias", "Sus datos no serán transferidos a terceros, salvo las excepciones previstas en la legislación aplicable en materia de protección de datos personales."],
  ["Derechos ARCO", "Puede ejercer sus derechos de acceso, rectificación, cancelación y oposición ante la Unidad de Transparencia de la UNAM, por los medios que esta disponga."],
  ["Medidas de seguridad", "El sistema aplica controles de acceso por rol, validación de dominio institucional y registro de auditoría, conforme a los lineamientos de seguridad de la información de la UNAM."],
] as const;

const LINEAMIENTOS = [
  "Lineamientos para la Protección de Datos Personales en Posesión de la UNAM",
  "Lineamientos de Seguridad de la Información en Sitios Web de la UNAM",
  "Política de Seguridad de la Información · DGTIC",
];

const AvisoPrivacidadPage = () => (
  <div style={{ minHeight: "100vh" }}>
    <header className="app-header" style={{ height: 80, padding: "0 40px" }}>
      <Image src="/logos/escudo-unam.png" alt="Escudo de la UNAM" width={48} height={48} />
      <Image src="/logos/fes-acatlan.png" alt="FES Acatlán" width={166} height={48} />
      <div>
        <div className="t-h3">Sistema de Seguimiento de Mejora</div>
        <div className="t-small t-accent">FES Acatlán · UNAM</div>
      </div>
      <span className="spacer" />
      <LinkButton href="/login" variant="secundario" icon="flecha-izquierda">Volver a iniciar sesión</LinkButton>
    </header>
    <main className="stack" style={{ alignItems: "center", padding: "40px 16px 56px" }}>
      <div style={{ width: "min(880px, 100%)" }}>
        <Breadcrumb items={[{ label: "Inicio de sesión", href: "/login" }, { label: "Aviso de privacidad" }]} />
      </div>
      <article className="card" style={{ width: "min(880px, 100%)", padding: "48px 56px", gap: 20 }}>
        <div className="row">
          <span className="kpi__icon tone-azul" style={{ width: 56, height: 56 }}><Icon name="escudo" size={28} /></span>
          <div>
            <h1 className="t-h1">Aviso de privacidad integral</h1>
            <p className="t-small t-muted" style={{ margin: 0 }}>Última actualización: 11 de noviembre de 2026</p>
          </div>
        </div>
        <Alert tipo="info">Texto de ejemplo. Sustituir por el aviso oficial aprobado por la Unidad de Transparencia de la UNAM.</Alert>
        {SECCIONES.map(([titulo, texto]) => (
          <section key={titulo} className="stack" style={{ gap: 8 }}>
            <h2 className="t-h3 t-primary">{titulo}</h2>
            <p style={{ margin: 0, lineHeight: "26px" }}>{texto}</p>
          </section>
        ))}
        <div className="muted-box stack" style={{ gap: 4 }}>
          <span className="t-medium">Lineamientos relacionados</span>
          {LINEAMIENTOS.map((l) => (
            <a key={l} href="#" className="row t-medium" style={{ gap: 6, minHeight: 44 }}><Icon name="documento" size={18} />{l}</a>
          ))}
        </div>
        <div className="row" style={{ justifyContent: "flex-end", gap: 12 }}>
          <LinkButton href="/login" variant="primario">Entendido, volver</LinkButton>
        </div>
      </article>
    </main>
  </div>
);

export default AvisoPrivacidadPage;
