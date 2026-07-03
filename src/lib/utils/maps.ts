/**
 * Normaliza una URL de Google Maps para que se pueda usar en un <iframe>.
 *
 * Google solo permite incrustar URLs de tipo "embed"; los enlaces de compartir
 * (maps.app.goo.gl, goo.gl/maps) y las URLs normales de maps.google.com se
 * bloquean dentro de un iframe y se ven como un recuadro roto.
 *
 * Casos soportados:
 * - URL ya incrustable (/maps/embed o output=embed) → se usa tal cual.
 * - URL con coordenadas (@lat,lng · q=lat,lng · /search/lat,+lng) → se
 *   convierte a https://www.google.com/maps?q=lat,lng&output=embed.
 * - URL de lugar (/maps/place/NOMBRE) → embed por nombre del lugar.
 * - Enlaces cortos (maps.app.goo.gl) → no se pueden resolver desde el
 *   navegador; se devuelve null para ocultar el mapa en vez de mostrarlo roto.
 */
export function toMapsEmbedUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    const limpio = url.trim();
    if (!limpio) return null;

    // Ya es una URL incrustable.
    if (limpio.includes("/maps/embed") || limpio.includes("output=embed")) return limpio;

    // Enlace corto de compartir: imposible de resolver client-side (CORS).
    if (/(^|\/\/)(maps\.app\.goo\.gl|goo\.gl)\//.test(limpio)) return null;

    const embedDeCoords = (lat: string, lng: string) => `https://www.google.com/maps?q=${lat},${lng}&z=16&output=embed`;

    // Coordenadas en la ruta: .../@-17.37,-66.18,15z o /search/-17.37,+-66.18
    const coordsRuta = limpio.match(/[@/](-?\d{1,3}\.\d+),\s*\+?(-?\d{1,3}\.\d+)/);
    if (coordsRuta) return embedDeCoords(coordsRuta[1], coordsRuta[2]);

    // Coordenadas en query: ?q=-17.37,-66.18 o ?ll=...
    const coordsQuery = limpio.match(/[?&](?:q|ll)=(-?\d{1,3}\.\d+),\s*\+?(-?\d{1,3}\.\d+)/);
    if (coordsQuery) return embedDeCoords(coordsQuery[1], coordsQuery[2]);

    // Lugar por nombre: /maps/place/Taller+GaraGato/...
    const lugar = limpio.match(/\/maps\/place\/([^/?#]+)/);
    if (lugar) return `https://www.google.com/maps?q=${lugar[1]}&output=embed`;

    // Cualquier otra URL de Google Maps: intento genérico con output=embed.
    if (limpio.includes("google.com/maps")) {
        return `${limpio}${limpio.includes("?") ? "&" : "?"}output=embed`;
    }

    return limpio;
}
