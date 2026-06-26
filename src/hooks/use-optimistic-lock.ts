"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Bloqueo optimista para la edición de OT.
 * Guarda la `version` leída y la envía al actualizar; si el servidor detecta
 * un conflicto, marca `enConflicto` para que la UI pida recargar.
 */
export function useOptimisticLock(versionInicial: number) {
    const version = useRef(versionInicial);
    const [enConflicto, setEnConflicto] = useState(false);

    const setVersion = useCallback((v: number) => {
        version.current = v;
        setEnConflicto(false);
    }, []);

    const ejecutar = useCallback(async <T>(accion: (version: number) => Promise<T>): Promise<T | null> => {
        try {
            const resultado = await accion(version.current);
            // El trigger incrementa la versión: la subimos localmente.
            version.current += 1;
            return resultado;
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            if (msg.includes("Conflicto de edición") || msg.includes("RNF-024")) {
                setEnConflicto(true);
                return null;
            }
            throw e;
        }
    }, []);

    return { version: version.current, enConflicto, setVersion, ejecutar };
}
