import type { ReactNode } from "react";

/** Encabezado estándar de página con título, descripción y acciones. */
export function PageHeader({
    titulo,
    descripcion,
    acciones,
}: {
    titulo: string;
    descripcion?: string;
    acciones?: ReactNode;
}) {
    return (
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 className="text-2xl font-semibold text-primary">{titulo}</h1>
                {descripcion && <p className="mt-1 text-sm text-tertiary">{descripcion}</p>}
            </div>
            {acciones && <div className="flex shrink-0 items-center gap-2">{acciones}</div>}
        </div>
    );
}
