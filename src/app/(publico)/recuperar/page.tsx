"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { PublicFooter, SplitLayout } from "@/components/layout/PublicLayout";
import { Button, LinkButton } from "@/components/ui/Button";
import { Alert, Stepper } from "@/components/ui/Display";
import { TextField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { ApiError, restablecerContrasena, solicitarRecuperacion } from "@/lib/api";

const ocultar = (correo: string) => {
  const [usuario, dominio] = correo.split("@");
  return `${usuario?.[0] ?? ""}•••@${dominio ?? ""}`;
};

const RecuperarPage = () => {
  const [token, setToken] = useState<string>();
  const [correo, setCorreo] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [nueva, setNueva] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [actualizada, setActualizada] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token") ?? "");
  }, []);

  const enviarEnlace = async (event: FormEvent) => {
    event.preventDefault();
    setCargando(true);
    try {
      await solicitarRecuperacion(correo);
      setError(undefined);
      setEnviado(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No pudimos enviar el correo. Intenta más tarde.");
    } finally {
      setCargando(false);
    }
  };

  const guardarContrasena = async (event: FormEvent) => {
    event.preventDefault();
    if (nueva !== confirmacion) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (nueva.length < 8 || !/[A-ZÁÉÍÓÚÑ]/.test(nueva) || !/\d/.test(nueva)) {
      setError("La contraseña debe tener al menos 8 caracteres, una mayúscula y un número.");
      return;
    }
    setCargando(true);
    try {
      await restablecerContrasena(token ?? "", nueva);
      setError(undefined);
      setActualizada(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No pudimos actualizar la contraseña. Solicita un enlace nuevo.");
    } finally {
      setCargando(false);
    }
  };

  const reglas = [
    { texto: "Al menos 8 caracteres", ok: nueva.length >= 8 },
    { texto: "Una letra mayúscula", ok: /[A-ZÁÉÍÓÚÑ]/.test(nueva) },
    { texto: "Un número", ok: /\d/.test(nueva) },
  ];
  const conToken = Boolean(token);

  return (
    <SplitLayout titulo="Recupera el acceso a tu cuenta" texto="Te ayudaremos a crear una contraseña nueva para tu correo institucional.">
      <Link href="/login" className="row t-medium" style={{ gap: 6 }}><Icon name="flecha-izquierda" size={18} />Volver a iniciar sesión</Link>
      <div>
        <h1 className="t-h1">{conToken ? "Crea una contraseña nueva" : "Recupera tu contraseña"}</h1>
        <p className="t-muted" style={{ margin: "6px 0 0" }}>{conToken ? "Elige una contraseña que no utilices en otros sitios." : "Escribe el correo con el que te registraron en el sistema."}</p>
      </div>
      <Stepper pasos={["Correo", "Revisa tu bandeja", "Nueva contraseña"]} actual={conToken ? 2 : enviado ? 1 : 0} />

      {conToken ? (
        actualizada ? (
          <div className="stack">
            <Alert tipo="exito">Tu contraseña se actualizó correctamente. Ya puedes iniciar sesión.</Alert>
            <LinkButton href="/login">Ir a iniciar sesión</LinkButton>
          </div>
        ) : (
          <form className="stack" style={{ gap: 20 }} onSubmit={guardarContrasena} noValidate>
            <TextField label="Nueva contraseña" icon="candado" type="password" autoComplete="new-password" value={nueva} onChange={(e) => setNueva(e.target.value)} error={error} required />
            <TextField label="Confirmar contraseña" icon="candado" type="password" autoComplete="new-password" value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} error={confirmacion && confirmacion !== nueva ? "Las contraseñas no coinciden." : undefined} required />
            <div className="stack" style={{ gap: 6 }}>
              {reglas.map((r) => <span key={r.texto} className={["row t-small", r.ok ? "t-success" : "t-muted"].join(" ")} style={{ gap: 8 }}><Icon name={r.ok ? "check" : "cerrar"} size={18} />{r.texto}</span>)}
            </div>
            {error && <Alert tipo="error">{error}</Alert>}
            <Button type="submit" icon="check" disabled={cargando}>{cargando ? "Guardando…" : "Guardar contraseña"}</Button>
          </form>
        )
      ) : (
        <form className="stack" style={{ gap: 20 }} onSubmit={enviarEnlace} noValidate>
          <TextField label="Correo institucional" icon="correo" type="email" autoComplete="email" value={correo} onChange={(e) => setCorreo(e.target.value)} error={error} required />
          {enviado && <Alert tipo="exito">Si el correo está registrado, recibirás un enlace en {ocultar(correo)}. Revisa también “Correo no deseado”. El enlace vence en 30 minutos.</Alert>}
          <div className="row" style={{ gap: 12 }}>
            <Button type="submit" icon="enviar" className="grow" disabled={cargando}>{cargando ? "Enviando…" : enviado ? "Reenviar enlace" : "Enviar enlace"}</Button>
            {enviado && <Button variant="contorno" onClick={() => { setEnviado(false); setError(undefined); }}>Cambiar correo</Button>}
          </div>
          <div className="muted-box">
            <div className="t-medium">¿No recibiste el correo?</div>
            <p className="t-small t-muted" style={{ margin: "4px 0 0" }}>Si el problema persiste, el Administrador puede restablecer tu contraseña desde Gestión de usuarios.</p>
          </div>
        </form>
      )}
      <PublicFooter />
    </SplitLayout>
  );
};

export default RecuperarPage;
