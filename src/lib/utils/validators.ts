import { z } from "zod";

/** Esquemas de validación (Zod) reutilizados en los formularios con react-hook-form. */

const requerido = (campo: string) => z.string().min(1, `${campo} es obligatorio`);

/** Número opcional que trata "" / null / undefined como ausente (evita que z.coerce lo vuelva 0). */
const numeroOpcional = (schema: z.ZodNumber) =>
    z.preprocess((v) => (v === "" || v === null || v === undefined ? undefined : Number(v)), schema.optional());

// --- Autenticación ---
export const loginSchema = z.object({
    correo: requerido("El correo").email("Correo no válido"),
    password: requerido("La contraseña").min(6, "Mínimo 6 caracteres"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registroSchema = z
    .object({
        nombre: requerido("El nombre"),
        correo: requerido("El correo").email("Correo no válido"),
        telefono: z.string().optional(),
        password: requerido("La contraseña").min(8, "Mínimo 8 caracteres"),
        confirmar: requerido("Confirma la contraseña"),
    })
    .refine((d) => d.password === d.confirmar, {
        message: "Las contraseñas no coinciden",
        path: ["confirmar"],
    });
export type RegistroInput = z.infer<typeof registroSchema>;

export const recuperarSchema = z.object({
    correo: requerido("El correo").email("Correo no válido"),
});

export const nuevaPasswordSchema = z
    .object({
        password: requerido("La contraseña").min(8, "Mínimo 8 caracteres"),
        confirmar: requerido("Confirma la contraseña"),
    })
    .refine((d) => d.password === d.confirmar, {
        message: "Las contraseñas no coinciden",
        path: ["confirmar"],
    });

// --- Clientes ---
export const clienteSchema = z.object({
    nombre: requerido("El nombre"),
    telefono: z.string().optional(),
    correo: z.string().email("Correo no válido").optional().or(z.literal("")),
    ci_nit: z.string().optional(),
    direccion: z.string().optional(),
    notas: z.string().optional(),
});
export type ClienteInput = z.infer<typeof clienteSchema>;

// --- Vehículos ---
export const vehiculoSchema = z.object({
    cliente_id: requerido("El propietario"),
    marca: requerido("La marca"),
    modelo: requerido("El modelo"),
    anio: numeroOpcional(z.number().min(1900, "Año no válido").max(2100, "Año no válido")),
    placa: requerido("La placa"),
    color: z.string().optional(),
    chasis: z.string().optional(),
    motor: z.string().optional(),
    notas: z.string().optional(),
    foto_url: z.string().optional(),
});
export type VehiculoInput = z.infer<typeof vehiculoSchema>;

// --- Orden de trabajo ---
export const ordenSchema = z.object({
    cliente_id: requerido("El cliente"),
    vehiculo_id: requerido("El vehículo"),
    prioridad: z.enum(["baja", "media", "alta", "urgente"]).default("media"),
    problema_reportado: z.string().optional(),
    mecanicos: z.array(z.string()).optional(),
});
export type OrdenInput = z.infer<typeof ordenSchema>;

// --- Repuesto ---
export const repuestoSchema = z.object({
    codigo: requerido("El código"),
    nombre: requerido("El nombre"),
    categoria: z.string().optional(),
    descripcion: z.string().optional(),
    precio_compra: z.coerce.number().min(0).default(0),
    precio_venta: z.coerce.number().min(0).default(0),
    stock: z.coerce.number().min(0).default(0),
    stock_minimo: z.coerce.number().min(0).default(0),
    ubicacion: z.string().optional(),
});
export type RepuestoInput = z.infer<typeof repuestoSchema>;

// --- Proveedor ---
export const proveedorSchema = z.object({
    nombre: requerido("El nombre"),
    nit: z.string().optional(),
    telefono: z.string().optional(),
    correo: z.string().email("Correo no válido").optional().or(z.literal("")),
    direccion: z.string().optional(),
});
export type ProveedorInput = z.infer<typeof proveedorSchema>;

// --- Servicio ---
export const servicioSchema = z.object({
    nombre: requerido("El nombre"),
    descripcion: z.string().optional(),
    precio: z.coerce.number().min(0).default(0),
    tiempo_estimado_min: numeroOpcional(z.number().min(0)),
    categoria: z.string().optional(),
    visible_portal: z.boolean().default(true),
});
export type ServicioInput = z.infer<typeof servicioSchema>;

// --- Contacto público ---
export const contactoSchema = z.object({
    nombre: requerido("El nombre"),
    correo: z.string().email("Correo no válido").optional().or(z.literal("")),
    telefono: z.string().optional(),
    mensaje: requerido("El mensaje").min(10, "Cuéntanos un poco más (mín. 10 caracteres)"),
});
export type ContactoInput = z.infer<typeof contactoSchema>;

// --- Usuario interno ---
export const usuarioSchema = z.object({
    nombre: requerido("El nombre"),
    correo: requerido("El correo").email("Correo no válido"),
    telefono: z.string().optional(),
    rol: z.enum(["admin", "recepcionista", "mecanico"]),
    password: requerido("La contraseña").min(8, "Mínimo 8 caracteres"),
});
export type UsuarioInput = z.infer<typeof usuarioSchema>;

// --- Cita ---
export const citaSchema = z.object({
    vehiculo_id: z.string().optional(),
    mecanico_id: z.string().optional(),
    fecha: requerido("La fecha"),
    hora: requerido("La hora"),
    duracion_min: z.coerce.number().min(15).default(60),
    descripcion: z.string().optional(),
});
export type CitaInput = z.infer<typeof citaSchema>;
