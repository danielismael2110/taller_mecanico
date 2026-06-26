"use client";

import { useEffect, useRef } from "react";
import { MINUTOS_INACTIVIDAD } from "@/lib/constants";

const EVENTOS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];

/**
 * Cierra la sesión tras N minutos sin actividad.
 * Solo se activa para usuarios internos.
 */
export function useInactivity(onTimeout: () => void, minutos = MINUTOS_INACTIVIDAD, activo = true) {
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!activo) return;

        const reiniciar = () => {
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(onTimeout, minutos * 60 * 1000);
        };

        EVENTOS.forEach((e) => window.addEventListener(e, reiniciar, { passive: true }));
        reiniciar();

        return () => {
            if (timer.current) clearTimeout(timer.current);
            EVENTOS.forEach((e) => window.removeEventListener(e, reiniciar));
        };
    }, [onTimeout, minutos, activo]);
}
