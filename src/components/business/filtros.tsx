"use client";

import { Select } from "@/components/base/select/select";

export interface OpcionFiltro {
    value: string;
    label: string;
}

interface FiltroSelectProps {
    label?: string;
    placeholder?: string;
    opciones: OpcionFiltro[];
    valor: string | null;
    onCambio: (valor: string | null) => void;
    incluirTodos?: boolean;
    className?: string;
}

/** Selector de filtro reutilizable (por estado, prioridad, etc.) usando UntitledUI Select. */
export function FiltroSelect({
    label,
    placeholder = "Todos",
    opciones,
    valor,
    onCambio,
    incluirTodos = true,
    className,
}: FiltroSelectProps) {
    const items = [
        ...(incluirTodos ? [{ id: "__todos__", label: placeholder }] : []),
        ...opciones.map((o) => ({ id: o.value, label: o.label })),
    ];

    return (
        <Select
            label={label}
            aria-label={label ?? placeholder}
            placeholder={placeholder}
            items={items}
            selectedKey={valor ?? "__todos__"}
            onSelectionChange={(key) => onCambio(key === "__todos__" ? null : String(key))}
            className={className}
            size="md"
        >
            {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
        </Select>
    );
}
