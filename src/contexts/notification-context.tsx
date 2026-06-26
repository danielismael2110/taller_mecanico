"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { Notificacion } from "@/lib/types/database";
import { notificacionesService } from "@/services/notificaciones.service";
import { useAuthContext } from "./auth-context";

interface NotificationContextValue {
    notificaciones: Notificacion[];
    noLeidas: number;
    cargando: boolean;
    marcarLeida: (id: number) => Promise<void>;
    marcarTodasLeidas: () => Promise<void>;
    refrescar: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const { userId } = useAuthContext();
    const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
    const [cargando, setCargando] = useState(false);

    const refrescar = useCallback(async () => {
        if (!userId) return;
        setCargando(true);
        try {
            const data = await notificacionesService.listar(userId);
            setNotificaciones(data);
        } finally {
            setCargando(false);
        }
    }, [userId]);

    useEffect(() => {
        if (!userId) {
            setNotificaciones([]);
            return;
        }
        refrescar();

        // Tiempo real: campanita (Anexo A)
        const desuscribir = notificacionesService.suscribir(userId, (nueva) => {
            setNotificaciones((prev) => [nueva, ...prev]);
            toast(nueva.titulo, { description: nueva.mensaje ?? undefined });
        });
        return desuscribir;
    }, [userId, refrescar]);

    const marcarLeida = useCallback(async (id: number) => {
        await notificacionesService.marcarLeida(id);
        setNotificaciones((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)));
    }, []);

    const marcarTodasLeidas = useCallback(async () => {
        if (!userId) return;
        await notificacionesService.marcarTodasLeidas(userId);
        setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
    }, [userId]);

    const value = useMemo<NotificationContextValue>(
        () => ({
            notificaciones,
            noLeidas: notificaciones.filter((n) => !n.leida).length,
            cargando,
            marcarLeida,
            marcarTodasLeidas,
            refrescar,
        }),
        [notificaciones, cargando, marcarLeida, marcarTodasLeidas, refrescar],
    );

    return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotificationContext() {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error("useNotificationContext debe usarse dentro de <NotificationProvider>");
    return ctx;
}
