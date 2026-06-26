/**
 * Traduce errores técnicos de Supabase/Postgres a mensajes legibles
 * para el usuario final.
 */

const MAPA_MENSAJES: Record<string, string> = {
    "Invalid login credentials": "Correo o contraseña incorrectos.",
    "Email not confirmed": "Debes verificar tu correo antes de iniciar sesión.",
    "User already registered": "Ya existe una cuenta con ese correo.",
    "duplicate key value": "Ya existe un registro con esos datos.",
    "violates foreign key": "No se puede completar: el registro está en uso.",
    "violates row-level security": "No tienes permiso para realizar esta acción.",
    "Stock insuficiente": "No hay stock suficiente del repuesto.",
    "Conflicto de edición": "Otro usuario modificó este registro. Recarga e inténtalo de nuevo.",
    "El mecánico ya tiene una cita": "El mecánico ya tiene una cita en ese horario.",
    "El horario está bloqueado": "Ese horario no está disponible.",
    "El motivo es obligatorio": "Debes indicar un motivo.",
    "Failed to fetch": "Sin conexión con el servidor. Revisa tu internet.",
};

export function mensajeError(error: unknown): string {
    if (!error) return "Ocurrió un error inesperado.";

    const raw =
        typeof error === "string"
            ? error
            : error instanceof Error
              ? error.message
              : (error as { message?: string })?.message ?? "";

    for (const [clave, mensaje] of Object.entries(MAPA_MENSAJES)) {
        if (raw.includes(clave)) return mensaje;
    }

    // Si el mensaje no parece técnico, mostrarlo; si no, genérico.
    if (raw && raw.length < 140 && !raw.includes("{") && !raw.toLowerCase().includes("postgres")) {
        return raw;
    }
    return "Ocurrió un error. Inténtalo nuevamente.";
}
