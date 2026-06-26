"use client";

import { useEffect, useState } from "react";

/** Retrasa la actualización de un valor (para búsquedas, RNF-002). */
export function useDebounce<T>(valor: T, delay = 400): T {
    const [debounced, setDebounced] = useState(valor);

    useEffect(() => {
        const id = setTimeout(() => setDebounced(valor), delay);
        return () => clearTimeout(id);
    }, [valor, delay]);

    return debounced;
}
