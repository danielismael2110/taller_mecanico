import type { ReactNode } from "react";
import { PublicFooter } from "@/components/layout/public-footer";
import { PublicNavbar } from "@/components/layout/public-navbar";

/** Layout del portal público (accesible sin login, RF-070). */
export default function PortalLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-dvh flex-col bg-primary">
            <PublicNavbar />
            <main className="flex-1">{children}</main>
            <PublicFooter />
        </div>
    );
}
