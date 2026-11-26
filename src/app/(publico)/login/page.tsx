"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { PublicFooter, SplitLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Display";
import { Checkbox, TextField } from "@/components/ui/Field";
import { ApiError, MENSAJE_DOMINIO, esCorreoInstitucional, guardarSesion, login, rutaTrasLogin, tomarDestinoTrasLogin, usaMocks } from "@/lib/api";

const LoginPage = () => {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [errorCorreo, setErrorCorreo] = useState<string>();
  const [errorGeneral, setErrorGeneral] = useState<string>();
  const [enviando, setEnviando] = useState(false);

  const iniciarSesion = async (event: FormEvent) => {
    event.preventDefault();
    setErrorGeneral(undefined);
    if (!esCorreoInstitucional(correo)) {
      setErrorCorreo(MENSAJE_DOMINIO);
      return;
    }
    setErrorCorreo(undefined);
    setEnviando(true);
    try {
      const sesion = await login(correo, contrasena);
      guardarSesion(sesion);
      // HU-09: si llegó desde el enlace de una evidencia, vuelve a ella (salvo que deba cambiar su contraseña temporal).
      const destino = sesion.usuario.debeCambiarContrasena ? null : tomarDestinoTrasLogin();
      router.push(destino ?? rutaTrasLogin(sesion.usuario));
    } catch (error) {
      setErrorGeneral(error instanceof ApiError ? error.message : "No pudimos iniciar sesión. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <SplitLayout titulo="Sistema de Seguimiento de Mejora" texto="Registra, da seguimiento y valida los planes de mejora continua derivados de la acreditación de tus licenciaturas.">
      <div>
        <h1 className="t-h1">Iniciar sesión</h1>
        <p className="t-muted" style={{ margin: "6px 0 0" }}>Usa tu cuenta institucional de la UNAM.</p>
      </div>
      <Alert tipo="info">Solo se aceptan correos @acatlan.unam.mx o @pcpuma.acatlan.unam.mx.</Alert>
      {errorGeneral && <Alert tipo="error">{errorGeneral}</Alert>}
      <form className="stack" style={{ gap: 20 }} onSubmit={iniciarSesion} noValidate>
        <TextField label="Correo institucional" icon="correo" type="email" autoComplete="username" placeholder="nombre@acatlan.unam.mx" value={correo} onChange={(e) => setCorreo(e.target.value)} error={errorCorreo} required />
        <TextField label="Contraseña" icon="candado" type="password" autoComplete="current-password" value={contrasena} onChange={(e) => setContrasena(e.target.value)} required />
        <div className="row">
          <Checkbox label="Recordarme en este equipo" />
          <span className="spacer" />
          <Link href="/recuperar" className="t-medium">¿Olvidaste tu contraseña?</Link>
        </div>
        <Button type="submit" icon="salir" block disabled={enviando}>{enviando ? "Entrando…" : "Iniciar sesión"}</Button>
      </form>
      {usaMocks() && (
        <p className="t-small t-muted" style={{ margin: 0 }}>Modo demostración: usa maria.gonzalez@acatlan.unam.mx para entrar como Administradora o cualquier otro correo institucional para entrar como Captura.</p>
      )}
      <PublicFooter />
    </SplitLayout>
  );
};

export default LoginPage;
