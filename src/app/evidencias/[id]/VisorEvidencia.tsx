"use client";

// HU-09 · Abre una evidencia guardada en el sistema desde el enlace de un reporte (Word o PDF).
// El enlace llega a una pestaña nueva sin sesión: se guarda a dónde volver, se pide iniciar sesión y el login regresa aquí.
// El backend decide el acceso (Administrador o la coordinación de esa licenciatura); el PDF se muestra en la página.
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, LinkButton } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Display";
import { ApiError, descargarEvidencia, guardarArchivo, guardarDestinoTrasLogin, leerUsuarioSesion, rutaInicio, usaMocks } from "@/lib/api";
import type { Usuario } from "@/lib/types";

type Estado = { tipo: "cargando" } | { tipo: "listo"; url: string; archivo: Blob } | { tipo: "error"; mensaje: string };

export const VisorEvidencia = ({ id }: { id: string }) => {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [estado, setEstado] = useState<Estado>({ tipo: "cargando" });

  useEffect(() => {
    const sesion = leerUsuarioSesion();
    if (!sesion) {
      guardarDestinoTrasLogin(`/evidencias/${id}`);
      router.replace("/login");
      return;
    }
    setUsuario(sesion);
    if (usaMocks()) {
      setEstado({ tipo: "error", mensaje: "Abrir evidencias guardadas requiere conectar el backend." });
      return;
    }
    let url: string | null = null;
    descargarEvidencia(`/evidencias/${encodeURIComponent(id)}/archivo`)
      .then((archivo) => {
        url = URL.createObjectURL(archivo);
        setEstado({ tipo: "listo", url, archivo });
      })
      .catch((error) => {
        const sinAcceso = error instanceof ApiError && (error.status === 403 || error.status === 404);
        setEstado({
          tipo: "error",
          mensaje: sinAcceso
            ? "No encontramos esta evidencia o tu cuenta no tiene acceso a ella. Si crees que es un error, contacta a la Unidad de Planeación."
            : error instanceof Error ? error.message : "No pudimos abrir la evidencia.",
        });
      });
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [id, router]);

  return (
    <main className="stack" style={{ minHeight: "100vh", gap: 16, padding: "16px 24px" }}>
      <header className="row" style={{ gap: 16, justifyContent: "space-between", flexWrap: "wrap" }}>
        <div className="row" style={{ gap: 16 }}>
          <Image src="/logos/fes-acatlan.png" alt="FES Acatlán" width={152} height={44} priority />
          <div>
            <h1 className="t-h2" style={{ margin: 0 }}>Evidencia del informe de seguimiento</h1>
            <span className="t-small t-muted">Sistema de Seguimiento a la Mejora Continua</span>
          </div>
        </div>
        <div className="row" style={{ gap: 12 }}>
          {estado.tipo === "listo" && (
            <Button variant="contorno" icon="descargar" onClick={() => guardarArchivo(estado.archivo, `evidencia-${id}.pdf`)}>Descargar PDF</Button>
          )}
          {usuario && <LinkButton href={rutaInicio(usuario.rol)} variant="contorno">Ir al sistema</LinkButton>}
        </div>
      </header>
      {estado.tipo === "cargando" && <p className="t-muted" aria-busy="true">Abriendo la evidencia…</p>}
      {estado.tipo === "error" && <Alert tipo="error">{estado.mensaje}</Alert>}
      {estado.tipo === "listo" && (
        <iframe title={`Evidencia ${id}`} src={estado.url} style={{ flex: 1, width: "100%", minHeight: "80vh", border: "1px solid var(--color-gray-200)", borderRadius: 8 }} />
      )}
    </main>
  );
};
