"use client";

// Gestión de usuarios: lista los usuarios registrados en la base (GET /usuarios).
// El alta, la edición y el restablecimiento corresponden a HU-02.
import { useEffect, useState, type FormEvent } from "react";
import { Button, IconButton } from "@/components/ui/Button";
import { Alert, Avatar, Badge, Card, DataTable, EmptyState, PageTitle } from "@/components/ui/Display";
import { SelectField, TextField } from "@/components/ui/Field";
import { ChipGroup } from "@/components/ui/Interactive";
import { ApiError, esCorreoInstitucional, listarUsuarios, obtenerCatalogos } from "@/lib/api";
import { ROL_LABEL, type Usuario } from "@/lib/types";

const iniciales = (nombre: string) => nombre.split(" ").slice(0, 2).map((p) => p[0]).join("");

const TODAS = "Todas";
const TODOS_ROLES = "Todos los roles";
const ROLES = { Administrador: "ADMINISTRADOR", Captura: "CAPTURA", Auxiliar: "AUXILIAR" } as const;

const UsuariosPage = () => {
  const [usuarios, setUsuarios] = useState<Usuario[] | null>(null);
  const [licenciaturas, setLicenciaturas] = useState<string[]>([]);
  const [error, setError] = useState<string>();
  const [filtro, setFiltro] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [rol, setRol] = useState<string>(TODOS_ROLES);
  const [licenciatura, setLicenciatura] = useState(TODAS);
  const [panel, setPanel] = useState(false);
  const [correo, setCorreo] = useState("");
  const [errorCorreo, setErrorCorreo] = useState<string>();
  const [aviso, setAviso] = useState<string>();

  useEffect(() => {
    listarUsuarios().then(setUsuarios).catch((e) => setError(e instanceof ApiError ? e.message : "No pudimos cargar los usuarios."));
    obtenerCatalogos().then((c) => setLicenciaturas(c.licenciaturas.map((l) => l.nombre))).catch(() => setLicenciaturas([]));
  }, []);

  const lista = usuarios ?? [];
  const visibles = lista.filter((u) => {
    const coincideEstado = filtro === "Todos" || (filtro === "Activos" ? u.activo : !u.activo);
    const coincideRol = rol === TODOS_ROLES || u.rol === ROLES[rol as keyof typeof ROLES];
    const coincideLicenciatura = licenciatura === TODAS || u.licenciatura === licenciatura;
    const texto = `${u.nombre} ${u.correo}`.toLowerCase();
    return coincideEstado && coincideRol && coincideLicenciatura && texto.includes(busqueda.toLowerCase());
  });

  const guardar = (event: FormEvent) => {
    event.preventDefault();
    if (!esCorreoInstitucional(correo)) {
      setErrorCorreo("Usa un correo @acatlan.unam.mx o @pcpuma.acatlan.unam.mx. No se aceptan correos personales.");
      return;
    }
    setErrorCorreo(undefined);
    // TODO(HU-02): llamar a crearUsuario() cuando el backend tenga el alta (POST /usuarios).
    setAviso("El alta de usuarios se habilita con la HU-02. Por ahora la cuenta no se guardó.");
  };

  return (
    <>
      <PageTitle
        crumbs={[{ label: "Inicio", href: "/admin/dashboard" }, { label: "Gestión de usuarios" }]}
        title="Gestión de usuarios"
        subtitle="Da de alta cuentas, asigna roles y licenciaturas, y restablece contraseñas."
        actions={<Button icon="mas" onClick={() => setPanel(true)}>Nuevo usuario</Button>}
      />
      {error && <Alert tipo="error">{error}</Alert>}
      <div className="row row--end row--responsive">
        <div className="grow"><TextField label="Buscar" icon="buscar" placeholder="Nombre o correo institucional" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} /></div>
        <div style={{ width: 220 }}><SelectField label="Rol" options={[TODOS_ROLES, ...Object.keys(ROLES)]} value={rol} onChange={(e) => setRol(e.target.value)} /></div>
        <div style={{ width: 260 }}><SelectField label="Licenciatura" options={[TODAS, ...licenciaturas]} value={licenciatura} onChange={(e) => setLicenciatura(e.target.value)} /></div>
      </div>
      <div className="row row--top row--responsive" style={{ gap: 24 }}>
        <div className="stack grow">
          <ChipGroup label="Filtrar por estado" options={["Todos", "Activos", "Inactivos"]} onChange={setFiltro} />
          {usuarios === null && !error ? (
            <p className="t-muted" role="status">Cargando usuarios…</p>
          ) : visibles.length === 0 ? (
            <Card><EmptyState icon="usuarios" titulo="Sin usuarios que mostrar" mensaje="No hay usuarios que coincidan con los filtros." /></Card>
          ) : (
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
                { header: "Rol", width: 130, render: (u) => (u.rol ? ROL_LABEL[u.rol] : "Sin asignación") },
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
          )}
          <span className="t-small t-muted">Mostrando {visibles.length} de {lista.length} usuarios</span>
        </div>
        {panel && (
          <Card title="Nuevo usuario" subtitle="Los campos con * son obligatorios." className="side-380" actions={<IconButton icon="cerrar" label="Cerrar panel" onClick={() => setPanel(false)} />}>
            <form className="stack" style={{ gap: 18 }} onSubmit={guardar} noValidate>
              <TextField label="Nombre completo *" required />
              <TextField label="Correo institucional *" icon="correo" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} error={errorCorreo} required />
              <SelectField label="Rol *" options={["Captura", "Auxiliar"]} />
              <SelectField label="Licenciatura asignada *" options={licenciaturas} />
              {aviso ? <Alert tipo="advertencia">{aviso}</Alert> : <Alert tipo="info">Se enviará una contraseña temporal por correo. Deberá cambiarla en su primer acceso.</Alert>}
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
