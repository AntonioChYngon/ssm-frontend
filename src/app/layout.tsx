import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const roboto = Roboto({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-roboto", display: "swap" });

export const metadata: Metadata = {
  title: { default: "SSM · FES Acatlán", template: "%s · SSM FES Acatlán" },
  description: "Sistema de Seguimiento de Mejora de la FES Acatlán, UNAM.",
};

const RootLayout = ({ children }: { children: ReactNode }) => (
  <html lang="es-MX" className={roboto.variable}>
    <body>{children}</body>
  </html>
);

export default RootLayout;
