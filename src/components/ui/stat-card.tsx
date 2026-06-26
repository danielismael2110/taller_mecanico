import type { FC, HTMLAttributes } from "react";
import { ArrowDown, ArrowUp } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { Card } from "./card";

interface StatCardProps {
    titulo: string;
    valor: string | number;
    icono: FC<HTMLAttributes<HTMLOrSVGElement>>;
    tendencia?: { valor: number; positiva?: boolean };
    color?: string;
}

/** Tarjeta de estadística con ícono y tendencia (dashboard). */
export function StatCard({ titulo, valor, icono: Icono, tendencia, color = "bg-brand-solid" }: StatCardProps) {
    return (
        <Card className="p-5">
            <div className="flex items-start justify-between">
                <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-tertiary">{titulo}</p>
                    <p className="mt-2 text-3xl font-semibold text-primary">{valor}</p>
                </div>
                <span className={cx("flex size-11 shrink-0 items-center justify-center rounded-lg text-white", color)}>
                    <Icono className="size-6" />
                </span>
            </div>
            {tendencia && (
                <div className="mt-3 flex items-center gap-1 text-sm">
                    <span className={cx("flex items-center gap-0.5 font-medium", tendencia.positiva ? "text-success-primary" : "text-error-primary")}>
                        {tendencia.positiva ? <ArrowUp className="size-4" /> : <ArrowDown className="size-4" />}
                        {Math.abs(tendencia.valor)}%
                    </span>
                    <span className="text-tertiary">vs. mes anterior</span>
                </div>
            )}
        </Card>
    );
}
