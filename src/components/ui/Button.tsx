import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import { Icon, type IconName } from "./Icon";

export type ButtonVariant = "primario" | "secundario" | "contorno" | "peligro" | "texto";

type CommonProps = {
  variant?: ButtonVariant;
  icon?: IconName;
  block?: boolean;
  children?: ReactNode;
};

type ButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { ref?: Ref<HTMLButtonElement> };

const classes = (variant: ButtonVariant, block?: boolean, extra?: string) =>
  ["btn", `btn--${variant}`, block ? "btn--block" : "", extra ?? ""].filter(Boolean).join(" ");

export const Button = ({ variant = "primario", icon, block, children, className, type = "button", ...rest }: ButtonProps) => (
  <button type={type} className={classes(variant, block, className)} {...rest}>
    {icon && <Icon name={icon} size={20} />}
    {children}
  </button>
);

type LinkButtonProps = CommonProps & { href: string; className?: string };

export const LinkButton = ({ variant = "primario", icon, block, children, href, className }: LinkButtonProps) => (
  <Link href={href} className={classes(variant, block, className)}>
    {icon && <Icon name={icon} size={20} />}
    {children}
  </Link>
);

type IconButtonProps = {
  icon: IconName;
  label: string;
  danger?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export const IconButton = ({ icon, label, danger, className, ...rest }: IconButtonProps) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    className={["icon-btn", danger ? "icon-btn--danger" : "", className ?? ""].join(" ")}
    {...rest}
  >
    <Icon name={icon} size={20} />
  </button>
);
