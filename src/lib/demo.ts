// Modo demostración (NEXT_PUBLIC_USE_MOCKS=true): arranca en ceros, igual que el backend sin datos de desarrollo.
// Solo trae los catálogos y las dos cuentas iniciales del seed. Lo que se captura se guarda en este navegador
// (localStorage) para poder seguir el flujo completo: la Administradora registra el ciclo y Captura llena el plan.
import { AREAS, CATEGORIAS, LICENCIATURAS, ORGANISMOS } from "./catalogos";
import type { Catalogos, CicloResumen, ItemCatalogo, PlanDeMejora, Usuario } from "./types";

const conIds = (nombres: readonly string[]): ItemCatalogo[] => nombres.map((nombre, i) => ({ id: String(i + 1), nombre }));
const porNombre = (a: ItemCatalogo, b: ItemCatalogo) => a.nombre.localeCompare(b.nombre, "es");

export const CATALOGOS_DEMO: Catalogos = {
  categorias: conIds(CATEGORIAS),
  areas: conIds(AREAS).sort(porNombre),
  organismos: conIds(ORGANISMOS).sort(porNombre),
  licenciaturas: conIds(LICENCIATURAS),
};

/** Las mismas cuentas que crea `npm run seed` con los valores de .env.example. */
export const ADMIN_DEMO: Usuario = { id: "1", nombre: "Administración SSM", correo: "admin.ssm@acatlan.unam.mx", rol: "ADMINISTRADOR", licenciatura: null, coordinacion: null, activo: true };
export const CAPTURA_DEMO: Usuario = { id: "2", nombre: "Captura Actuaría", correo: "captura.actuaria@acatlan.unam.mx", rol: "CAPTURA", licenciatura: "Actuaría", coordinacion: "Coordinación de Actuaría", activo: true };
export const USUARIOS_DEMO: Usuario[] = [ADMIN_DEMO, CAPTURA_DEMO];

type EstadoDemo = { ciclos: CicloResumen[]; planes: Record<string, PlanDeMejora>; secuencia: number };

const CLAVE = "ssm-demo-v1";
const vacio = (): EstadoDemo => ({ ciclos: [], planes: {}, secuencia: 0 });
let enMemoria: EstadoDemo | null = null;

export const leerDemo = (): EstadoDemo => {
  if (enMemoria) return enMemoria;
  try {
    const texto = typeof window === "undefined" ? null : window.localStorage.getItem(CLAVE);
    enMemoria = texto ? (JSON.parse(texto) as EstadoDemo) : vacio();
  } catch {
    enMemoria = vacio();
  }
  return enMemoria;
};

export const guardarDemo = (estado: EstadoDemo) => {
  enMemoria = estado;
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(estado));
  } catch {
    // Sin almacenamiento disponible: los datos duran mientras la pestaña siga abierta.
  }
};

export const siguienteIdDemo = (estado: EstadoDemo) => {
  estado.secuencia += 1;
  return `demo-${estado.secuencia}`;
};

/** Plan sin versión: lo que ve la coordinación antes de guardar su primera recomendación. */
export const planVacio = (ciclo: CicloResumen): PlanDeMejora => ({
  cicloId: ciclo.id,
  licenciatura: ciclo.licenciatura.nombre,
  organismo: ciclo.organismo.nombre,
  vigenciaInicio: ciclo.vigenciaInicio,
  vigenciaFin: ciclo.vigenciaFin,
  version: null,
  indicadores: [],
});
