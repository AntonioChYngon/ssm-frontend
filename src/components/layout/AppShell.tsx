"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Avatar } from "@/components/ui/Display";
import { Icon } from "@/components/ui/Icon";
import { navPorRol } from "@/lib/nav";
import { cerrarSesion as borrarSesion, leerUsuarioSesion, listarNotificaciones, obtenerUsuarioActual, rutaInicio, usaMocks } from "@/lib/api";
import { ROL_LABEL, type Rol, type Usuario } from "@/lib/types";
import { NotificationPanel } from "./NotificationPanel";

type Area = "admin" | "licenciatura" | "comun";

type Perfil = { nombre: string; rolLabel: string; iniciales: string; rol: Rol };

// Cuentas del seed por sección: solo en modo demostración si no hay sesión guardada (ver src/lib/demo.ts).
const PERFILES_DEMO: Record<"admin" | "licenciatura", Perfil> = {
  admin: { nombre: "Administración SSM", rolLabel: "Administrador", iniciales: "AS", rol: "ADMINISTRADOR" },
  licenciatura: { nombre: "Captura Actuaría", rolLabel: "Captura · Actuaría", iniciales: "CA", rol: "CAPTURA" },
};

const iniciales = (nombre: string) =>
  nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((parte) => parte[0]?.toUpperCase()).join("");

const perfilDesdeUsuario = (usuario: Usuario): Perfil => ({
  nombre: usuario.nombre,
  rolLabel: usuario.licenciatura ? `${ROL_LABEL[usuario.rol]} · ${usuario.licenciatura}` : ROL_LABEL[usuario.rol],
  iniciales: iniciales(usuario.nombre),
  rol: usuario.rol,
});

/** Lee la sesión guardada y la confirma con GET /auth/me. Sin sesión válida regresa al login. */
const usePerfil = (area: Area) => {
  const router = useRouter();
  const [perfil, setPerfil] = useState<Perfil | null>(null);

  useEffect(() => {
    const guardado = leerUsuarioSesion();
    if (!guardado && usaMocks()) {
      setPerfil(PERFILES_DEMO[area === "admin" ? "admin" : "licenciatura"]);
      return;
    }
    if (!guardado) {
      router.replace("/login");
      return;
    }
    // "comun" (Mi perfil) sirve a todos los roles; las demás áreas son exclusivas.
    const enAreaIncorrecta = area !== "comun" && (area === "admin") !== (guardado.rol === "ADMINISTRADOR");
    if (enAreaIncorrecta) {
      router.replace(rutaInicio(guardado.rol));
      return;
    }
    setPerfil(perfilDesdeUsuario(guardado));
    obtenerUsuarioActual()
      .then((usuario) => setPerfil(perfilDesdeUsuario(usuario)))
      .catch(() => {
        borrarSesion();
        router.replace("/login");
      });
  }, [area, router]);

  return perfil;
};

export const Logos = ({ height = 48 }: { height?: number }) => (
  <span className="app-header__logos">
    <Image src="/logos/escudo-unam.png" alt="Escudo de la UNAM" width={height} height={height} priority />
    <Image src="/logos/fes-acatlan.png" alt="FES Acatlán" width={Math.round(height * 3.45)} height={height} priority />
  </span>
);

export const AppShell = ({ area, children }: { area: Area; children: ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [nuevas, setNuevas] = useState(0);
  const perfil = usePerfil(area);

  // Contador real de la campana (se actualiza al cerrar el panel). Sin notificaciones no se muestra.
  useEffect(() => {
    if (!perfil || panelAbierto) return;
    listarNotificaciones().then((lista) => setNuevas(lista.filter((n) => !n.leida).length)).catch(() => setNuevas(0));
  }, [perfil, panelAbierto]);

  // Mientras se confirma la sesión no se muestra contenido protegido.
  if (!perfil) {
    return <main className="t-muted" style={{ padding: 48 }} aria-busy="true">Verificando tu sesión…</main>;
  }
  const secciones = navPorRol(perfil.rol);

  const cerrarSesion = () => {
    borrarSesion();
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
        <button type="button" className="app-header__btn" aria-label={`Notificaciones (${nuevas} nuevas)`} onClick={() => setPanelAbierto(true)}>
          <Icon name="campana" size={22} />
          {nuevas > 0 && <span className="app-header__count">{nuevas}</span>}
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
