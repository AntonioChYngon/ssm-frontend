"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert, Avatar, Badge, Card, PageTitle } from "@/components/ui/Display";
import { Radio, TextField } from "@/components/ui/Field";
import { Icon, type IconName } from "@/components/ui/Icon";
import { leerUsuarioSesion, rutaInicio } from "@/lib/api";
import { ROL_LABEL, type CanalNotificacion, type Usuario } from "@/lib/types";

const iniciales = (nombre: string) => nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");

const PerfilPage = () => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [canal, setCanal] = useState<CanalNotificacion>("AMBOS");

  useEffect(() => setUsuario(leerUsuarioSesion()), []);

  const datos: [IconName, string, string][] = usuario
    ? [
        ["correo", "Correo institucional", usuario.correo],
        ["usuario", "Rol", ROL_LABEL[usuario.rol]],
        ["documento", "Licenciatura asignada", usuario.licenciatura ?? "Todas (Unidad de Planeación)"],
      ]
    : [];
  const [nueva, setNueva] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const reglas = [
    { texto: "Al menos 8 caracteres", ok: nueva.length >= 8 },
    { texto: "Una letra mayúscula", ok: /[A-ZÁÉÍÓÚÑ]/.test(nueva) },
    { texto: "Un número", ok: /\d/.test(nueva) },
  ];
  const coincide = confirmacion.length > 0 && confirmacion === nueva;
  const valida = reglas.every((r) => r.ok) && coincide;

  return (
    <>
      <PageTitle crumbs={[{ label: "Inicio", href: usuario ? rutaInicio(usuario.rol) : "/" }, { label: "Mi perfil" }]} title="Mi perfil" subtitle="Revisa tus datos, cambia tu contraseña y consulta tu actividad reciente." />
      <div className="row row--top row--responsive" style={{ gap: 24 }}>
        <div className="stack side-380" style={{ gap: 24 }}>
          <Card>
            <div className="stack" style={{ alignItems: "center", gap: 8 }}>
              <Avatar iniciales={usuario ? iniciales(usuario.nombre) : ""} size={96} accent />
              <h2 className="t-h2">{usuario?.nombre ?? "Mi cuenta"}</h2>
              {usuario && <Badge estado="En revisión">{ROL_LABEL[usuario.rol]}</Badge>}
            </div>
            <hr className="divider" />
            {datos.map(([icon, k, v]) => (
              <div key={k} className="row row--top" style={{ gap: 12 }}>
                <Icon name={icon} size={20} className="t-primary" />
                <div><div className="t-small t-muted">{k}</div><div className="t-medium">{v}</div></div>
              </div>
            ))}
            <Alert tipo="info">Para cambiar tu rol o licenciatura, contacta al Administrador.</Alert>
          </Card>
          <Card title="¿Cómo quieres recibir avisos?" subtitle="Vencimientos, hitos próximos y devoluciones." style={{ gap: 4 }}>
            <Radio name="canal" label="Solo por correo" checked={canal === "CORREO"} onChange={() => setCanal("CORREO")} />
            <Radio name="canal" label="Solo en la aplicación (In-App)" checked={canal === "IN_APP"} onChange={() => setCanal("IN_APP")} />
            <Radio name="canal" label="Correo e In-App (recomendado)" checked={canal === "AMBOS"} onChange={() => setCanal("AMBOS")} />
          </Card>
        </div>
        <div className="stack grow" style={{ gap: 24 }}>
          <Card title="Cambiar contraseña" subtitle="Usa una contraseña que no utilices en otros sitios." style={{ gap: 18 }}>
            <TextField label="Contraseña actual" icon="candado" type="password" autoComplete="current-password" />
            <div className="grid-2" style={{ gap: 16 }}>
              <TextField label="Nueva contraseña" icon="candado" type="password" autoComplete="new-password" value={nueva} onChange={(e) => setNueva(e.target.value)} />
              <TextField label="Confirmar nueva contraseña" icon="candado" type="password" autoComplete="new-password" value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)}
                error={confirmacion && !coincide ? "Las contraseñas no coinciden." : undefined} />
            </div>
            <div className="stack" style={{ gap: 6 }}>
              <span className="t-small t-medium t-muted">Tu nueva contraseña debe tener:</span>
              {reglas.map((r) => (
                <span key={r.texto} className={["row t-small", r.ok ? "t-success" : "t-danger"].join(" ")} style={{ gap: 8 }}><Icon name={r.ok ? "check" : "cerrar"} size={18} />{r.texto}</span>
              ))}
            </div>
            <div className="row" style={{ justifyContent: "flex-end", gap: 12 }}>
              <Button variant="contorno">Cancelar</Button>
              <Button icon="check" disabled={!valida}>Guardar contraseña</Button>
            </div>
          </Card>
          <Card title="Historial de actividad">
            {/* TODO(HU-03): mostrar los eventos de registro_auditoria de este usuario. */}
            <p className="t-small t-muted" style={{ margin: 0 }}>Tu actividad aparecerá aquí cuando se habilite la consulta de la bitácora.</p>
          </Card>
        </div>
      </div>
    </>
  );
};

export default PerfilPage;
