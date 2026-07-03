"use client";

import type { ImgHTMLAttributes } from "react";
import { cx } from "@/utils/cx";

/**
 * Logo del taller "Gara Gato" (llanta + llaves cruzadas + engranajes).
 *
 * La imagen tiene fondo blanco, así que se muestra dentro de una insignia
 * redondeada blanca. De esta forma se ve limpia e intencional tanto en modo
 * claro como en modo nocturno (en oscuro queda como un ícono tipo app sobre
 * el fondo oscuro).
 */
export const UntitledLogoMinimal = (props: ImgHTMLAttributes<HTMLImageElement>) => {
    return (
        <img
            src="/logo1.jpg"
            alt="Taller Gara Gato"
            {...props}
            className={cx("size-8 shrink-0 rounded-md bg-white object-contain p-0.5", props.className)}
        />
    );
};
