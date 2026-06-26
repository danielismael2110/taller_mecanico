import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Cliente, OrdenTrabajo, Vehiculo } from "@/lib/types/database";

export interface ListarClientesParams {
    busqueda?: string;
    pagina?: number;
    porPagina?: number;
}

/** Servicio de clientes. */
export const clientesService = {
    async listar({ busqueda, pagina = 1, porPagina = 10 }: ListarClientesParams = {}) {
        const supabase = getSupabaseBrowserClient();
        let query = supabase.from("clientes").select("*", { count: "exact" });

        if (busqueda) {
            query = query.or(
                `nombre.ilike.%${busqueda}%,ci_nit.ilike.%${busqueda}%,telefono.ilike.%${busqueda}%,correo.ilike.%${busqueda}%`,
            );
        }

        const desde = (pagina - 1) * porPagina;
        query = query.order("creado_en", { ascending: false }).range(desde, desde + porPagina - 1);

        const { data, error, count } = await query;
        if (error) throw error;
        return { datos: (data ?? []) as Cliente[], total: count ?? 0 };
    },

    async obtener(id: string): Promise<Cliente> {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.from("clientes").select("*").eq("id", id).single();
        if (error) throw error;
        return data;
    },

    async crear(cliente: Partial<Cliente>): Promise<Cliente> {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.from("clientes").insert(cliente).select().single();
        if (error) throw error;
        return data;
    },

    async actualizar(id: string, cambios: Partial<Cliente>): Promise<Cliente> {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.from("clientes").update(cambios).eq("id", id).select().single();
        if (error) throw error;
        return data;
    },

    /** Vehículos del cliente. */
    async vehiculos(clienteId: string): Promise<Vehiculo[]> {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
            .from("vehiculos")
            .select("*")
            .eq("cliente_id", clienteId)
            .order("creado_en", { ascending: false });
        if (error) throw error;
        return data ?? [];
    },

    /** Historial de OT del cliente. */
    async ordenes(clienteId: string): Promise<OrdenTrabajo[]> {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
            .from("ordenes_trabajo")
            .select("*")
            .eq("cliente_id", clienteId)
            .order("creado_en", { ascending: false });
        if (error) throw error;
        return data ?? [];
    },

    /** Ficha del cliente vinculada al usuario autenticado (portal del cliente). */
    async miFicha(usuarioId: string): Promise<Cliente | null> {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase.from("clientes").select("*").eq("usuario_id", usuarioId).maybeSingle();
        return data;
    },

    /** Lista mínima para selects (id + nombre). */
    async opciones(busqueda?: string) {
        const supabase = getSupabaseBrowserClient();
        let query = supabase.from("clientes").select("id, nombre, telefono, ci_nit").limit(20);
        if (busqueda) query = query.ilike("nombre", `%${busqueda}%`);
        const { data, error } = await query;
        if (error) throw error;
        return data ?? [];
    },
};
