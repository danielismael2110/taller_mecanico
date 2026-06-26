import { cx } from "@/utils/cx";

/** Bloque de carga "esqueleto" (Extras: skeleton loading). */
export function Skeleton({ className }: { className?: string }) {
    return <div className={cx("animate-pulse rounded-md bg-tertiary/60", className)} />;
}

/** Filas de esqueleto para tablas. */
export function SkeletonTable({ filas = 5, columnas = 4 }: { filas?: number; columnas?: number }) {
    return (
        <div className="flex flex-col gap-3 p-4">
            {Array.from({ length: filas }).map((_, i) => (
                <div key={i} className="flex gap-4">
                    {Array.from({ length: columnas }).map((__, j) => (
                        <Skeleton key={j} className="h-5 flex-1" />
                    ))}
                </div>
            ))}
        </div>
    );
}
