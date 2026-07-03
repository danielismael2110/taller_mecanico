"use client";

import { useEffect, useState } from "react";
import { toMapsEmbedUrl } from "@/lib/utils/maps";

/**
 * Devuelve una URL de Google Maps lista para iframe a partir de la URL
 * guardada en la configuración. Las URLs normales se convierten al instante;
 * los enlaces cortos (maps.app.goo.gl) se resuelven vía /api/maps-embed.
 */
export function useMapsEmbed(url: string | null | undefined): string | null {
    // Conversión síncrona cuando no hace falta red (embed directo, coordenadas...).
    const directo = toMapsEmbedUrl(url);
    const [resuelto, setResuelto] = useState<string | null>(null);

    useEffect(() => {
        if (!url || directo) return;
        let activo = true;
        fetch(`/api/maps-embed?url=${encodeURIComponent(url)}`)
            .then((r) => r.json())
            .then((d) => activo && setResuelto(d.embed ?? null))
            .catch(() => activo && setResuelto(null));
        return () => {
            activo = false;
        };
    }, [url, directo]);

    return directo ?? resuelto;
}
