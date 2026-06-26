import { Check } from "@untitledui/icons";
import { ESTADOS_ORDEN, FLUJO_ESTADOS } from "@/lib/constants";
import type { EstadoOrden } from "@/lib/types/database";
import { cx } from "@/utils/cx";

/** Stepper visual del progreso de la OT. */
export function StepperEstados({ estado }: { estado: EstadoOrden }) {
    // Estados fuera del flujo lineal se muestran como aviso.
    if (estado === "cancelado" || estado === "presupuesto_rechazado") {
        return (
            <div className="rounded-lg bg-error-primary px-4 py-3 text-sm font-medium text-error-primary ring-1 ring-error">
                Orden {ESTADOS_ORDEN[estado].label.toLowerCase()}.
            </div>
        );
    }

    const indiceActual = FLUJO_ESTADOS.indexOf(estado);

    return (
        <div className="flex w-full items-center overflow-x-auto pb-2">
            {FLUJO_ESTADOS.map((e, i) => {
                const completado = i < indiceActual;
                const actual = i === indiceActual;
                return (
                    <div key={e} className="flex flex-1 items-center last:flex-none">
                        <div className="flex flex-col items-center gap-2">
                            <span
                                className={cx(
                                    "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ring-1 transition",
                                    completado && "bg-brand-solid text-white ring-transparent",
                                    actual && "bg-brand-primary_alt text-brand-secondary ring-brand",
                                    !completado && !actual && "bg-primary text-quaternary ring-secondary",
                                )}
                            >
                                {completado ? <Check className="size-4" /> : i + 1}
                            </span>
                            <span
                                className={cx(
                                    "max-w-20 text-center text-xs leading-tight",
                                    actual ? "font-semibold text-brand-secondary" : "text-tertiary",
                                )}
                            >
                                {ESTADOS_ORDEN[e].label}
                            </span>
                        </div>
                        {i < FLUJO_ESTADOS.length - 1 && (
                            <div className={cx("mx-1 h-0.5 flex-1 rounded", completado ? "bg-brand-solid" : "bg-border-secondary")} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
