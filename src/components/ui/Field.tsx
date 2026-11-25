"use client";

import { useId, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { Icon, type IconName } from "./Icon";

type FieldShellProps = {
  id: string;
  label: string;
  help?: string;
  error?: string;
  disabled?: boolean;
  area?: boolean;
  children: ReactNode;
};

const FieldShell = ({ id, label, help, error, disabled, area, children }: FieldShellProps) => (
  <div className={["field", error ? "field--error" : "", disabled ? "field--disabled" : ""].join(" ")}>
    <label htmlFor={id} className="field__label">{label}</label>
    <div className={["field__control", area ? "field__control--area" : ""].join(" ")}>{children}</div>
    {(error || help) && (
      <p className="field__help" id={`${id}-help`} role={error ? "alert" : undefined} style={{ margin: 0 }}>
        {error && <Icon name="alerta" size={16} />}
        {error ?? help}
      </p>
    )}
  </div>
);

type TextFieldProps = {
  label: string;
  icon?: IconName;
  help?: string;
  error?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export const TextField = ({ label, icon, help, error, id, disabled, type, ...rest }: TextFieldProps) => {
  const autoId = useId();
  const fieldId = id ?? autoId;
  // Botón propio para ver la contraseña: el de Edge desaparece cuando el navegador la autocompleta.
  const esContrasena = type === "password";
  const [visible, setVisible] = useState(false);
  return (
    <FieldShell id={fieldId} label={label} help={help} error={error} disabled={disabled}>
      {icon && <span className="field__icon"><Icon name={icon} size={20} /></span>}
      <input
        id={fieldId}
        type={esContrasena && visible ? "text" : type}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error || help ? `${fieldId}-help` : undefined}
        {...rest}
      />
      {esContrasena && (
        <button
          type="button"
          className="field__toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? `Ocultar ${label.replace(/\s*\*$/, "").toLowerCase()}` : `Mostrar ${label.replace(/\s*\*$/, "").toLowerCase()}`}
          aria-pressed={visible}
          aria-controls={fieldId}
          disabled={disabled}
        >
          <Icon name={visible ? "ocultar" : "ver"} size={20} />
        </button>
      )}
    </FieldShell>
  );
};

type SelectFieldProps = {
  label: string;
  options: readonly string[];
  help?: string;
  error?: string;
} & SelectHTMLAttributes<HTMLSelectElement>;

export const SelectField = ({ label, options, help, error, id, disabled, ...rest }: SelectFieldProps) => {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldShell id={fieldId} label={label} help={help} error={error} disabled={disabled}>
      <select id={fieldId} disabled={disabled} aria-invalid={Boolean(error)} {...rest}>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      <span className="field__icon" aria-hidden><Icon name="chevron-abajo" size={20} /></span>
    </FieldShell>
  );
};

type TextAreaFieldProps = {
  label: string;
  help?: string;
  error?: string;
} & TextareaHTMLAttributes<HTMLTextAreaElement>;

export const TextAreaField = ({ label, help, error, id, ...rest }: TextAreaFieldProps) => {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldShell id={fieldId} label={label} help={help} error={error} area>
      <textarea id={fieldId} aria-invalid={Boolean(error)} {...rest} />
    </FieldShell>
  );
};

type CheckboxProps = { label: string } & Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export const Checkbox = ({ label, ...rest }: CheckboxProps) => (
  <label className="check">
    <input type="checkbox" {...rest} />
    <span>{label}</span>
  </label>
);

type RadioProps = { label: string } & Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export const Radio = ({ label, ...rest }: RadioProps) => (
  <label className="check">
    <input type="radio" {...rest} />
    <span>{label}</span>
  </label>
);
