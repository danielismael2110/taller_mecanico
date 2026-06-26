/**
 * Tipos TypeScript del esquema GaraGato (Supabase / PostgreSQL).
 * Reflejan las tablas y ENUM definidos en supabase/migrations/001_initial_schema.sql.
 */

// ---------------------------------------------------------------------------
// ENUMs
// ---------------------------------------------------------------------------
export type RolUsuario = "admin" | "recepcionista" | "mecanico" | "cliente";

export type EstadoOrden =
    | "pendiente_asignacion"
    | "recepcion"
    | "diagnostico"
    | "presupuesto_enviado"
    | "presupuesto_aprobado"
    | "presupuesto_rechazado"
    | "en_reparacion"
    | "esperando_repuestos"
    | "control_calidad"
    | "listo_entrega"
    | "entregado"
    | "pagado"
    | "cancelado";

export type PrioridadOrden = "baja" | "media" | "alta" | "urgente";

export type EstadoAsignacion = "pendiente" | "aceptada" | "rechazada";

export type EstadoPresupuesto = "borrador" | "enviado" | "aprobado" | "rechazado" | "vencido";

export type EstadoCita = "solicitada" | "confirmada" | "reprogramada" | "cancelada" | "completada" | "no_asistio";

export type MetodoPago = "efectivo" | "transferencia" | "qr" | "mixto";

export type EstadoPago = "pendiente" | "en_revision" | "pagado" | "anulado";

export type TipoMovimiento = "entrada" | "salida" | "ajuste" | "devolucion";

export type EstadoCompra = "borrador" | "enviada" | "recibida_parcial" | "recibida" | "cancelada";

export type TipoNotificacion =
    | "presupuesto_aprobado"
    | "presupuesto_rechazado"
    | "comprobante_subido"
    | "stock_critico"
    | "cita_solicitada"
    | "ot_asignada"
    | "cita_asignada"
    | "presupuesto_recibido"
    | "pago_validado"
    | "pago_rechazado"
    | "estado_orden"
    | "cita_confirmada"
    | "cita_reprogramada"
    | "cita_cancelada"
    | "general";

// ---------------------------------------------------------------------------
// Tablas (filas)
// ---------------------------------------------------------------------------
export type Perfil = {
    id: string;
    rol: RolUsuario;
    nombre: string;
    telefono: string | null;
    correo: string | null;
    avatar_url: string | null;
    ci_nit: string | null;
    activo: boolean;
    intentos_fallidos: number;
    bloqueado_hasta: string | null;
    creado_en: string;
    actualizado_en: string;
    creado_por: string | null;
}

export type ConfiguracionTaller = {
    id: number;
    nombre: string;
    direccion: string | null;
    telefono: string | null;
    correo: string | null;
    horario: string | null;
    maps_embed_url: string | null;
    iva_porcentaje: number;
    descuento_max: number;
    moneda: string;
    qr_imagen_url: string | null;
    qr_instrucciones: string | null;
    qr_titular: string | null;
    qr_banco: string | null;
    max_intentos_login: number;
    minutos_inactividad: number;
    color_admin: string | null;
    color_recepcionista: string | null;
    color_mecanico: string | null;
    color_cliente: string | null;
    actualizado_en: string;
    actualizado_por: string | null;
}

export type Cliente = {
    id: string;
    usuario_id: string | null;
    nombre: string;
    telefono: string | null;
    correo: string | null;
    ci_nit: string | null;
    direccion: string | null;
    notas: string | null;
    creado_en: string;
    actualizado_en: string;
    creado_por: string | null;
}

export type Vehiculo = {
    id: string;
    cliente_id: string;
    marca: string;
    modelo: string;
    anio: number | null;
    placa: string;
    color: string | null;
    chasis: string | null;
    motor: string | null;
    foto_url: string | null;
    notas: string | null;
    activo: boolean;
    creado_en: string;
    actualizado_en: string;
    creado_por: string | null;
}

export type Servicio = {
    id: string;
    nombre: string;
    descripcion: string | null;
    precio: number;
    tiempo_estimado_min: number | null;
    categoria: string | null;
    imagen_url: string | null;
    visible_portal: boolean;
    destacado: boolean;
    activo: boolean;
    orden: number;
    creado_en: string;
    actualizado_en: string;
}

export type Proveedor = {
    id: string;
    nombre: string;
    nit: string | null;
    telefono: string | null;
    correo: string | null;
    direccion: string | null;
    activo: boolean;
    creado_en: string;
}

