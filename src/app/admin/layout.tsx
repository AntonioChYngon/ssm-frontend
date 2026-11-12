import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";

const AdminLayout = ({ children }: { children: ReactNode }) => <AppShell area="admin">{children}</AppShell>;

export default AdminLayout;
