"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Avatar } from "@/components/ui/Display";
import { Icon } from "@/components/ui/Icon";
import { navPorRol } from "@/lib/nav";
import type { Rol } from "@/lib/types";
import { NotificationPanel } from "./NotificationPanel";

type Perfil = { nombre: string; rolLabel: string; iniciales: string; rol: Rol };

// Sesión de ejemplo por sección. Al conectar el backend se reemplaza por el usuario del token (GET /auth/me).
const PERFILES: Record<"admin" | "licenciatura", Perfil> = {
  admin: { nombre: "Mtra. María González", rolLabel: "Administradora", iniciales: "MG", rol: "ADMINISTRADOR" },
  licenciatura: { nombre: "Lic. Jorge Ramírez", rolLabel: "Capturista · Actuaría", iniciales: "JR", rol: "CAPTURISTA" },
};

export const Logos = ({ height = 48 }: { height?: number }) => (
  <span className="app-header__logos">
    <Image src="/logos/escudo-unam.png" alt="Escudo de la UNAM" width={height} height={height} priority />
    <Image src="/logos/fes-acatlan.png" alt="FES Acatlán" width={Math.round(height * 3.45)} height={height} priority />
  </span>
);

export const AppShell = ({ area, children }: { area: "admin" | "licenciatura"; children: ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [panelAbierto, setPanelAbierto] = useState(false);
  const perfil = PERFILES[area];
  const secciones = navPorRol(perfil.rol);

  const cerrarSesion = () => {
    window.sessionStorage.removeItem("ssm.token");
    router.push("/login");
  };

  return (
    <>
      <a href="#contenido" className="sr-only">Saltar al contenido</a>
      <header className="app-header">
        <Logos />
        <span className="app-header__sep" aria-hidden />
        <div>
          <div className="t-h3">Sistema de Seguimiento de Mejora</div>
          <div className="t-small" style={{ color: "var(--color-accent)" }}>FES Acatlán · UNAM</div>
        </div>
        <span className="spacer" />
        <button type="button" className="app-header__btn" aria-label="Notificaciones (3 nuevas)" onClick={() => setPanelAbierto(true)}>
          <Icon name="campana" size={22} />
          <span className="app-header__count">3</span>
        </button>
        <Link href="/perfil" className="app-header__btn" aria-label="Configuración y perfil"><Icon name="engrane" size={22} /></Link>
        <div className="row" style={{ gap: 12, paddingLeft: 8 }}>
          <Avatar iniciales={perfil.iniciales} size={40} accent />
          <div>
            <div className="t-medium">{perfil.nombre}</div>
            <div className="t-small">{perfil.rolLabel}</div>
          </div>
        </div>
      </header>

      <div className="shell">
        <nav className="sidebar" aria-label="Navegación principal">
          {secciones.map((seccion) => (
            <div key={seccion.title}>
              <div className="sidebar__section">{seccion.title}</div>
              {seccion.items.map((item) => (
                <Link key={item.href} href={item.href} className="sidebar__item" aria-current={pathname.startsWith(item.href) ? "page" : undefined}>
                  <Icon name={item.icon} size={20} />
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
          <span className="spacer" />
          <div className="sidebar__divider" />
          <Link href="/perfil" className="sidebar__item" aria-current={pathname === "/perfil" ? "page" : undefined}><Icon name="usuario" size={20} />Mi perfil</Link>
          <button type="button" className="sidebar__item" style={{ background: "none", border: 0, cursor: "pointer", textAlign: "left" }} onClick={cerrarSesion}>
            <Icon name="salir" size={20} />Cerrar sesión
          </button>
        </nav>
        <main id="contenido" className="main">{children}</main>
      </div>

      <NotificationPanel open={panelAbierto} onClose={() => setPanelAbierto(false)} />
    </>
  );
};
