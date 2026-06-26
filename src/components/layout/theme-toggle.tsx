"use client";

import { useEffect, useState } from "react";
import { Moon01, Sun } from "@untitledui/icons";
import { useTheme } from "next-themes";
import { ButtonUtility } from "@/components/base/buttons/button-utility";

/** Botón para alternar el modo claro/oscuro (Extras: dark mode). */
export function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme();
    const [montado, setMontado] = useState(false);

    useEffect(() => setMontado(true), []);

    const esOscuro = resolvedTheme === "dark";

    return (
        <ButtonUtility
            size="sm"
            color="tertiary"
            tooltip={esOscuro ? "Modo claro" : "Modo oscuro"}
            icon={montado && esOscuro ? Sun : Moon01}
            onClick={() => setTheme(esOscuro ? "light" : "dark")}
            aria-label="Cambiar tema"
        />
    );
}
