"use client";

// Mi perfil: datos reales de la sesión (GET /auth/me), cambio de contraseña y actividad reciente de la propia
// cuenta (GET /auth/actividad, tomada de la auditoría). Los avisos salen siempre por correo y en la campana.
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert, Avatar, Badge, Card, EmptyState, PageTitle } from "@/components/ui/Display";
import { TextField } from "@/components/ui/Field";
import { Icon, type IconName } from "@/components/ui/Icon";
import { ChipGroup } from "@/components/ui/Interactive";
import { actualizarUsuarioSesion, cambiarContrasena, obtenerMiActividad, obtenerUsuarioActual, reglasContrasena, rutaInicio } from "@/lib/api";
import { ROL_LABEL, type Actividad, type TipoActividad, type Usuario } from "@/lib/types";

const ICONO_ACTIVIDAD: Record<TipoActividad, IconName> = {
  SESION: "salir",
  SEGURIDAD: "candado",
  PLAN: "documento",
  CUENTAS: "usuarios",
  CICLOS: "calendario",
  OTRO: "editar",
};

const FILTROS: Record<string, (a: Actividad) => boolean> = {
  Todo: () => true,
  Accesos: (a) => a.tipo === "SESION" || a.tipo === "SEGURIDAD",
  Modificaciones: (a) => a.tipo !== "SESION" && a.tipo !== "SEGURIDAD",
};

const iniciales = (nombre: string) =>
  nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((parte) => parte[0]?.toUpperCase()).join("");

const fechaCorta = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—");

/** "Hoy, 08:40", "Ayer, 17:02" o "10/11/2026, 12:15" en la hora local. */
const cuando = (iso: string) => {
  const fecha = new Date(iso);
  const hora = fecha.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  const dias = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(iso).setHours(0, 0, 0, 0)) / 86_400_000);
  if (dias === 0) return `Hoy, ${hora}`;
  if (dias === 1) return `Ayer, ${hora}`;
  return `${fechaCorta(iso)}, ${hora}`;
};

