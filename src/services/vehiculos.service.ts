import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { OrdenTrabajo, Vehiculo } from "@/lib/types/database";

/** Servicio de vehículos. */
export const vehiculosService = {
    async listar(busqueda?: string): Promise<Vehiculo[]> {
        const supabase = getSupabaseBrowserClient();
        let query = supabase.from("vehiculos").select("*").eq("activo", true).order("creado_en", { ascending: false });
        if (busqueda) query = query.or(`placa.ilike.%${busqueda}%,marca.ilike.%${busqueda}%,modelo.ilike.%${busqueda}%`);
        const { data, error } = await query;
        if (error) throw error;
        return data ?? [];
    },

    async obtener(id: string): Promise<Vehiculo> {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.from("vehiculos").select("*").eq("id", id).single();
        if (error) throw error;
        return data;
    },

    async crear(vehiculo: Partial<Vehiculo>): Promise<Vehiculo> {
        const supabase = getSupabaseBrowserClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        const { data, error } = await supabase
            .from("vehiculos")
            .insert({ ...vehiculo, creado_por: user?.id ?? null })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /** Sube una foto al bucket público de vehículos y devuelve su URL. */
    async subirFotoArchivo(file: File): Promise<string> {
        const supabase = getSupabaseBrowserClient();
        const ext = file.name.split(".").pop();
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("vehiculos").upload(path, file, { upsert: true });
        if (error) throw error;
        const { data } = supabase.storage.from("vehiculos").getPublicUrl(path);
        return data.publicUrl;
    },

    async actualizar(id: string, cambios: Partial<Vehiculo>): Promise<Vehiculo> {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.from("vehiculos").update(cambios).eq("id", id).select().single();
        if (error) throw error;
        return data;
    },

    async desactivar(id: string) {
        return this.actualizar(id, { activo: false });
    },

    /** Historial completo de OT del vehículo. */
    async ordenes(vehiculoId: string): Promise<OrdenTrabajo[]> {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
            .from("ordenes_trabajo")
            .select("*")
            .eq("vehiculo_id", vehiculoId)
            .order("creado_en", { ascending: false });
        if (error) throw error;
        return data ?? [];
    },

    /** Alerta de deudas pendientes del vehículo. */
    async deudaPendiente(vehiculoId: string): Promise<number> {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
            .from("v_vehiculos_con_deuda")
            .select("saldo_pendiente")
            .eq("vehiculo_id", vehiculoId)
            .maybeSingle();
        if (error) return 0;
        return data?.saldo_pendiente ?? 0;
    },

    /** Sube foto del vehículo al bucket público. */
    async subirFoto(vehiculoId: string, file: File): Promise<string> {
        const supabase = getSupabaseBrowserClient();
        const ext = file.name.split(".").pop();
        const path = `${vehiculoId}/${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from("vehiculos").upload(path, file, { upsert: true });
        if (error) throw error;
        const { data } = supabase.storage.from("vehiculos").getPublicUrl(path);
        await this.actualizar(vehiculoId, { foto_url: data.publicUrl });
        return data.publicUrl;
    },
};
