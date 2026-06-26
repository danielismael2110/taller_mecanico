"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LoadingIndicator } from "@/components/application/loading-indicator/loading-indicator";
import { useAuth } from "@/hooks/use-auth";
import type { RolUsuario } from "@/lib/types/database";

/** Restringe el contenido a ciertos roles dentro del panel (no re-renderiza el shell). */
export function RequiereRol({ roles, children }: { roles: RolUsuario[]; children: ReactNode }) {
    const router = useRouter();
    const { rol, cargando } = useAuth();

    useEffect(() => {
        if (!cargando && rol && !roles.includes(rol)) {
            router.replace(rol === "cliente" ? "/cliente/dashboard" : "/admin");
        }
    }, [cargando, rol, roles, router]);

    if (cargando || !rol) {
        return (
            <div className="flex justify-center py-20">
                <LoadingIndicator size="md" label="Cargando..." />
            </div>
        );
    }
    if (!roles.includes(rol)) return null;

    return <>{children}</>;
}
