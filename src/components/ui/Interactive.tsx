"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "./Button";
import { Icon } from "./Icon";

type ChipGroupProps = {
  options: string[];
  value?: string;
  onChange?: (value: string) => void;
  label: string;
};

export const ChipGroup = ({ options, value, onChange, label }: ChipGroupProps) => {
  const [selected, setSelected] = useState(value ?? options[0]);
  const select = (option: string) => {
    setSelected(option);
    onChange?.(option);
  };
  return (
    <div className="row row--wrap" role="group" aria-label={label} style={{ gap: 8 }}>
      {options.map((option) => (
        <button key={option} type="button" className="chip" aria-pressed={option === selected} onClick={() => select(option)}>
          {option}
        </button>
      ))}
    </div>
  );
};

type ConfirmModalProps = {
  open: boolean;
  tipo: "validar" | "devolver";
  titulo: string;
  mensaje: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: (motivo?: string) => void;
  /** Texto del campo de motivo cuando tipo = "devolver" (p. ej. reabrir un informe). */
  etiquetaMotivo?: string;
};

// Confirmación obligatoria antes de acciones con consecuencias (Validar / Devolver).
export const ConfirmModal = ({ open, tipo, titulo, mensaje, confirmLabel, onCancel, onConfirm, etiquetaMotivo = "Motivo de la devolución" }: ConfirmModalProps) => {
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const validar = tipo === "validar";
  const confirm = () => {
    if (!validar && motivo.trim().length < 10) {
      setError(`Escribe el ${etiquetaMotivo.toLowerCase()} (al menos 10 caracteres).`);
      return;
    }
    onConfirm(validar ? undefined : motivo.trim());
  };

  return (
    <div className="overlay" role="presentation" onClick={onCancel}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={(event) => event.stopPropagation()}>
        <span className="modal__icon" style={{ background: validar ? "var(--color-success-bg)" : "var(--color-danger-bg)", color: validar ? "var(--color-success-text)" : "var(--color-danger-text)" }}>
          <Icon name={validar ? "check" : "alerta"} size={28} />
        </span>
        <h2 id="modal-title" className="t-h2">{titulo}</h2>
        <p className="t-muted" style={{ margin: 0 }}>{mensaje}</p>
        {!validar && (
          <div className={["field", error ? "field--error" : ""].join(" ")}>
            <label htmlFor="motivo" className="field__label">{etiquetaMotivo} (obligatorio)</label>
            <div className="field__control field__control--area">
              <textarea id="motivo" value={motivo} onChange={(event) => setMotivo(event.target.value)} placeholder="Escribe las observaciones generales…" />
            </div>
            {error && <p className="field__help" role="alert" style={{ margin: 0 }}><Icon name="alerta" size={16} />{error}</p>}
          </div>
        )}
        <div className="row" style={{ justifyContent: "flex-end", gap: 12 }}>
          <Button ref={cancelRef} variant="contorno" onClick={onCancel}>Cancelar</Button>
          <Button variant={validar ? "primario" : "peligro"} icon={validar ? "check" : "mensaje"} onClick={confirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
};

export const Drawer = ({ open, onClose, children, labelledBy }: { open: boolean; onClose: () => void; children: ReactNode; labelledBy: string }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>{children}</aside>
    </>
  );
};
