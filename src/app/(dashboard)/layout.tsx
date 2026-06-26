import type { ReactNode } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";

/** Layout protegido: sidebar + header para panel interno y portal del cliente. */
export default function DashboardLayout({ children }: { children: ReactNode }) {
    return <DashboardShell>{children}</DashboardShell>;
}
