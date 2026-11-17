"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Button, IconButton } from "@/components/ui/Button";
import { Alert, Avatar, Badge, Card, DataTable, PageTitle } from "@/components/ui/Display";
import { SelectField, TextField } from "@/components/ui/Field";
import { ChipGroup } from "@/components/ui/Interactive";
import {
  ApiError,
  cambiarAsignacion,
  cambiarEstadoUsuario,
  crearUsuario,
  listarCoordinaciones,
  listarUsuarios,
  restablecerContrasenaDeUsuario,
} from "@/lib/api";
import { ROL_LABEL, type CoordinacionOpcion, type Rol, type Usuario } from "@/lib/types";

const iniciales = (nombre: string) => nombre.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
const etiquetaCoordinacion = (coordinacion: CoordinacionOpcion) => `${coordinacion.licenciatura} — ${coordinacion.nombre}`;
const mensajeError = (error: unknown) => error instanceof ApiError ? error.message : "No se pudo completar la operación. Intenta de nuevo.";

const UsuariosPage = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [coordinaciones, setCoordinaciones] = useState<CoordinacionOpcion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [filtroRol, setFiltroRol] = useState("Todos los roles");
  const [filtroLicenciatura, setFiltroLicenciatura] = useState("Todas");
  const [busqueda, setBusqueda] = useState("");
  const [panel, setPanel] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [correo, setCorreo] = useState("");
  const [rol, setRol] = useState<Exclude<Rol, "ADMINISTRADOR">>("CAPTURA");
  const [coordinacionLabel, setCoordinacionLabel] = useState("");
  const [error, setError] = useState<string>();
  const [mensaje, setMensaje] = useState<string>();

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [lista, opciones] = await Promise.all([listarUsuarios(), listarCoordinaciones()]);
      setUsuarios(lista);
      setCoordinaciones(opciones);
      setError(undefined);
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { void cargar(); }, [cargar]);

  const licenciaturas = useMemo(() => [...new Set(coordinaciones.map((c) => c.licenciatura))].sort(), [coordinaciones]);
  const coordinacionSeleccionada = coordinaciones.find((c) => etiquetaCoordinacion(c) === coordinacionLabel);
  const visibles = usuarios.filter((u) => {
    const estado = filtroEstado === "Todos" || (filtroEstado === "Activos" ? u.activo : !u.activo);
    const rolCoincide = filtroRol === "Todos los roles" || ROL_LABEL[u.rol] === filtroRol;
    const licenciatura = filtroLicenciatura === "Todas" || u.licenciatura === filtroLicenciatura;
    return estado && rolCoincide && licenciatura && `${u.nombre} ${u.correo}`.toLowerCase().includes(busqueda.trim().toLowerCase());
  });

  const limpiarFormulario = () => {
    setEditando(null);
    setNombre("");
    setApellido("");
    setCorreo("");
    setRol("CAPTURA");
    setCoordinacionLabel("");
    setError(undefined);
  };

  const nuevoUsuario = () => {
    limpiarFormulario();
    setMensaje(undefined);
    setPanel(true);
  };

  const editarAsignacion = (usuario: Usuario) => {
    limpiarFormulario();
    setEditando(usuario);
    setRol(usuario.rol === "ADMINISTRADOR" ? "CAPTURA" : usuario.rol);
    const opcion = coordinaciones.find((c) => c.licenciatura === usuario.licenciatura && c.nombre === usuario.coordinacion);
    setCoordinacionLabel(opcion ? etiquetaCoordinacion(opcion) : "");
    setMensaje(undefined);
    setPanel(true);
  };

  const guardar = async (event: FormEvent) => {
    event.preventDefault();
    if (!coordinacionSeleccionada) {
      setError("Selecciona una coordinación.");
      return;
    }
    setGuardando(true);
    setError(undefined);
    try {
      if (editando) {
        await cambiarAsignacion(editando.id, { rol, coordinacionId: coordinacionSeleccionada.id });
        setMensaje(`Se actualizó la asignación de ${editando.nombre}.`);
      } else {
        if (!nombre.trim() || !apellido.trim()) {
          setError("Escribe nombre y apellido.");
          return;
        }
        await crearUsuario({ nombre: nombre.trim(), apellido: apellido.trim(), correo: correo.trim(), rol, coordinacionId: coordinacionSeleccionada.id });
        setMensaje("Cuenta creada. Se envió una contraseña temporal al correo institucional.");
      }
      setPanel(false);
      limpiarFormulario();
      await cargar();
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setGuardando(false);
    }
  };

  const restablecer = async (usuario: Usuario) => {
    setError(undefined);
    setMensaje(undefined);
    try {
      await restablecerContrasenaDeUsuario(usuario.id);
      setMensaje(`Se envió una contraseña temporal a ${usuario.correo}.`);
    } catch (e) {
      setError(mensajeError(e));
    }
  };

  const cambiarEstado = async (usuario: Usuario) => {
    setError(undefined);
    setMensaje(undefined);
    try {
      await cambiarEstadoUsuario(usuario.id, !usuario.activo);
      setMensaje(`La cuenta de ${usuario.nombre} ahora está ${usuario.activo ? "inactiva" : "activa"}.`);
      await cargar();
    } catch (e) {
      setError(mensajeError(e));
    }
  };

  return (
    <>
      <PageTitle
        crumbs={[{ label: "Inicio", href: "/admin/dashboard" }, { label: "Gestión de usuarios" }]}
        title="Gestión de usuarios"
        subtitle="Administra las cuentas, las asignaciones de coordinación y las contraseñas."
        actions={<Button icon="mas" onClick={nuevoUsuario}>Nuevo usuario</Button>}
      />
      {error && <Alert tipo="error">{error}</Alert>}
      {mensaje && <Alert tipo="exito">{mensaje}</Alert>}
      <div className="row row--end row--responsive">
        <div className="grow"><TextField label="Buscar" icon="buscar" placeholder="Nombre o correo institucional" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} /></div>
        <div style={{ width: 220 }}><SelectField label="Rol" options={["Todos los roles", "Administrador", "Captura", "Auxiliar"]} value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)} /></div>
        <div style={{ width: 260 }}><SelectField label="Licenciatura" options={["Todas", ...licenciaturas]} value={filtroLicenciatura} onChange={(e) => setFiltroLicenciatura(e.target.value)} /></div>
      </div>
      <div className="row row--top row--responsive" style={{ gap: 24 }}>
        <div className="stack grow">
          <ChipGroup label="Filtrar por estado" options={["Todos", "Activos", "Inactivos"]} onChange={setFiltroEstado} />
          {cargando ? <p className="t-muted">Cargando usuarios…</p> : (
            <DataTable<Usuario>
              caption="Usuarios del sistema"
              rows={visibles}
              rowKey={(u) => u.id}
              columns={[
                { header: "Usuario", render: (u) => <div className="row" style={{ gap: 12 }}><Avatar iniciales={iniciales(u.nombre)} /><div><div className="t-medium">{u.nombre}</div><div className="t-small t-muted">{u.correo}</div></div></div> },
                { header: "Rol", width: 130, render: (u) => ROL_LABEL[u.rol] },
                { header: "Licenciatura", render: (u) => u.licenciatura ?? "Todas" },
                { header: "Estado", width: 120, render: (u) => <Badge estado={u.activo ? "Validado" : "Borrador"}>{u.activo ? "Activo" : "Inactivo"}</Badge> },
                { header: "Acciones", render: (u) => <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                  {u.rol !== "ADMINISTRADOR" && <IconButton icon="editar" label={`Cambiar asignación de ${u.nombre}`} onClick={() => editarAsignacion(u)} />}
                  <IconButton icon="restablecer" label={`Restablecer contraseña de ${u.nombre}`} onClick={() => void restablecer(u)} />
                  <Button variant="texto" onClick={() => void cambiarEstado(u)}>{u.activo ? "Desactivar" : "Activar"}</Button>
                </div> },
              ]}
            />
          )}
          <span className="t-small t-muted">Mostrando {visibles.length} de {usuarios.length} usuarios</span>
        </div>
        {panel && (
          <Card title={editando ? "Cambiar asignación" : "Nuevo usuario"} subtitle="Los campos con * son obligatorios." className="side-380" actions={<IconButton icon="cerrar" label="Cerrar panel" onClick={() => { setPanel(false); limpiarFormulario(); }} />}>
            <form className="stack" style={{ gap: 18 }} onSubmit={guardar} noValidate>
              {!editando && <>
                <TextField label="Nombre *" value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="given-name" required />
                <TextField label="Apellido *" value={apellido} onChange={(e) => setApellido(e.target.value)} autoComplete="family-name" required />
                <TextField label="Correo institucional *" icon="correo" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} autoComplete="email" required />
              </>}
              {editando && <p className="t-small t-muted">{editando.nombre} · {editando.correo}</p>}
              <SelectField label="Rol *" options={["CAPTURA", "AUXILIAR"]} value={rol} onChange={(e) => setRol(e.target.value as Exclude<Rol, "ADMINISTRADOR">)} />
              <SelectField
                label="Coordinación *"
                options={coordinaciones.map(etiquetaCoordinacion)}
                value={coordinacionLabel}
                onChange={(e) => setCoordinacionLabel(e.target.value)}
                disabled={!coordinaciones.length}
                error={error && !coordinacionSeleccionada ? error : undefined}
              />
              {!editando && <Alert tipo="info">Se enviará una contraseña temporal al correo. Podrá cambiarla desde su perfil.</Alert>}
              <div className="row" style={{ gap: 12 }}>
                <Button variant="contorno" className="grow" onClick={() => { setPanel(false); limpiarFormulario(); }}>Cancelar</Button>
                <Button type="submit" icon="check" className="grow" disabled={guardando || cargando || !coordinaciones.length}>{guardando ? "Guardando…" : editando ? "Guardar cambios" : "Crear cuenta"}</Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </>
  );
};

export default UsuariosPage;
