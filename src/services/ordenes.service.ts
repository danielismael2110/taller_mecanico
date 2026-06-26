import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
    AdjuntoOrden,
    EstadoOrden,
    HistorialEstadoOrden,
    OrdenRepuesto,
    OrdenServicio,
    OrdenTrabajo,
    PrioridadOrden,
} from "@/lib/types/database";

export interface ListarOrdenesParams {
    estado?: EstadoOrden;
    prioridad?: PrioridadOrden;
    busqueda?: string;
    clienteId?: string;
    mecanicoId?: string;
    desde?: string;
    hasta?: string;
    pagina?: number;
    porPagina?: number;
}

/** Servicio de Órdenes de Trabajo. */
export const ordenesService = {
    async listar({
        estado,
        prioridad,
        busqueda,
        clienteId,
        desde,
        hasta,
        pagina = 1,
        porPagina = 10,
    }: ListarOrdenesParams = {}) {
        const supabase = getSupabaseBrowserClient();
        let query = supabase
            .from("ordenes_trabajo")
            .select("*, cliente:clientes(nombre), vehiculo:vehiculos(marca, modelo, placa)", { count: "exact" });

        if (estado) query = query.eq("estado", estado);
        if (prioridad) query = query.eq("prioridad", prioridad);
        if (clienteId) query = query.eq("cliente_id", clienteId);
        if (busqueda) query = query.ilike("numero", `%${busqueda}%`);
        if (desde) query = query.gte("creado_en", desde);
        if (hasta) query = query.lte("creado_en", hasta);

        const inicio = (pagina - 1) * porPagina;
        query = query.order("creado_en", { ascending: false }).range(inicio, inicio + porPagina - 1);

        const { data, error, count } = await query;
        if (error) throw error;
        return { datos: data ?? [], total: count ?? 0 };
    },

    async obtener(id: string) {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
            .from("ordenes_trabajo")
            .select(
                "*, cliente:clientes(*), vehiculo:vehiculos(*), mecanicos:orden_mecanicos(mecanico_id, estado, perfiles(id, nombre))",
            )
            .eq("id", id)
            .single();
        if (error) throw error;
        return data;
    },

    /** Asignaciones de mecánicos de una OT con su estado y nombre (flujo aceptar/rechazar). */
    async asignaciones(ordenId: string) {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
            .from("orden_mecanicos")
            .select("mecanico_id, estado, respondido_en, perfiles(nombre)")
            .eq("orden_id", ordenId);
        if (error) throw error;
        return (data ?? []) as unknown as {
            mecanico_id: string;
            estado: "pendiente" | "aceptada" | "rechazada";
            respondido_en: string;
            perfiles?: { nombre?: string } | null;
        }[];
    },

    /** El mecánico acepta la orden (queda asignado). El trigger avanza la OT si se completa. */
    async aceptarAsignacion(ordenId: string, mecanicoId: string) {
        const supabase = getSupabaseBrowserClient();
        const { error } = await supabase
            .from("orden_mecanicos")
            .upsert({ orden_id: ordenId, mecanico_id: mecanicoId, estado: "aceptada", respondido_en: new Date().toISOString() });
        if (error) throw error;
    },

    /** El mecánico rechaza la orden (no queda asignado). */
    async rechazarAsignacion(ordenId: string, mecanicoId: string) {
        const supabase = getSupabaseBrowserClient();
        const { error } = await supabase
            .from("orden_mecanicos")
            .upsert({ orden_id: ordenId, mecanico_id: mecanicoId, estado: "rechazada", respondido_en: new Date().toISOString() });
        if (error) throw error;
    },

    async crear(orden: Partial<OrdenTrabajo>, mecanicoIds: string[] = []) {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.from("ordenes_trabajo").insert(orden).select().single();
        if (error) throw error;
        if (mecanicoIds.length) await this.asignarMecanicos(data.id, mecanicoIds);
        return data;
    },

    async actualizar(id: string, cambios: Partial<OrdenTrabajo>) {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.from("ordenes_trabajo").update(cambios).eq("id", id).select().single();
        if (error) throw error;
        return data;
    },

    /** Cambia el estado con motivo. version: bloqueo optimista. */
    async cambiarEstado(id: string, estado: EstadoOrden, version: number) {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
            .from("ordenes_trabajo")
            .update({ estado, version })
            .eq("id", id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async asignarMecanicos(ordenId: string, mecanicoIds: string[]) {
        const supabase = getSupabaseBrowserClient();
        const filas = mecanicoIds.map((mecanico_id) => ({ orden_id: ordenId, mecanico_id }));
        const { error } = await supabase.from("orden_mecanicos").upsert(filas);
        if (error) throw error;
    },

    async quitarMecanico(ordenId: string, mecanicoId: string) {
        const supabase = getSupabaseBrowserClient();
        const { error } = await supabase
            .from("orden_mecanicos")
            .delete()
            .eq("orden_id", ordenId)
            .eq("mecanico_id", mecanicoId);
        if (error) throw error;
    },

    // --- Servicios de la OT ---
    async servicios(ordenId: string): Promise<OrdenServicio[]> {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.from("orden_servicios").select("*").eq("orden_id", ordenId);
        if (error) throw error;
        return data ?? [];
    },
    async agregarServicio(servicio: Partial<OrdenServicio>) {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.from("orden_servicios").insert(servicio).select().single();
        if (error) throw error;
        return data;
    },
    async eliminarServicio(id: string) {
        const supabase = getSupabaseBrowserClient();
        const { error } = await supabase.from("orden_servicios").delete().eq("id", id);
        if (error) throw error;
    },

    // --- Repuestos de la OT (descuenta stock automáticamente, RF-028) ---
    async repuestos(ordenId: string): Promise<OrdenRepuesto[]> {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.from("orden_repuestos").select("*").eq("orden_id", ordenId);
        if (error) throw error;
        return data ?? [];
    },
    async agregarRepuesto(repuesto: Partial<OrdenRepuesto>) {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.from("orden_repuestos").insert(repuesto).select().single();
        if (error) throw error;
        return data;
    },
    async eliminarRepuesto(id: string) {
        const supabase = getSupabaseBrowserClient();
        const { error } = await supabase.from("orden_repuestos").delete().eq("id", id);
        if (error) throw error;
    },

    // --- Historial / timeline ---
    async historial(ordenId: string): Promise<HistorialEstadoOrden[]> {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
            .from("historial_estados_orden")
            .select("*, perfil:perfiles!historial_estados_orden_cambiado_por_fkey(nombre)")
            .eq("orden_id", ordenId)
            .order("creado_en", { ascending: true });
        if (error) {
            // Fallback sin join si la FK con nombre difiere
            const r = await supabase
                .from("historial_estados_orden")
                .select("*")
                .eq("orden_id", ordenId)
                .order("creado_en", { ascending: true });
            return r.data ?? [];
        }
        return (data ?? []) as unknown as HistorialEstadoOrden[];
    },

    // --- Adjuntos ---
    async adjuntos(ordenId: string): Promise<AdjuntoOrden[]> {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.from("adjuntos_orden").select("*").eq("orden_id", ordenId);
        if (error) throw error;
        return data ?? [];
    },
    async subirAdjunto(ordenId: string, file: File) {
        const supabase = getSupabaseBrowserClient();
        const ext = file.name.split(".").pop();
        const path = `${ordenId}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("adjuntos-ot").upload(path, file);
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("adjuntos-ot").getPublicUrl(path);
        const tipo = file.type.startsWith("image/") ? "imagen" : "documento";
        const { data: row, error } = await supabase
            .from("adjuntos_orden")
            .insert({ orden_id: ordenId, url: data.publicUrl, tipo, nombre_archivo: file.name })
            .select()
            .single();
        if (error) throw error;
        return row;
    },

    /** Mecánicos disponibles para asignar. */
    async mecanicos() {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
            .from("perfiles")
            .select("id, nombre")
            .eq("rol", "mecanico")
            .eq("activo", true);
        if (error) throw error;
        return data ?? [];
    },
};
