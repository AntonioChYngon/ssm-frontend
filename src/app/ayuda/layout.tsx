import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";

const AyudaLayout = ({ children }: { children: ReactNode }) => <AppShell area="comun">{children}</AppShell>;

export default AyudaLayout;
