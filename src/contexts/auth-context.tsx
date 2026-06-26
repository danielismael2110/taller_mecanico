"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Perfil, RolUsuario } from "@/lib/types/database";
import { authService } from "@/services/auth.service";

interface AuthContextValue {
    userId: string | null;
    correo: string | null;
    perfil: Perfil | null;
    rol: RolUsuario | null;
    cargando: boolean;
    esInterno: boolean;
    refrescarPerfil: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);
    const [correo, setCorreo] = useState<string | null>(null);
    const [perfil, setPerfil] = useState<Perfil | null>(null);
    const [cargando, setCargando] = useState(true);

    const cargarPerfil = useCallback(async (id: string) => {
        const p = await authService.getPerfil(id);
        setPerfil(p);
    }, []);

    const refrescarPerfil = useCallback(async () => {
        if (userId) await cargarPerfil(userId);
    }, [userId, cargarPerfil]);

    useEffect(() => {
        const supabase = getSupabaseBrowserClient();
        let activo = true;

        // Inicialización: getSession lee de almacenamiento local (no se cuelga en red).
        // El perfil se carga en segundo plano para NUNCA bloquear el estado de carga.
        (async () => {
            try {
                const {
                    data: { session },
                } = await supabase.auth.getSession();
                const user = session?.user ?? null;
                if (!activo) return;
                if (user) {
                    setUserId(user.id);
                    setCorreo(user.email ?? null);
                    cargarPerfil(user.id).catch(() => {});
                }
            } catch {
                // Sesión inválida/ausente: se tratará como no autenticado.
            } finally {
                if (activo) setCargando(false);
            }
        })();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            const user = session?.user ?? null;
            setUserId(user?.id ?? null);
            setCorreo(user?.email ?? null);
            if (user) {
                cargarPerfil(user.id).catch(() => {});
            } else {
                setPerfil(null);
            }
            setCargando(false);
        });

        return () => {
            activo = false;
            subscription.unsubscribe();
        };
    }, [cargarPerfil]);

    const logout = useCallback(async () => {
        await authService.logout();
        setPerfil(null);
        setUserId(null);
        router.push("/login");
    }, [router]);

    const value = useMemo<AuthContextValue>(
        () => ({
            userId,
            correo,
            perfil,
            rol: perfil?.rol ?? null,
            cargando,
            esInterno: ["admin", "recepcionista", "mecanico"].includes(perfil?.rol ?? ""),
            refrescarPerfil,
            logout,
        }),
        [userId, correo, perfil, cargando, refrescarPerfil, logout],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuthContext debe usarse dentro de <AuthProvider>");
    return ctx;
}
