import { Badge } from "@/components/base/badges/badges";
import type { BadgeColor } from "@/lib/constants";

/** Insignia de estado reutilizable a partir de los mapas de constants.ts. */
export function EstadoBadge({ label, color, size = "sm" }: { label: string; color: BadgeColor; size?: "sm" | "md" | "lg" }) {
    return (
        <Badge type="pill-color" color={color} size={size}>
            {label}
        </Badge>
    );
}
