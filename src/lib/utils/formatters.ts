/** Utilidades de formato para moneda, fechas e identidades visuales. */

const MONEDA = "Bs";

/** Formatea un número como moneda del taller. */
export function formatMoneda(valor: number | null | undefined, moneda = MONEDA): string {
    const n = Number(valor ?? 0);
    return `${moneda} ${n.toLocaleString("es-BO", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

/** Formatea solo el número con 2 decimales. */
export function formatNumero(valor: number | null | undefined): string {
    return Number(valor ?? 0).toLocaleString("es-BO", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

/** Fecha corta: 13/06/2026. */
export function formatFecha(iso: string | null | undefined): string {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("es-BO", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

/** Fecha y hora: 13/06/2026 14:30. */
export function formatFechaHora(iso: string | null | undefined): string {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("es-BO", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

/** Tiempo relativo: "hace 5 min", "hace 2 h". */
export function formatTiempoRelativo(iso: string | null | undefined): string {
    if (!iso) return "";
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return "ahora";
    if (min < 60) return `hace ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `hace ${h} h`;
    const d = Math.floor(h / 24);
    if (d < 30) return `hace ${d} d`;
    return formatFecha(iso);
}

/** Iniciales para avatar cuando no hay foto. */
export function getIniciales(nombre: string | null | undefined): string {
    if (!nombre) return "?";
    const partes = nombre.trim().split(/\s+/);
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

/** Convierte minutos a "1 h 30 min". */
export function formatDuracion(min: number | null | undefined): string {
    if (!min) return "—";
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h} h`;
    return `${h} h ${m} min`;
}
