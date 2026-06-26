"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ConfiguracionTaller } from "@/lib/types/database";
import { configuracionService } from "@/services/configuracion.service";

interface TallerContextValue {
    config: ConfiguracionTaller | null;
    cargando: boolean;
    refrescar: () => Promise<void>;
}

const TallerContext = createContext<TallerContextValue | undefined>(undefined);

export function TallerProvider({ children }: { children: ReactNode }) {
    const [config, setConfig] = useState<ConfiguracionTaller | null>(null);
    const [cargando, setCargando] = useState(true);

    const refrescar = async () => {
        try {
            const c = await configuracionService.obtener();
            setConfig(c);
        } catch {
            // Configuración no disponible (sin sesión / RLS); el portal usa valores por defecto.
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        refrescar();
    }, []);

    const value = useMemo<TallerContextValue>(() => ({ config, cargando, refrescar }), [config, cargando]);

    return <TallerContext.Provider value={value}>{children}</TallerContext.Provider>;
}

export function useTallerContext() {
    const ctx = useContext(TallerContext);
    if (!ctx) throw new Error("useTallerContext debe usarse dentro de <TallerProvider>");
    return ctx;
}
