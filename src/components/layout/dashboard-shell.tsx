"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { LoadingIndicator } from "@/components/application/loading-indicator/loading-indicator";
import { useAuth } from "@/hooks/use-auth";
import { useInactivity } from "@/hooks/use-inactivity";
import { navPorRol } from "@/lib/navigation";
import type { RolUsuario } from "@/lib/types/database";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

interface DashboardShellProps {
    children: ReactNode;
    /** Roles autorizados a ver esta sección. Si se omite, cualquier usuario autenticado. */
    rolesPermitidos?: RolUsuario[];
}

/** Contenedor del panel: guardia de sesión/rol, inactividad y layout sidebar+header. */
export function DashboardShell({ children, rolesPermitidos }: DashboardShellProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { userId, rol, perfil, cargando, esInterno, logout } = useAuth();
    const [menuAbierto, setMenuAbierto] = useState(false);

    // Cierre por inactividad para usuarios internos
    const cerrarPorInactividad = useCallback(() => {
        logout();
        toast.info("Sesión cerrada por inactividad.");
    }, [logout]);
    useInactivity(cerrarPorInactividad, 5, esInterno);

    // Guardia de sesión
    useEffect(() => {
        if (!cargando && !userId) router.replace("/login");
    }, [cargando, userId, router]);

    // Guardia de cuenta desactivada: si el admin desactivó al usuario, se cierra su sesión.
    useEffect(() => {
        if (perfil && perfil.activo === false) {
            toast.error("Tu cuenta ha sido desactivada. Contacta al administrador.");
            logout();
        }
    }, [perfil, logout]);

    // Guardia de rol por área:
    //  - rutas internas (no /cliente) sólo para admin/recepcionista/mecánico
    //  - rutas /cliente sólo para clientes
    useEffect(() => {
        if (cargando || !rol) return;
        // Ojo: "/clientes" NO es el portal del cliente. El portal es exactamente "/cliente" o "/cliente/...".
        const esAreaCliente = pathname === "/cliente" || pathname.startsWith("/cliente/");
        if (esAreaCliente && rol !== "cliente") {
            router.replace("/admin");
        } else if (!esAreaCliente && rol === "cliente") {
            router.replace("/cliente/dashboard");
        } else if (rolesPermitidos && !rolesPermitidos.includes(rol)) {
            router.replace(rol === "cliente" ? "/cliente/dashboard" : "/admin");
        }
    }, [cargando, rol, pathname, rolesPermitidos, router]);

    if (cargando || !userId) {
        return (
            <div className="flex min-h-dvh items-center justify-center bg-secondary">
                <LoadingIndicator size="md" label="Cargando..." />
            </div>
        );
    }

    return (
        <div className="flex min-h-dvh bg-secondary">
            <Sidebar items={navPorRol(rol)} abiertoMovil={menuAbierto} onCerrar={() => setMenuAbierto(false)} />
            <div className="flex min-w-0 flex-1 flex-col">
                <Header onAbrirMenu={() => setMenuAbierto(true)} />
                <main className="flex-1 overflow-x-hidden px-4 py-6 lg:px-8">{children}</main>
            </div>
        </div>
    );
}
