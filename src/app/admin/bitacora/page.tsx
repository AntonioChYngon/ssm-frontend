"use client";

// HU-03 · Bitácora de auditoría (solo Administrador): registro inmutable de cada cambio con usuario, rol,
// campo, valor anterior y nuevo. Filtros por búsqueda, rol, tipo de acción y fechas; carga por páginas.
import { useCallback, useEffect, useState } from "react";
import { Cambio, rolLegible } from "@/components/auditoria/HistorialCambios";
import { SelectorLicenciaturas, useLicenciaturasEnUrl } from "@/components/filtros/SelectorLicenciaturas";
import { Button } from "@/components/ui/Button";
import { Alert, Avatar, Card, EmptyState, PageTitle, Tag } from "@/components/ui/Display";
import { SelectField, TextField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { ApiError, listarBitacora } from "@/lib/api";
import type { AreaBitacora, EventoAuditoria, FiltrosBitacora, Rol } from "@/lib/types";

const LIMITE = 50;
const ROLES: Array<{ label: string; valor?: Rol }> = [
  { label: "Todos" },
  { label: "Administrador", valor: "ADMINISTRADOR" },
  { label: "Captura", valor: "CAPTURA" },
  { label: "Auxiliar", valor: "AUXILIAR" },
];
const AREAS: Array<{ label: string; valor?: AreaBitacora }> = [
  { label: "Todas" },
  { label: "Plan de mejora", valor: "PLAN" },
  { label: "Informe de seguimiento", valor: "INFORME" },
  { label: "Cuentas", valor: "CUENTAS" },
  { label: "Sesiones y contraseñas", valor: "SESIONES" },
  { label: "Ciclos de acreditación", valor: "CICLOS" },
];

const iniciales = (nombre: string) => nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("");
const diaDe = (iso: string) =>
  new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "America/Mexico_City" }).format(new Date(iso));
const horaDe = (iso: string) => new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit", timeZone: "America/Mexico_City" }).format(new Date(iso));

const BitacoraPage = () => {
  const [busqueda, setBusqueda] = useState("");
  const [rol, setRol] = useState(ROLES[0]!.label);
  const [area, setArea] = useState(AREAS[0]!.label);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [eventos, setEventos] = useState<EventoAuditoria[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // HU-13: licenciatura de lo que se modificó (una, varias o todas).
  const licenciaturas = useLicenciaturasEnUrl();

  const filtros = useCallback(
    (p: number): FiltrosBitacora => ({
      q: busqueda.trim() || undefined,
      rol: ROLES.find((r) => r.label === rol)?.valor,
      area: AREAS.find((a) => a.label === area)?.valor,
      desde: desde || undefined,
      hasta: hasta || undefined,
      licenciaturaIds: licenciaturas.parametro,
      pagina: p,
      limite: LIMITE,
    }),
    [busqueda, rol, area, desde, hasta, licenciaturas.parametro],
  );

  const cargar = useCallback(async (p: number) => {
    setCargando(true);
    setError(null);
    try {
      const respuesta = await listarBitacora(filtros(p));
      setEventos((previos) => (p === 1 ? respuesta.eventos : [...previos, ...respuesta.eventos]));
      setTotal(respuesta.total);
      setPagina(p);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No pudimos cargar la bitácora.");
    } finally {
      setCargando(false);
    }
  }, [filtros]);

  // Al cambiar un filtro se vuelve a la primera página (la búsqueda espera a que se deje de escribir).
  useEffect(() => {
    if (!licenciaturas.listo) return;
    const espera = window.setTimeout(() => void cargar(1), 300);
    return () => window.clearTimeout(espera);
  }, [cargar, licenciaturas.listo]);

  const dias = [...new Set(eventos.map((e) => diaDe(e.fecha)))];

  return (
    <>
      <PageTitle
        crumbs={[{ label: "Inicio", href: "/admin/dashboard" }, { label: "Bitácora de auditoría" }]}
        title="Bitácora de auditoría"
        subtitle="Registro inmutable de los cambios en el sistema: quién, con qué rol, qué campo y de qué valor a cuál."
      />
      <div className="row row--end row--responsive">
        <SelectorLicenciaturas seleccion={licenciaturas.ids} alCambiar={licenciaturas.cambiar} />
        <div className="grow"><TextField label="Buscar" icon="buscar" placeholder="Usuario, correo, campo o valor" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} /></div>
        <div style={{ width: 170 }}><SelectField label="Rol" options={ROLES.map((r) => r.label)} value={rol} onChange={(e) => setRol(e.target.value)} /></div>
        <div style={{ width: 230 }}><SelectField label="Tipo de acción" options={AREAS.map((a) => a.label)} value={area} onChange={(e) => setArea(e.target.value)} /></div>
        <div style={{ width: 170 }}><TextField label="Desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} /></div>
        <div style={{ width: 170 }}><TextField label="Hasta" type="date" value={hasta} min={desde || undefined} onChange={(e) => setHasta(e.target.value)} /></div>
      </div>
      {error && <Alert tipo="error">{error}</Alert>}
      {!cargando && !error && eventos.length === 0 ? (
        <EmptyState titulo="Sin registros" mensaje="No hay cambios que coincidan con los filtros." icon="reloj" />
      ) : (
        <Card style={{ gap: 0 }}>
          {dias.map((dia) => (
            <section key={dia}>
              <h2 className="row t-body t-medium t-primary" style={{ gap: 8, margin: 0, padding: "16px 0 8px" }}><Icon name="calendario" size={18} />{dia}</h2>
              <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {eventos.filter((e) => diaDe(e.fecha) === dia).map((e) => (
                  <li key={e.id} className="row row--top" style={{ gap: 16, padding: "12px 0" }}>
                    <time className="t-medium t-muted" style={{ width: 56 }} dateTime={e.fecha}>{horaDe(e.fecha)}</time>
                    <Avatar iniciales={iniciales(e.usuario.nombre)} />
                    <div className="stack grow" style={{ gap: 4 }}>
                      <div className="row row--wrap" style={{ gap: 8 }}>
                        <span className="t-medium">{e.usuario.nombre}</span>
                        <Tag neutral>{rolLegible(e.rol)}</Tag>
                        <span className="t-small t-muted">{e.usuario.correo}</span>
                      </div>
                      <span>{e.accion}</span>
                      {e.contexto && <span className="row t-small t-medium" style={{ gap: 6 }}><Icon name="documento" size={16} />{e.contexto}</span>}
                      <Cambio evento={e} />
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ))}
          {cargando && <p className="t-muted">Cargando…</p>}
        </Card>
      )}
      <div className="row">
        <span className="t-small t-muted">Mostrando {eventos.length} de {total} registros</span>
        <span className="spacer" />
        {eventos.length < total && (
          <Button variant="contorno" icon="chevron-abajo" disabled={cargando} onClick={() => void cargar(pagina + 1)}>Cargar más registros</Button>
        )}
      </div>
    </>
  );
};

export default BitacoraPage;