export type OrdenCompra = {
    id: string;
    numero: string | null;
    proveedor_id: string;
    estado: EstadoCompra;
    total: number;
    notas: string | null;
    creado_en: string;
    recibida_en: string | null;
    creado_por: string | null;
}

export type DetalleCompra = {
    id: string;
    orden_compra_id: string;
    repuesto_id: string;
    cantidad: number;
    precio_unitario: number;
    cantidad_recibida: number;
    subtotal: number;
}

export type Repuesto = {
    id: string;
    codigo: string;
    nombre: string;
    categoria: string | null;
    descripcion: string | null;
    precio_compra: number;
    precio_venta: number;
    stock: number;
    stock_minimo: number;
    ubicacion: string | null;
    activo: boolean;
    creado_en: string;
    actualizado_en: string;
}

export type MovimientoInventario = {
    id: number;
    repuesto_id: string;
    tipo: TipoMovimiento;
    cantidad: number;
    stock_anterior: number;
    stock_nuevo: number;
    motivo: string | null;
    orden_id: string | null;
    orden_compra_id: string | null;
    creado_en: string;
    creado_por: string | null;
}

export type OrdenTrabajo = {
    id: string;
    numero: string | null;
    cliente_id: string;
    vehiculo_id: string;
    estado: EstadoOrden;
    prioridad: PrioridadOrden;
    problema_reportado: string | null;
    diagnostico: string | null;
    trabajo_realizado: string | null;
    horas_trabajo: number;
    subtotal_servicios: number;
    subtotal_repuestos: number;
    descuento_porcentaje: number;
    descuento_monto: number;
    iva_porcentaje: number;
    iva_monto: number;
    total: number;
    total_pagado: number;
    cantidad_mecanicos_requeridos: number;
    version: number;
    creado_en: string;
    actualizado_en: string;
    cerrado_en: string | null;
    creado_por: string | null;
}

export type OrdenServicio = {
    id: string;
    orden_id: string;
    servicio_id: string | null;
    descripcion: string;
    precio: number;
    cantidad: number;
    subtotal: number;
}

export type OrdenRepuesto = {
    id: string;
    orden_id: string;
    repuesto_id: string;
    descripcion: string;
    precio: number;
    cantidad: number;
    subtotal: number;
    stock_descontado: boolean;
}

export type HistorialEstadoOrden = {
    id: number;
    orden_id: string;
    estado_anterior: EstadoOrden | null;
    estado_nuevo: EstadoOrden;
    motivo: string | null;
    cambiado_por: string | null;
    creado_en: string;
}

export type AdjuntoOrden = {
    id: string;
    orden_id: string;
    url: string;
    tipo: string | null;
    nombre_archivo: string | null;
    subido_por: string | null;
    creado_en: string;
}

export type Presupuesto = {
    id: string;
    orden_id: string;
    version: number;
    estado: EstadoPresupuesto;
    token_publico: string;
    subtotal_servicios: number;
    subtotal_repuestos: number;
    descuento_monto: number;
    iva_monto: number;
    total: number;
    enviado_en: string | null;
    respondido_en: string | null;
    motivo_rechazo: string | null;
    vigencia_hasta: string | null;
    creado_en: string;
    creado_por: string | null;
}

export type DetallePresupuesto = {
    id: string;
    presupuesto_id: string;
    tipo: "servicio" | "repuesto";
    descripcion: string;
    precio: number;
    cantidad: number;
    subtotal: number;
}

export type Cita = {
    id: string;
    cliente_id: string | null;
    vehiculo_id: string | null;
    mecanico_id: string | null;
    inicio: string;
    fin: string;
    estado: EstadoCita;
    descripcion: string | null;
    creado_en: string;
    creado_por: string | null;
}

export type BloqueoAgenda = {
    id: string;
    mecanico_id: string | null;
    inicio: string;
    fin: string;
    motivo: string | null;
    creado_en: string;
    creado_por: string | null;
}

export type Pago = {
    id: string;
    orden_id: string;
    metodo: MetodoPago;
    estado: EstadoPago;
    monto: number;
    monto_efectivo: number;
    monto_transferencia: number;
    monto_recibido: number | null;
    cambio: number | null;
    comprobante_url: string | null;
    referencia: string | null;
    validado_por: string | null;
    validado_en: string | null;
    motivo_anulacion: string | null;
    creado_en: string;
    creado_por: string | null;
}

