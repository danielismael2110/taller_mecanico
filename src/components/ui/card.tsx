import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/utils/cx";

/** Tarjeta contenedora con el estilo de UntitledUI. */
export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div {...props} className={cx("rounded-xl bg-primary shadow-xs ring-1 ring-secondary", className)}>
            {children}
        </div>
    );
}

export function CardHeader({
    titulo,
    descripcion,
    accion,
    className,
}: {
    titulo: ReactNode;
    descripcion?: ReactNode;
    accion?: ReactNode;
    className?: string;
}) {
    return (
        <div className={cx("flex items-start justify-between gap-4 border-b border-secondary px-5 py-4", className)}>
            <div className="min-w-0">
                <h3 className="text-md font-semibold text-primary">{titulo}</h3>
                {descripcion && <p className="mt-0.5 text-sm text-tertiary">{descripcion}</p>}
            </div>
            {accion && <div className="shrink-0">{accion}</div>}
        </div>
    );
}

export function CardBody({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div {...props} className={cx("p-5", className)}>
            {children}
        </div>
    );
}
