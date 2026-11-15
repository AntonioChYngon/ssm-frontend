import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";

const PerfilLayout = ({ children }: { children: ReactNode }) => <AppShell area="comun">{children}</AppShell>;

export default PerfilLayout;
