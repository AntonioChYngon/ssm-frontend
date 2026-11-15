"use client";

import { useState, type FormEvent } from "react";
import { Button, IconButton } from "@/components/ui/Button";
import { Alert, Avatar, Badge, Card, DataTable, PageTitle } from "@/components/ui/Display";
import { SelectField, TextField } from "@/components/ui/Field";
import { ChipGroup } from "@/components/ui/Interactive";
import { esCorreoInstitucional } from "@/lib/api";
import { LICENCIATURAS, USUARIOS } from "@/lib/mock-data";
import { ROL_LABEL, type Usuario } from "@/lib/types";

const iniciales = (nombre: string) => nombre.split(" ").slice(0, 2).map((p) => p[0]).join("");

const UsuariosPage = () => {
  const [filtro, setFiltro] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [panel, setPanel] = useState(true);
  const [correo, setCorreo] = useState("");
  const [errorCorreo, setErrorCorreo] = useState<string>();
  const [guardado, setGuardado] = useState(false);

  const visibles = USUARIOS.filter((u) => {
    const coincideEstado = filtro.startsWith("Todos") || (filtro.startsWith("Activos") ? u.activo : !u.activo);
    const texto = `${u.nombre} ${u.correo}`.toLowerCase();
    return coincideEstado && texto.includes(busqueda.toLowerCase());
  });

  const guardar = (event: FormEvent) => {
    event.preventDefault();
    if (!esCorreoInstitucional(correo)) {
      setErrorCorreo("Usa un correo @acatlan.unam.mx o @pcpuma.acatlan.unam.mx. No se aceptan correos personales.");
      return;
    }
    setErrorCorreo(undefined);
    setGuardado(true);
  };

  return (
    <>
      <PageTitle
        crumbs={[{ label: "Inicio", href: "/admin/dashboard" }, { label: "Gestión de usuarios" }]}
        title="Gestión de usuarios"
        subtitle="Da de alta cuentas, asigna roles y licenciaturas, y restablece contraseñas."
        actions={<><Button variant="contorno" icon="descargar">Exportar lista</Button><Button icon="mas" onClick={() => setPanel(true)}>Nuevo usuario</Button></>}
      />
      <div className="row row--end row--responsive">
        <div className="grow"><TextField label="Buscar" icon="buscar" placeholder="Nombre o correo institucional" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} /></div>
        <div style={{ width: 220 }}><SelectField label="Rol" options={["Todos los roles", "Administrador", "Captura", "Auxiliar"]} /></div>
        <div style={{ width: 260 }}><SelectField label="Licenciatura" options={["Todas", ...LICENCIATURAS]} /></div>
      </div>
      <div className="row row--top row--responsive" style={{ gap: 24 }}>
        <div className="stack grow">
          <ChipGroup label="Filtrar por estado" options={["Todos (24)", "Activos (21)", "Inactivos (3)"]} onChange={setFiltro} />
          <DataTable<Usuario>
            caption="Usuarios del sistema"
            rows={visibles}
            rowKey={(u) => u.id}
            columns={[
              { header: "Usuario", render: (u) => (
                <div className="row" style={{ gap: 12 }}>
                  <Avatar iniciales={iniciales(u.nombre)} />
                  <div><div className="t-medium">{u.nombre}</div><div className="t-small t-muted">{u.correo}</div></div>
                </div>
              ) },
              { header: "Rol", width: 130, render: (u) => ROL_LABEL[u.rol] },
              { header: "Licenciatura", render: (u) => u.licenciatura ?? "Todas" },
              { header: "Estado", width: 120, render: (u) => <Badge estado={u.activo ? "Validado" : "Borrador"}>{u.activo ? "Activo" : "Inactivo"}</Badge> },
              { header: "Acciones", width: 130, render: (u) => (
                <div className="row" style={{ gap: 8 }}>
                  <IconButton icon="editar" label={`Editar a ${u.nombre}`} />
                  <IconButton icon="restablecer" label={`Restablecer contraseña de ${u.nombre}`} />
                </div>
              ) },
            ]}
          />
          <div className="row">
            <span className="t-small t-muted">Mostrando {visibles.length} de 24 usuarios</span>
            <span className="spacer" />
            <Button variant="contorno" icon="flecha-izquierda" disabled>Anterior</Button>
            <Button variant="contorno" icon="chevron-derecha">Siguiente</Button>
          </div>
        </div>
        {panel && (
          <Card title="Nuevo usuario" subtitle="Los campos con * son obligatorios." className="side-380" actions={<IconButton icon="cerrar" label="Cerrar panel" onClick={() => setPanel(false)} />}>
            <form className="stack" style={{ gap: 18 }} onSubmit={guardar} noValidate>
              <TextField label="Nombre completo *" placeholder="Ej. Rosa María Cruz López" required />
              <TextField label="Correo institucional *" icon="correo" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} error={errorCorreo} required />
              <SelectField label="Rol *" options={["Captura", "Auxiliar", "Administrador"]} />
              <SelectField label="Licenciatura asignada *" options={LICENCIATURAS} />
              {guardado ? <Alert tipo="exito">Usuario creado. Enviamos una contraseña temporal a su correo.</Alert> : <Alert tipo="info">Se enviará una contraseña temporal por correo. Deberá cambiarla en su primer acceso.</Alert>}
              <div className="row" style={{ gap: 12 }}>
                <Button variant="contorno" className="grow" onClick={() => setPanel(false)}>Cancelar</Button>
                <Button type="submit" icon="check" className="grow">Guardar</Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </>
  );
};

export default UsuariosPage;
