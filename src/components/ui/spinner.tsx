import { LoadingIndicator } from "@/components/application/loading-indicator/loading-indicator";

/** Indicador de carga. Alias de UntitledUI LoadingIndicator. */
export function Spinner({ label, size = "sm" }: { label?: string; size?: "sm" | "md" | "lg" | "xl" }) {
    return <LoadingIndicator type="line-spinner" size={size} label={label} />;
}
