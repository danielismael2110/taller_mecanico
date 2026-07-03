import { cx } from "@/utils/cx";

/**
 * Marca del taller "Gara Gato": la imagen del logo (llanta + llaves) dentro de
 * una insignia redondeada blanca. El fondo blanco es intencional para que la
 * imagen (que tiene fondo blanco) se vea limpia tanto en modo claro como en
 * modo nocturno, donde queda como un ícono tipo app sobre el fondo oscuro.
 */
export const LogoMark = ({ className }: { className?: string }) => (
    <span className={cx("flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white", className)}>
        <img src="/logo1.jpg" alt="GaraGato" className="size-full object-contain" />
    </span>
);
