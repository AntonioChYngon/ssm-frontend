"use client";

// HU-07 · Captura del % y las observaciones de una recomendación, con guardado por fila.
// El % se escribe con teclado (entero de 0 a 100); el backend vuelve a validar.
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge, Progress } from "@/components/ui/Display";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { leerPorcentaje } from "@/lib/reglas-informe";
import type { AvanceDetalle } from "@/lib/types";

type Props = {
  avance: AvanceDetalle;
  ocupado: boolean;
  /** Guarda la fila; devuelve true si el servidor aceptó el cambio. */
  guardar: (porcentaje: number, observaciones: string) => Promise<boolean>;
  /** Avisa a la pantalla si la fila tiene cambios sin guardar (para el aviso al salir). */
  alCambiar: (sucio: boolean) => void;
};

export const EditorAvance = ({ avance, ocupado, guardar, alCambiar }: Props) => {
  const [porcentaje, setPorcentaje] = useState(avance.porcentaje === null ? "" : String(avance.porcentaje));
  const [observaciones, setObservaciones] = useState(avance.observaciones ?? "");
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  // Cuando el servidor responde, la fila toma sus valores (fuente de verdad).
  useEffect(() => {
    setPorcentaje(avance.porcentaje === null ? "" : String(avance.porcentaje));
    setObservaciones(avance.observaciones ?? "");
  }, [avance.porcentaje, avance.observaciones]);

  const sucio = porcentaje !== (avance.porcentaje === null ? "" : String(avance.porcentaje)) || observaciones.trim() !== (avance.observaciones ?? "");
  useEffect(() => alCambiar(sucio), [sucio, alCambiar]);
  // Al desaparecer la fila (p. ej. el informe se envió) deja de contar como pendiente.
  const alCambiarRef = useRef(alCambiar);
  alCambiarRef.current = alCambiar;
  useEffect(() => () => alCambiarRef.current(false), []);

  const lectura = leerPorcentaje(porcentaje);
  const valorValido = "valor" in lectura ? lectura.valor : null;

  const onGuardar = async () => {
    if (!("valor" in lectura)) {
      setError(lectura.error);
      return;
    }
    setError(null);
    setGuardado(false);
    if (await guardar(lectura.valor, observaciones)) setGuardado(true);
  };

  return (
    <div className="stack" style={{ gap: 12 }}>
      <div className="row row--top row--responsive" style={{ gap: 16 }}>
        <div style={{ width: 200 }}>
          <TextField
            label="% de avance"
            inputMode="numeric"
            placeholder="0 a 100"
            value={porcentaje}
            maxLength={3}
            error={error ?? undefined}
            help={error ? undefined : "Entero de 0 a 100"}
            onChange={(e) => {
              setPorcentaje(e.target.value.replace(/[^\d]/g, ""));
              setError(null);
              setGuardado(false);
            }}
          />
        </div>
        <div className="stack grow" style={{ gap: 6, paddingTop: 30 }}>
          <span className="t-small t-muted">
            {avance.esperadoAlCorte === null ? "Sin metas que venzan antes del corte" : `El plan comprometía ${avance.esperadoAlCorte}% al corte`}
          </span>
          {valorValido !== null && <Progress value={valorValido} width={200} />}
          {valorValido !== null && avance.esperadoAlCorte !== null && valorValido < avance.esperadoAlCorte && (
            <Badge estado="Pendiente">Por debajo de lo esperado</Badge>
          )}
        </div>
      </div>
      <TextAreaField
        label="Observaciones de la coordinación (opcional)"
        placeholder="Describe el avance, lo que falta o por qué hay rezago…"
        value={observaciones}
        maxLength={4000}
        rows={2}
        onChange={(e) => {
          setObservaciones(e.target.value);
          setGuardado(false);
        }}
      />
      <div className="row" style={{ gap: 12 }}>
        <Button variant={sucio ? "primario" : "contorno"} icon="check" disabled={ocupado || !sucio} onClick={() => void onGuardar()}>
          Guardar avance
        </Button>
        {sucio && <span className="t-small t-warning">Cambios sin guardar</span>}
        {guardado && !sucio && <span className="t-small t-success" role="status">Guardado</span>}
      </div>
    </div>
  );
};
