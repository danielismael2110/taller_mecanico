import { NextResponse } from "next/server";
import { toMapsEmbedUrl } from "@/lib/utils/maps";

/** Hosts de Google Maps permitidos (evita usar esta ruta como proxy abierto). */
const HOSTS_PERMITIDOS = ["maps.app.goo.gl", "goo.gl", "google.com", "www.google.com", "maps.google.com"];

/**
 * Convierte cualquier URL de Google Maps en una URL incrustable en iframe.
 * Los enlaces cortos (maps.app.goo.gl) no se pueden resolver desde el
 * navegador por CORS, así que se resuelven aquí siguiendo la redirección.
 */
export async function GET(request: Request) {
    const url = new URL(request.url).searchParams.get("url");
    if (!url) return NextResponse.json({ embed: null });

    let host: string;
    try {
        host = new URL(url).hostname;
    } catch {
        return NextResponse.json({ embed: null });
    }
    if (!HOSTS_PERMITIDOS.includes(host)) return NextResponse.json({ embed: null });

    // Si ya es normalizable sin red (embed directo, coordenadas, lugar), listo.
    const directo = toMapsEmbedUrl(url);
    if (directo) return NextResponse.json({ embed: directo });

    // Enlace corto: seguir la redirección para obtener la URL real con coordenadas.
    try {
        const res = await fetch(url, { method: "HEAD", redirect: "follow", next: { revalidate: 86400 } });
        return NextResponse.json({ embed: toMapsEmbedUrl(res.url) });
    } catch {
        return NextResponse.json({ embed: null });
    }
}
