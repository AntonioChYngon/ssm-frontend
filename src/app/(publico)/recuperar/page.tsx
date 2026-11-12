"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { PublicFooter, SplitLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/Button";
import { Alert, Stepper } from "@/components/ui/Display";
import { TextField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { ApiError, solicitarRecuperacion } from "@/lib/api";

const ocultar = (correo: string) => {
  const [usuario, dominio] = correo.split("@");
  return `${usuario?.[0] ?? ""}•••@${dominio ?? ""}`;
};

const RecuperarPage = () => {
  const [correo, setCorreo] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string>();

  const enviar = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await solicitarRecuperacion(correo);
      setError(undefined);
      setEnviado(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No pudimos enviar el correo. Intenta más tarde.");
    }
  };

  return (
    <SplitLayout titulo="Recupera el acceso a tu cuenta" texto="Te enviaremos un enlace seguro a tu correo institucional para que crees una contraseña nueva.">
      <Link href="/login" className="row t-medium" style={{ gap: 6 }}><Icon name="flecha-izquierda" size={18} />Volver a iniciar sesión</Link>
      <div>
        <h1 className="t-h1">Recupera tu contraseña</h1>
        <p className="t-muted" style={{ margin: "6px 0 0" }}>Escribe el correo con el que te registraron en el sistema.</p>
      </div>
      <Stepper pasos={["Correo", "Revisa tu bandeja", "Nueva contraseña"]} actual={enviado ? 1 : 0} />
      <form className="stack" style={{ gap: 20 }} onSubmit={enviar} noValidate>
        <TextField label="Correo institucional" icon="correo" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} error={error} required />
        {enviado && <Alert tipo="exito">Listo. Enviamos un enlace a {ocultar(correo)}. Revisa también “Correo no deseado”. El enlace vence en 30 minutos.</Alert>}
        <div className="row" style={{ gap: 12 }}>
          <Button type="submit" icon="enviar" className="grow">{enviado ? "Reenviar enlace" : "Enviar enlace"}</Button>
          {enviado && <Button variant="contorno" onClick={() => setEnviado(false)}>Cambiar correo</Button>}
        </div>
      </form>
      <div className="muted-box">
        <div className="t-medium">¿No recibiste el correo?</div>
        <p className="t-small t-muted" style={{ margin: "4px 0 0" }}>Si el problema persiste, el Administrador del sistema puede restablecer tu contraseña desde Gestión de usuarios.</p>
      </div>
      <PublicFooter />
    </SplitLayout>
  );
};

export default RecuperarPage;