export type Boleta = {
    id: string;
    orden_id: string;
    numero: string | null;
    pdf_url: string | null;
    total: number;
    iva_monto: number;
    creado_en: string;
    creado_por: string | null;
}

export type Notificacion = {
    id: number;
    usuario_id: string | null;
    tipo: TipoNotificacion;
    titulo: string;
    mensaje: string | null;
    leida: boolean;
    url: string | null;
    creado_en: string;
}

export type MensajeContacto = {
    id: number;
    nombre: string;
    correo: string | null;
    telefono: string | null;
    mensaje: string;
    atendido: boolean;
    creado_en: string;
}

// ---------------------------------------------------------------------------
// Vistas de reportes
// ---------------------------------------------------------------------------
export type VStockCritico = {
    id: string;
    codigo: string;
    nombre: string;
    categoria: string | null;
    stock: number;
    stock_minimo: number;
    ubicacion: string | null;
}

export type VIngresos = {
    dia: string;
    ingresos: number;
}

export type VTopServicios = {
    id: string;
    nombre: string;
    veces: number;
    total: number;
}

export type VCargaMecanicos = {
    id: string;
    nombre: string;
    ots_asignadas: number;
    horas_totales: number;
}

// ---------------------------------------------------------------------------
// Helper genérico de tabla para el cliente tipado de Supabase
// ---------------------------------------------------------------------------
type TableShape<Row> = {
    Row: Row;
    Insert: Partial<Row>;
    Update: Partial<Row>;
    Relationships: [];
};

type ViewShape<Row> = {
    Row: Row;
    Relationships: [];
};

export type Database = {
    public: {
        Tables: {
            perfiles: TableShape<Perfil>;
            configuracion_taller: TableShape<ConfiguracionTaller>;
            clientes: TableShape<Cliente>;
            vehiculos: TableShape<Vehiculo>;
            servicios: TableShape<Servicio>;
            proveedores: TableShape<Proveedor>;
            ordenes_compra: TableShape<OrdenCompra>;
            detalle_compra: TableShape<DetalleCompra>;
            repuestos: TableShape<Repuesto>;
            movimientos_inventario: TableShape<MovimientoInventario>;
            ordenes_trabajo: TableShape<OrdenTrabajo>;
            orden_mecanicos: TableShape<{ orden_id: string; mecanico_id: string; estado: EstadoAsignacion; respondido_en: string; asignado_en: string }>;
            orden_servicios: TableShape<OrdenServicio>;
            orden_repuestos: TableShape<OrdenRepuesto>;
            historial_estados_orden: TableShape<HistorialEstadoOrden>;
            adjuntos_orden: TableShape<AdjuntoOrden>;
            presupuestos: TableShape<Presupuesto>;
            detalle_presupuesto: TableShape<DetallePresupuesto>;
            citas: TableShape<Cita>;
            bloqueos_agenda: TableShape<BloqueoAgenda>;
            pagos: TableShape<Pago>;
            boletas: TableShape<Boleta>;
            notificaciones: TableShape<Notificacion>;
            mensajes_contacto: TableShape<MensajeContacto>;
        };
        Views: {
            v_stock_critico: ViewShape<VStockCritico>;
            v_vehiculos_con_deuda: ViewShape<{ vehiculo_id: string; placa: string; cliente: string; saldo_pendiente: number }>;
            v_ingresos: ViewShape<VIngresos>;
            v_top_servicios: ViewShape<VTopServicios>;
            v_carga_mecanicos: ViewShape<VCargaMecanicos>;
        };
        Functions: {
            ajustar_stock: {
                Args: { p_repuesto: string; p_nuevo_stock: number; p_motivo: string };
                Returns: undefined;
            };
            recibir_item_compra: {
                Args: { p_item: string; p_cantidad: number };
                Returns: undefined;
            };
        };
        Enums: {
            rol_usuario: RolUsuario;
            estado_orden: EstadoOrden;
            prioridad_orden: PrioridadOrden;
            estado_presupuesto: EstadoPresupuesto;
            estado_cita: EstadoCita;
            metodo_pago: MetodoPago;
            estado_pago: EstadoPago;
            tipo_movimiento: TipoMovimiento;
            estado_compra: EstadoCompra;
            tipo_notificacion: TipoNotificacion;
        };
    };
}