const PerfilPage = () => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [actividad, setActividad] = useState<Actividad[] | null>(null);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [filtro, setFiltro] = useState("Todo");

  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);

  const cargarActividad = () =>
    obtenerMiActividad()
      .then(setActividad)
      .catch(() => setActividad([]));

  useEffect(() => {
    obtenerUsuarioActual()
      .then((u) => {
        setUsuario(u);
        actualizarUsuarioSesion(u);
      })
      .catch((e) => setErrorCarga(e instanceof Error ? e.message : "No pudimos cargar tu perfil."));
    void cargarActividad();
  }, []);

  const reglas = reglasContrasena(nueva);
  const coincide = confirmacion.length > 0 && confirmacion === nueva;
  const distinta = nueva.length === 0 || nueva !== actual;
  const valida = actual.length > 0 && reglas.every((r) => r.ok) && coincide && distinta;

  const guardarContrasena = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (!valida || cargando) return;
    setCargando(true);
    setMensaje(null);
    try {
      await cambiarContrasena(actual, nueva);
      setMensaje({ tipo: "exito", texto: "La contraseña se actualizó correctamente." });
      setActual("");
      setNueva("");
      setConfirmacion("");
      void cargarActividad();
    } catch (error) {
      setMensaje({ tipo: "error", texto: error instanceof Error ? error.message : "No se pudo actualizar la contraseña." });
    } finally {
      setCargando(false);
    }
  };

  const datos: [IconName, string, string][] = usuario
    ? [
        ["correo", "Correo institucional", usuario.correo],
        ["usuario", "Rol", ROL_LABEL[usuario.rol]],
        ...(usuario.licenciatura ? ([["documento", "Licenciatura asignada", usuario.licenciatura]] as [IconName, string, string][]) : []),
        ["reloj", "Alta en el sistema", fechaCorta(usuario.creadoEn)],
      ]
    : [];
  const visibles = (actividad ?? []).filter(FILTROS[filtro] ?? FILTROS.Todo);

  return (
    <>
      <PageTitle
        crumbs={[{ label: "Inicio", href: usuario ? rutaInicio(usuario.rol) : "/" }, { label: "Mi perfil" }]}
        title="Mi perfil"
        subtitle="Revisa tus datos, cambia tu contraseña y consulta tu actividad reciente."
      />
      {errorCarga && <Alert tipo="error">{errorCarga}</Alert>}
      <div className="row row--top row--responsive" style={{ gap: 24 }}>
        <div className="stack side-380" style={{ gap: 24 }}>
          <Card>
            {usuario ? (
              <>
                <div className="stack" style={{ alignItems: "center", gap: 8 }}>
                  <Avatar iniciales={iniciales(usuario.nombre)} size={96} accent />
                  <h2 className="t-h2" style={{ textAlign: "center" }}>{usuario.nombre}</h2>
                  <Badge estado="En revisión">{ROL_LABEL[usuario.rol]}</Badge>
                </div>
                <hr className="divider" />
                {datos.map(([icon, k, v]) => (
                  <div key={k} className="row row--top" style={{ gap: 12 }}>
                    <Icon name={icon} size={20} className="t-primary" />
                    <div><div className="t-small t-muted">{k}</div><div className="t-medium" style={{ overflowWrap: "anywhere" }}>{v}</div></div>
                  </div>
                ))}
                <Alert tipo="info">Para cambiar tu nombre, rol o licenciatura, contacta al Administrador.</Alert>
              </>
            ) : (
              !errorCarga && <p className="t-muted" aria-busy="true">Cargando tu perfil…</p>
            )}
          </Card>
          <Card title="Avisos" style={{ gap: 4 }}>
            <p className="row row--top t-small t-muted" style={{ gap: 8, margin: 0 }}>
              <Icon name="campana" size={18} />Los avisos de tus planes llegan a la campana del sistema y a tu correo institucional.
            </p>
          </Card>
        </div>
        <div className="stack grow" style={{ gap: 24 }}>
          <Card title="Cambiar contraseña" subtitle="Usa una contraseña que no utilices en otros sitios." style={{ gap: 18 }}>
            <form className="stack" style={{ gap: 18 }} onSubmit={guardarContrasena}>
              <TextField label="Contraseña actual" icon="candado" type="password" autoComplete="current-password" value={actual} onChange={(e) => setActual(e.target.value)} />
              <div className="grid-2" style={{ gap: 16 }}>
                <TextField label="Nueva contraseña" icon="candado" type="password" autoComplete="new-password" value={nueva} onChange={(e) => setNueva(e.target.value)}
                  error={!distinta ? "Debe ser distinta de la actual." : undefined} />
                <TextField label="Confirmar nueva contraseña" icon="candado" type="password" autoComplete="new-password" value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)}
                  error={confirmacion && !coincide ? "Las contraseñas no coinciden." : undefined} />
              </div>
              <div className="stack" style={{ gap: 6 }}>
                <span className="t-small t-medium t-muted">Tu nueva contraseña debe tener:</span>
                {reglas.map((r) => (
                  <span key={r.texto} className={["row t-small", r.ok ? "t-success" : "t-danger"].join(" ")} style={{ gap: 8 }}><Icon name={r.ok ? "check" : "cerrar"} size={18} />{r.texto}</span>
                ))}
              </div>
              {mensaje && <Alert tipo={mensaje.tipo}>{mensaje.texto}</Alert>}
              <div className="row" style={{ justifyContent: "flex-end", gap: 12 }}>
                <Button variant="contorno" type="button" onClick={() => { setActual(""); setNueva(""); setConfirmacion(""); setMensaje(null); }}>Cancelar</Button>
                <Button type="submit" icon="check" disabled={!valida || cargando}>{cargando ? "Guardando…" : "Guardar contraseña"}</Button>
              </div>
            </form>
          </Card>
          <Card title="Actividad reciente" subtitle="Tus últimos 10 movimientos en el sistema." actions={<ChipGroup label="Tipo de actividad" options={Object.keys(FILTROS)} value={filtro} onChange={setFiltro} />} style={{ gap: 0 }}>
            {actividad === null ? (
              <p className="t-muted" aria-busy="true">Cargando actividad…</p>
            ) : visibles.length === 0 ? (
              <EmptyState icon="reloj" titulo="Sin movimientos" mensaje={filtro === "Todo" ? "Aquí aparecerán tus inicios de sesión y cambios." : "No hay movimientos de este tipo."} />
            ) : (
              visibles.map((a) => (
                <div key={a.id} className="list-row">
                  <Icon name={ICONO_ACTIVIDAD[a.tipo]} size={20} className={a.tipo === "SEGURIDAD" ? "t-danger" : "t-muted"} />
                  <span className="grow">{a.descripcion}</span>
                  <span className="t-small t-muted">{cuando(a.fecha)}</span>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>
    </>
  );
};

export default PerfilPage;
