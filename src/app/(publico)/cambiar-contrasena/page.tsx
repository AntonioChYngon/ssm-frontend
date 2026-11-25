"use client";

// Cambio obligatorio: la cuenta entró con una contraseña temporal (alta, restablecimiento del Administrador
// o cuenta inicial de coordinación). El backend no permite nada más hasta que la cambie.
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { PublicFooter, SplitLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Display";
import { TextField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import {
  ApiError,
  cambiarContrasena,
  cerrarSesion,
  leerUsuarioSesion,
  obtenerUsuarioActual,
  reglasContrasena,
  rutaInicio,
  usaMocks,
} from "@/lib/api";
import type { Usuario } from "@/lib/types";

const CambiarContrasenaPage = () => {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string>();

  // Solo entra quien tiene sesión y un cambio pendiente; los demás van al login o a su inicio.
  useEffect(() => {
    const guardado = leerUsuarioSesion();
    if (!guardado) {
      router.replace("/login");
      return;
    }
    const decidir = (u: Usuario) => (u.debeCambiarContrasena ? setUsuario(u) : router.replace(rutaInicio(u.rol)));
    if (usaMocks()) {
      decidir(guardado);
      return;
    }
    obtenerUsuarioActual()
      .then(decidir)
      .catch(() => {
        cerrarSesion();
        router.replace("/login");
      });
  }, [router]);

  const reglas = reglasContrasena(nueva);
  const coincide = confirmacion.length > 0 && confirmacion === nueva;
  const distinta = nueva.length === 0 || nueva !== actual;
  const valida = actual.length > 0 && reglas.every((r) => r.ok) && coincide && distinta;

  const guardar = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (!valida || enviando || !usuario) return;
    setEnviando(true);
    setError(undefined);
    try {
      await cambiarContrasena(actual, nueva);
      router.replace(rutaInicio(usuario.rol));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No pudimos actualizar la contraseña. Revisa tu conexión e intenta de nuevo.");
      setEnviando(false);
    }
  };

  const salir = () => {
    cerrarSesion();
    router.replace("/login");
  };

  if (!usuario) {
    return <main className="t-muted" style={{ padding: 48 }} aria-busy="true">Verificando tu sesión…</main>;
  }

  return (
    <SplitLayout titulo="Crea tu contraseña" texto="Tu cuenta tiene una contraseña temporal. Para proteger la información de tu licenciatura, crea una propia antes de continuar.">
      <div>
        <h1 className="t-h1">Cambia tu contraseña temporal</h1>
        <p className="t-muted" style={{ margin: "6px 0 0" }}>{usuario.correo}</p>
      </div>
      <Alert tipo="info">Es un paso único: después entrarás siempre con la contraseña que elijas aquí.</Alert>
      {error && <Alert tipo="error">{error}</Alert>}
      <form className="stack" style={{ gap: 20 }} onSubmit={guardar} noValidate>
        <TextField label="Contraseña temporal" icon="candado" type="password" autoComplete="current-password" value={actual} onChange={(e) => setActual(e.target.value)} required />
        <TextField label="Nueva contraseña" icon="candado" type="password" autoComplete="new-password" value={nueva} onChange={(e) => setNueva(e.target.value)}
          error={!distinta ? "Debe ser distinta de la contraseña temporal." : undefined} required />
        <TextField label="Confirmar nueva contraseña" icon="candado" type="password" autoComplete="new-password" value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)}
          error={confirmacion && !coincide ? "Las contraseñas no coinciden." : undefined} required />
        <div className="stack" style={{ gap: 6 }}>
          <span className="t-small t-medium t-muted">Tu nueva contraseña debe tener:</span>
          {reglas.map((r) => (
            <span key={r.texto} className={["row t-small", r.ok ? "t-success" : "t-muted"].join(" ")} style={{ gap: 8 }}>
              <Icon name={r.ok ? "check" : "cerrar"} size={18} />{r.texto}
            </span>
          ))}
        </div>
        <Button type="submit" icon="check" block disabled={!valida || enviando}>{enviando ? "Guardando…" : "Guardar y continuar"}</Button>
        <Button variant="contorno" icon="salir" block onClick={salir}>Cerrar sesión</Button>
      </form>
      <PublicFooter />
    </SplitLayout>
  );
};

export default CambiarContrasenaPage;
