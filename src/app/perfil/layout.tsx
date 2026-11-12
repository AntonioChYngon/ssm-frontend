import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";

const PerfilLayout = ({ children }: { children: ReactNode }) => <AppShell area="licenciatura">{children}</AppShell>;

export default PerfilLayout;
