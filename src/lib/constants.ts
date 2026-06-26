import type {
    EstadoCita,
    EstadoCompra,
    EstadoOrden,
    EstadoPago,
    EstadoPresupuesto,
    MetodoPago,
    PrioridadOrden,
    RolUsuario,
    TipoMovimiento,
} from "@/lib/types/database";

/** Color de UntitledUI Badge admitido. */
export type BadgeColor =
    | "gray"
    | "brand"
    | "error"
    | "warning"
    | "success"
    | "blue"
    | "indigo"
    | "purple"
    | "pink"
    | "orange";

interface Opcion<T extends string> {
    value: T;
    label: string;
    color: BadgeColor;
}

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------
export const ROLES: Record<RolUsuario, { label: string; color: string }> = {
    admin: { label: "Administrador", color: "#5c0b8b" },
    recepcionista: { label: "Recepcionista", color: "#0e7490" },
    mecanico: { label: "Mecánico", color: "#43377c" },
    cliente: { label: "Cliente", color: "#15803d" },
};

export const ROL_OPCIONES: { value: RolUsuario; label: string }[] = [
    { value: "admin", label: "Administrador" },
    { value: "recepcionista", label: "Recepcionista" },
    { value: "mecanico", label: "Mecánico" },
    { value: "cliente", label: "Cliente" },
];

// ---------------------------------------------------------------------------
// Estados de la Orden de Trabajo (flujo oficial RF-025)
// ---------------------------------------------------------------------------
export const ESTADOS_ORDEN: Record<EstadoOrden, Opcion<EstadoOrden>> = {
    pendiente_asignacion: { value: "pendiente_asignacion", label: "Pendiente de asignación", color: "warning" },
    recepcion: { value: "recepcion", label: "Recepción", color: "gray" },
    diagnostico: { value: "diagnostico", label: "Diagnóstico", color: "blue" },
    presupuesto_enviado: { value: "presupuesto_enviado", label: "Presupuesto enviado", color: "indigo" },
    presupuesto_aprobado: { value: "presupuesto_aprobado", label: "Presupuesto aprobado", color: "success" },
    presupuesto_rechazado: { value: "presupuesto_rechazado", label: "Presupuesto rechazado", color: "error" },
    en_reparacion: { value: "en_reparacion", label: "En reparación", color: "warning" },
    esperando_repuestos: { value: "esperando_repuestos", label: "Esperando repuestos", color: "orange" },
    control_calidad: { value: "control_calidad", label: "Control de calidad", color: "purple" },
    listo_entrega: { value: "listo_entrega", label: "Listo para entrega", color: "blue" },
    entregado: { value: "entregado", label: "Entregado", color: "success" },
    pagado: { value: "pagado", label: "Pagado", color: "success" },
    cancelado: { value: "cancelado", label: "Cancelado", color: "error" },
};

/** Orden secuencial de estados para el stepper (excluye estados terminales/ramas). */
export const FLUJO_ESTADOS: EstadoOrden[] = [
    "pendiente_asignacion",
    "diagnostico",
    "presupuesto_enviado",
    "presupuesto_aprobado",
    "en_reparacion",
    "control_calidad",
    "listo_entrega",
    "entregado",
    "pagado",
];

export const ESTADO_ORDEN_OPCIONES = Object.values(ESTADOS_ORDEN).map((e) => ({
    value: e.value,
    label: e.label,
}));

// ---------------------------------------------------------------------------
// Prioridad
// ---------------------------------------------------------------------------
export const PRIORIDADES: Record<PrioridadOrden, Opcion<PrioridadOrden>> = {
    baja: { value: "baja", label: "Baja", color: "gray" },
    media: { value: "media", label: "Media", color: "blue" },
    alta: { value: "alta", label: "Alta", color: "warning" },
    urgente: { value: "urgente", label: "Urgente", color: "error" },
};

export const PRIORIDAD_OPCIONES = Object.values(PRIORIDADES).map((p) => ({ value: p.value, label: p.label }));

// ---------------------------------------------------------------------------
// Presupuestos
// ---------------------------------------------------------------------------
export const ESTADOS_PRESUPUESTO: Record<EstadoPresupuesto, Opcion<EstadoPresupuesto>> = {
    borrador: { value: "borrador", label: "Borrador", color: "gray" },
    enviado: { value: "enviado", label: "Enviado", color: "blue" },
    aprobado: { value: "aprobado", label: "Aprobado", color: "success" },
    rechazado: { value: "rechazado", label: "Rechazado", color: "error" },
    vencido: { value: "vencido", label: "Vencido", color: "warning" },
};

// ---------------------------------------------------------------------------
// Citas
// ---------------------------------------------------------------------------
export const ESTADOS_CITA: Record<EstadoCita, Opcion<EstadoCita>> = {
    solicitada: { value: "solicitada", label: "Solicitada", color: "warning" },
    confirmada: { value: "confirmada", label: "Confirmada", color: "success" },
    reprogramada: { value: "reprogramada", label: "Reprogramada", color: "blue" },
    cancelada: { value: "cancelada", label: "Cancelada", color: "error" },
    completada: { value: "completada", label: "Completada", color: "gray" },
    no_asistio: { value: "no_asistio", label: "No asistió", color: "error" },
};

// ---------------------------------------------------------------------------
// Pagos
// ---------------------------------------------------------------------------
export const ESTADOS_PAGO: Record<EstadoPago, Opcion<EstadoPago>> = {
    pendiente: { value: "pendiente", label: "Pendiente", color: "warning" },
    en_revision: { value: "en_revision", label: "En revisión", color: "blue" },
    pagado: { value: "pagado", label: "Pagado", color: "success" },
    anulado: { value: "anulado", label: "Anulado", color: "error" },
};

export const METODOS_PAGO: Record<MetodoPago, string> = {
    efectivo: "Efectivo",
    transferencia: "Transferencia",
    qr: "QR",
    mixto: "Mixto",
};

// ---------------------------------------------------------------------------
// Inventario / Compras
// ---------------------------------------------------------------------------
export const TIPOS_MOVIMIENTO: Record<TipoMovimiento, Opcion<TipoMovimiento>> = {
    entrada: { value: "entrada", label: "Entrada", color: "success" },
    salida: { value: "salida", label: "Salida", color: "error" },
    ajuste: { value: "ajuste", label: "Ajuste", color: "warning" },
    devolucion: { value: "devolucion", label: "Devolución", color: "blue" },
};

export const ESTADOS_COMPRA: Record<EstadoCompra, Opcion<EstadoCompra>> = {
    borrador: { value: "borrador", label: "Borrador", color: "gray" },
    enviada: { value: "enviada", label: "Enviada", color: "blue" },
    recibida_parcial: { value: "recibida_parcial", label: "Recepción parcial", color: "warning" },
    recibida: { value: "recibida", label: "Recibida", color: "success" },
    cancelada: { value: "cancelada", label: "Cancelada", color: "error" },
};

// ---------------------------------------------------------------------------
// Rutas por defecto según el rol
// ---------------------------------------------------------------------------
export const DASHBOARD_POR_ROL: Record<RolUsuario, string> = {
    admin: "/admin",
    recepcionista: "/admin",
    mecanico: "/ordenes",
    cliente: "/cliente/dashboard",
};

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "GaraGato";

/** Minutos de inactividad antes del cierre de sesión. */
export const MINUTOS_INACTIVIDAD = 5;
