import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Servicio } from "@/lib/types/database";

/** Catálogo de servicios. */
export const serviciosService = {
    async listar(soloVisibles = false): Promise<Servicio[]> {
        const supabase = getSupabaseBrowserClient();
        let query = supabase.from("servicios").select("*").order("orden").order("nombre");
        if (soloVisibles) query = query.eq("visible_portal", true).eq("activo", true);
        const { data, error } = await query;
        if (error) throw error;
        return data ?? [];
    },

    async crear(servicio: Partial<Servicio>) {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.from("servicios").insert(servicio).select().single();
        if (error) throw error;
        return data;
    },

    async actualizar(id: string, cambios: Partial<Servicio>) {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.from("servicios").update(cambios).eq("id", id).select().single();
        if (error) throw error;
        return data;
    },

    async eliminar(id: string) {
        const supabase = getSupabaseBrowserClient();
        const { error } = await supabase.from("servicios").delete().eq("id", id);
        if (error) throw error;
    },

    /** Servicios destacados para el inicio. Si no hay marcados, devuelve los primeros visibles. */
    async destacados(limite = 6): Promise<Servicio[]> {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase
            .from("servicios")
            .select("*")
            .eq("visible_portal", true)
            .eq("activo", true)
            .eq("destacado", true)
            .order("orden")
            .limit(limite);
        if (data && data.length > 0) return data;
        // Respaldo: si nadie marcó destacados, muestra algunos visibles.
        const visibles = await this.listar(true);
        return visibles.slice(0, limite);
    },

    /** Sube la imagen del servicio al bucket público y devuelve la URL. */
    async subirImagen(file: File): Promise<string> {
        const supabase = getSupabaseBrowserClient();
        const ext = file.name.split(".").pop();
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("servicios").upload(path, file, { upsert: true });
        if (error) throw error;
        const { data } = supabase.storage.from("servicios").getPublicUrl(path);
        return data.publicUrl;
    },

    /** Opciones para selects (id + nombre + precio). */
    async opciones() {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
            .from("servicios")
            .select("id, nombre, precio, tiempo_estimado_min")
            .eq("activo", true)
            .order("nombre");
        if (error) throw error;
        return data ?? [];
    },
};
