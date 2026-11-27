"use client";

// HU-17 · Recomendaciones transversales (Administrador). Se seleccionan una o varias recomendaciones de distintas
// licenciaturas y se marcan como "Transversal" dentro de un grupo (la recomendación similar que comparten). La vista
// agrupada muestra las licenciaturas de cada grupo con su avance consolidado, y el reporte sale en PDF y Word.
// Funciona sobre el ciclo vigente y sobre los históricos.
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Alert, Card, DataTable, EmptyState, PageTitle, Progress, Tag } from "@/components/ui/Display";
import { Checkbox, SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { ChipGroup, ConfirmModal } from "@/components/ui/Interactive";
import { Icon } from "@/components/ui/Icon";
import { SelectorLicenciaturas, useLicenciaturasEnUrl } from "@/components/filtros/SelectorLicenciaturas";
import { DescargasReporte } from "@/components/reportes/DescargasReporte";
import {
  consultarRecomendacionesTransversales,
  crearGrupoTransversal,
  desmarcarTransversales,
  descargarReporteTransversales,
  editarGrupoTransversal,
  eliminarGrupoTransversal,
  listarGruposTransversales,
  marcarTransversales,
  nombreReporteTransversales,
} from "@/lib/api";
import type { AlcanceCiclos, GrupoTransversal, RecomendacionTransversal } from "@/lib/types";

const ALCANCES: Record<string, AlcanceCiclos> = { "Ciclo vigente": "vigentes", "Ciclos históricos": "historicos", Todos: "todos" };
const ELIGE = "Elige un grupo";

type Aviso = { tipo: "exito" | "error"; texto: string };
type FormGrupo = { id: string | null; nombre: string; descripcion: string };

const mensaje = (error: unknown, porDefecto: string) => (error instanceof Error ? error.message : porDefecto);

const textoAvance = (avance: number | null) => (avance === null ? <span className="t-small t-muted">Sin capturar</span> : <Progress value={avance} width={90} />);

const TransversalesPage = () => {
  const { ids: licenciaturas, cambiar: cambiarLicenciaturas, parametro: licenciaturaIds, listo } = useLicenciaturasEnUrl();
  const [alcance, setAlcance] = useState<AlcanceCiclos>("vigentes");
  const [soloTransversales, setSoloTransversales] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [texto, setTexto] = useState("");
  const [grupoActivo, setGrupoActivo] = useState<string | null>(null);

  const [grupos, setGrupos] = useState<GrupoTransversal[]>([]);
  const [recomendaciones, setRecomendaciones] = useState<RecomendacionTransversal[] | null>(null);
  const [errorCarga, setErrorCarga] = useState<string>();
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [destino, setDestino] = useState(ELIGE);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [form, setForm] = useState<FormGrupo | null>(null);
  const [aEliminar, setAEliminar] = useState<GrupoTransversal | null>(null);

  // La búsqueda se aplica al dejar de escribir.
  useEffect(() => {
    const t = setTimeout(() => setTexto(busqueda), 350);
    return () => clearTimeout(t);
  }, [busqueda]);

  const cargar = useCallback(async () => {
    if (!listo) return;
    setErrorCarga(undefined);
    try {
      const filtros = { licenciaturaIds, ciclos: alcance };
      const [g, r] = await Promise.all([
        listarGruposTransversales(filtros),
        consultarRecomendacionesTransversales({ ...filtros, soloTransversales, grupoId: grupoActivo ?? undefined, q: texto }),
      ]);
      setGrupos(g);
      setRecomendaciones(r);
      setSeleccion((previa) => new Set([...previa].filter((id) => r.some((x) => x.id === id))));
    } catch (error) {
      setErrorCarga(mensaje(error, "No pudimos cargar las recomendaciones."));
      setRecomendaciones([]);
    }
  }, [listo, licenciaturaIds, alcance, soloTransversales, grupoActivo, texto]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const grupo = useMemo(() => grupos.find((g) => g.id === grupoActivo) ?? null, [grupos, grupoActivo]);
  const idPorNombre = useMemo(() => new Map(grupos.map((g) => [g.nombre, g.id])), [grupos]);

  const alternar = (id: string) =>
    setSeleccion((previa) => {
      const nueva = new Set(previa);
      if (nueva.has(id)) nueva.delete(id);
      else nueva.add(id);
      return nueva;
    });

  const ejecutar = async (accion: () => Promise<void>, exito: string, porDefecto: string) => {
    setOcupado(true);
    setAviso(null);
    try {
      await accion();
      setAviso({ tipo: "exito", texto: exito });
      await cargar();
      return true;
    } catch (error) {
      setAviso({ tipo: "error", texto: mensaje(error, porDefecto) });
      return false;
    } finally {
      setOcupado(false);
    }
  };

  const marcar = async () => {
    const grupoId = idPorNombre.get(destino);
    if (!grupoId) {
      setAviso({ tipo: "error", texto: "Elige el grupo transversal donde quedarán las recomendaciones." });
      return;
    }
    const n = seleccion.size;
    if (await ejecutar(() => marcarTransversales(grupoId, [...seleccion]), `${n} ${n === 1 ? "recomendación marcada" : "recomendaciones marcadas"} como transversal en "${destino}".`, "No pudimos marcar las recomendaciones.")) {
      setSeleccion(new Set());
    }
  };

  const desmarcar = async () => {
    const n = seleccion.size;
    if (await ejecutar(() => desmarcarTransversales([...seleccion]), `${n} ${n === 1 ? "recomendación ya no es transversal" : "recomendaciones ya no son transversales"}.`, "No pudimos quitar la marca.")) {
      setSeleccion(new Set());
    }
  };

  const guardarGrupo = async (event: FormEvent) => {
    event.preventDefault();
    if (!form) return;
    const datos = { nombre: form.nombre.trim(), descripcion: form.descripcion.trim() || undefined };
    if (datos.nombre.length < 3) {
      setAviso({ tipo: "error", texto: "El nombre del grupo debe tener al menos 3 caracteres." });
      return;
    }
    const ok = await ejecutar(
      async () => {
        if (form.id) await editarGrupoTransversal(form.id, datos);
        else setDestino((await crearGrupoTransversal(datos)).nombre);
      },
      form.id ? "Grupo actualizado." : `Grupo "${datos.nombre}" creado. Selecciona recomendaciones y márcalas como transversales.`,
      "No pudimos guardar el grupo.",
    );
    if (ok) setForm(null);
  };

  const eliminar = async () => {
    if (!aEliminar) return;
    const nombre = aEliminar.nombre;
    setAEliminar(null);
    if (await ejecutar(() => eliminarGrupoTransversal(aEliminar.id), `Grupo "${nombre}" eliminado; sus recomendaciones ya no son transversales.`, "No pudimos eliminar el grupo.")) {
      if (grupoActivo === aEliminar.id) setGrupoActivo(null);
    }
  };

  return (
    <>
      <PageTitle
        crumbs={[{ label: "Inicio", href: "/admin/dashboard" }, { label: "Reportes" }, { label: "Recomendaciones transversales" }]}
        title="Recomendaciones transversales"
        subtitle="Marca las recomendaciones que se repiten en varias licenciaturas y agrúpalas para atenderlas de forma conjunta."
        actions={
          <DescargasReporte
            documento="Reporte de recomendaciones transversales"
            descargar={(formato) => descargarReporteTransversales({ licenciaturaIds, ciclos: alcance }, formato)}
            nombreArchivo={(formato) => nombreReporteTransversales(alcance, formato)}
            onAviso={setAviso}
            disabled={!grupos.some((g) => g.recomendaciones.length)}
          />
        }
      />

      <div className="stack" style={{ gap: 24 }}>
        <Card title="Consulta" style={{ gap: 16 }}>
          <div className="row row--wrap" style={{ gap: 16, alignItems: "flex-end" }}>
            <SelectorLicenciaturas seleccion={licenciaturas} alCambiar={cambiarLicenciaturas} />
            <ChipGroup label="Ciclos de acreditación" options={Object.keys(ALCANCES)} value="Ciclo vigente" onChange={(o) => setAlcance(ALCANCES[o] ?? "vigentes")} />
          </div>
          <div className="row row--wrap" style={{ gap: 16, alignItems: "flex-end" }}>
            <div className="grow" style={{ minWidth: 260 }}>
              <TextField label="Buscar" icon="buscar" placeholder="Recomendación, indicador o grupo" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            </div>
            <Checkbox label="Mostrar sólo recomendaciones transversales" checked={soloTransversales} onChange={(e) => setSoloTransversales(e.target.checked)} />
          </div>
        </Card>

        {aviso && <Alert tipo={aviso.tipo}>{aviso.texto}</Alert>}
        {errorCarga && <Alert tipo="error">{errorCarga}</Alert>}

        <div className="row row--top row--responsive" style={{ gap: 24 }}>
          <Card
            title="Grupos transversales"
            subtitle="Cada grupo es una recomendación similar entre carreras."
            className="side-340"
            actions={<Button variant="contorno" icon="mas" onClick={() => setForm({ id: null, nombre: "", descripcion: "" })}>Nuevo</Button>}
            style={{ gap: 4 }}
          >
            {form && (
              <form onSubmit={(e) => void guardarGrupo(e)} className="stack" style={{ gap: 12, padding: "8px 0 16px" }}>
                <TextField label="Nombre del grupo" value={form.nombre} maxLength={180} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
                <TextAreaField label="Descripción (opcional)" value={form.descripcion} maxLength={1000} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
                <div className="row" style={{ gap: 8, justifyContent: "flex-end" }}>
                  <Button variant="contorno" onClick={() => setForm(null)}>Cancelar</Button>
                  <Button type="submit" icon="check" disabled={ocupado}>{form.id ? "Guardar" : "Crear grupo"}</Button>
                </div>
              </form>
            )}
            <button type="button" className="row transversal-grupo" aria-pressed={grupoActivo === null} onClick={() => setGrupoActivo(null)}>
              <Icon name="lista" size={18} />
              <span className="grow">Todas las recomendaciones</span>
            </button>
            {grupos.map((g) => (
              <button key={g.id} type="button" className="row transversal-grupo" aria-pressed={grupoActivo === g.id} onClick={() => setGrupoActivo(g.id)}>
                <Icon name="capas" size={18} />
                <span className="grow stack" style={{ gap: 2 }}>
                  <span className="t-medium">{g.nombre}</span>
                  <span className="t-small t-muted">
                    {g.licenciaturas.length} {g.licenciaturas.length === 1 ? "licenciatura" : "licenciaturas"}
                    {g.avanceConsolidado !== null && ` · avance ${g.avanceConsolidado} %`}
                  </span>
                </span>
              </button>
            ))}
            {grupos.length === 0 && <p className="t-small t-muted">Aún no hay grupos. Crea uno para empezar a agrupar.</p>}
          </Card>

          <div className="stack grow" style={{ gap: 24, minWidth: 0 }}>
            {grupo && (
              <Card
                title={grupo.nombre}
                subtitle={grupo.descripcion ?? "Licenciaturas que comparten esta recomendación transversal."}
                actions={
                  <>
                    <Button variant="texto" icon="editar" onClick={() => setForm({ id: grupo.id, nombre: grupo.nombre, descripcion: grupo.descripcion ?? "" })}>Editar</Button>
                    <Button variant="texto" icon="eliminar" onClick={() => setAEliminar(grupo)}>Eliminar</Button>
                  </>
                }
              >
                <div className="row row--wrap" style={{ gap: 24 }}>
                  <div className="stack" style={{ gap: 4 }}>
                    <span className="t-small t-muted">Avance consolidado</span>
                    {grupo.avanceConsolidado === null ? <span className="t-muted">Sin recomendaciones en estos ciclos</span> : <Progress value={grupo.avanceConsolidado} width={200} />}
                  </div>
                  <div className="stack" style={{ gap: 4 }}>
                    <span className="t-small t-muted">Licenciaturas afectadas ({grupo.licenciaturas.length})</span>
                    <div className="row row--wrap" style={{ gap: 6 }}>{grupo.licenciaturas.map((l) => <Tag key={l} neutral>{l}</Tag>)}</div>
                  </div>
                </div>
                {grupo.recomendaciones.length > 0 && (
                  <DataTable<RecomendacionTransversal>
                    caption={`Recomendaciones del grupo ${grupo.nombre}`}
                    rowKey={(r) => r.id}
                    rows={grupo.recomendaciones}
                    columns={[
                      { header: "Licenciatura", render: (r) => r.licenciatura.nombre },
                      { header: "Ciclo", render: (r) => `${r.ciclo.nombre}${r.ciclo.vigente ? "" : " (histórico)"}` },
                      { header: "Recomendación", render: (r) => r.recomendacion },
                      { header: "Avance", render: (r) => textoAvance(r.avance) },
                    ]}
                  />
                )}
                <p className="t-small t-muted" style={{ margin: 0 }}>El avance es el del último informe capturado; una recomendación sin captura cuenta como 0 %.</p>
              </Card>
            )}

            <Card title={grupo ? `Recomendaciones en "${grupo.nombre}"` : "Recomendaciones"} subtitle="Selecciona una o varias para marcarlas como transversales." style={{ gap: 0 }}>
              {seleccion.size > 0 && (
                <div className="row row--wrap transversal-seleccion">
                  <Icon name="check" size={20} />
                  <span className="t-medium">{seleccion.size} {seleccion.size === 1 ? "seleccionada" : "seleccionadas"}</span>
                  <span className="grow" />
                  <div style={{ minWidth: 220 }}>
                    <SelectField label="Grupo transversal" options={[ELIGE, ...grupos.map((g) => g.nombre)]} value={destino} onChange={(e) => setDestino(e.target.value)} />
                  </div>
                  <Button icon="capas" disabled={ocupado || destino === ELIGE} onClick={() => void marcar()}>Marcar como transversal</Button>
                  <Button variant="contorno" icon="cerrar" disabled={ocupado} onClick={() => void desmarcar()}>Quitar de transversales</Button>
                </div>
              )}
              {recomendaciones === null && <p className="t-muted" aria-busy="true">Cargando recomendaciones…</p>}
              {recomendaciones?.length === 0 && !errorCarga && (
                <EmptyState titulo="Sin recomendaciones" mensaje="No hay recomendaciones con estos filtros. Prueba con otros ciclos o licenciaturas." />
              )}
              {recomendaciones?.map((r) => (
                <label key={r.id} className="list-row" style={{ cursor: "pointer" }}>
                  <input type="checkbox" checked={seleccion.has(r.id)} onChange={() => alternar(r.id)} aria-label={`Seleccionar: ${r.recomendacion}`} style={{ width: 22, height: 22, accentColor: "var(--color-primary)" }} />
                  <div className="stack grow" style={{ gap: 6 }}>
                    <span>{r.recomendacion}</span>
                    <span className="t-small t-muted">{r.categoria} · {r.indicador}</span>
                    <div className="row row--wrap" style={{ gap: 8 }}>
                      <Tag neutral>{r.licenciatura.nombre}</Tag>
                      <Tag neutral>{`Ciclo ${r.ciclo.nombre}${r.ciclo.vigente ? "" : " · histórico"}`}</Tag>
                      {r.grupo && <Tag>{`Transversal · ${r.grupo.nombre}`}</Tag>}
                    </div>
                  </div>
                  {textoAvance(r.avance)}
                </label>
              ))}
            </Card>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={aEliminar !== null}
        tipo="validar"
        titulo="¿Eliminar el grupo?"
        mensaje={`Las recomendaciones de "${aEliminar?.nombre ?? ""}" dejarán de ser transversales. Las recomendaciones no se borran.`}
        confirmLabel="Eliminar grupo"
        onCancel={() => setAEliminar(null)}
        onConfirm={() => void eliminar()}
      />
    </>
  );
};

export default TransversalesPage;
