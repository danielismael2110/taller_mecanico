"use client";

import { useEffect, useState } from "react";
import { SearchLg } from "@untitledui/icons";
import { Input } from "@/components/base/input/input";
import { useDebounce } from "@/hooks/use-debounce";

interface SearchBarProps {
    onBuscar: (valor: string) => void;
    placeholder?: string;
    delay?: number;
    className?: string;
}

/** Buscador con debounce. */
export function SearchBar({ onBuscar, placeholder = "Buscar...", delay = 400, className }: SearchBarProps) {
    const [valor, setValor] = useState("");
    const debounced = useDebounce(valor, delay);

    useEffect(() => {
        onBuscar(debounced);
        // onBuscar se asume estable (useCallback en el consumidor)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debounced]);

    return (
        <Input
            size="md"
            aria-label="Buscar"
            icon={SearchLg}
            placeholder={placeholder}
            value={valor}
            onChange={setValor}
            className={className}
        />
    );
}
