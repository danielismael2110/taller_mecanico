import { ESTADOS_ORDEN } from "@/lib/constants";
import type { HistorialEstadoOrden } from "@/lib/types/database";
import { formatFechaHora } from "@/lib/utils/formatters";
import { cx } from "@/utils/cx";

type ConPerfil = HistorialEstadoOrden & { perfil?: { nombre?: string } | null };

/** Línea de tiempo vertical de cambios de estado de la OT. */
export function TimelineEstados({ historial }: { historial: ConPerfil[] }) {
    if (historial.length === 0) {
        return <p className="text-sm text-tertiary">Sin cambios registrados.</p>;
    }

    return (
        <ol className="flex flex-col">
            {historial.map((h, i) => {
                const esUltimo = i === historial.length - 1;
                const info = ESTADOS_ORDEN[h.estado_nuevo];
                return (
                    <li key={h.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                            <span
                                className={cx(
                                    "mt-1 size-3 shrink-0 rounded-full ring-4",
                                    esUltimo ? "bg-brand-solid ring-brand-primary/20" : "bg-fg-quaternary ring-transparent",
                                )}
                            />
                            {!esUltimo && <span className="my-1 w-px flex-1 bg-border-secondary" />}
                        </div>
                        <div className={cx("pb-5", esUltimo && "pb-0")}>
                            <p className="text-sm font-semibold text-primary">{info?.label ?? h.estado_nuevo}</p>
                            <p className="text-xs text-tertiary">{formatFechaHora(h.creado_en)}</p>
                            {h.perfil?.nombre && <p className="text-xs text-quaternary">por {h.perfil.nombre}</p>}
                            {h.motivo && <p className="mt-1 text-sm text-secondary">{h.motivo}</p>}
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}
