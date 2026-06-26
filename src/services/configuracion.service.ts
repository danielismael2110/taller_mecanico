import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ConfiguracionTaller, MensajeContacto } from "@/lib/types/database";

/** Configuración del taller: IVA, QR, info pública, contacto. */
export const configuracionService = {
    async obtener(): Promise<ConfiguracionTaller> {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.from("configuracion_taller").select("*").eq("id", 1).single();
        if (error) throw error;
        return data;
    },

    async actualizar(cambios: Partial<ConfiguracionTaller>) {
        const supabase = getSupabaseBrowserClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        const { data, error } = await supabase
            .from("configuracion_taller")
            .update({ ...cambios, actualizado_en: new Date().toISOString(), actualizado_por: user?.id ?? null })
            .eq("id", 1)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /** Sube la imagen del QR estático. */
    async subirQR(file: File): Promise<string> {
        const supabase = getSupabaseBrowserClient();
        const ext = file.name.split(".").pop();
        const path = `qr/qr-taller-${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from("avatares").upload(path, file, { upsert: true });
        if (error) throw error;
        const { data } = supabase.storage.from("avatares").getPublicUrl(path);
        await this.actualizar({ qr_imagen_url: data.publicUrl });
        return data.publicUrl;
    },

    // --- Mensajes de contacto público ---
    async enviarContacto(mensaje: Partial<MensajeContacto>) {
        const supabase = getSupabaseBrowserClient();
        const { error } = await supabase.from("mensajes_contacto").insert(mensaje);
        if (error) throw error;
    },

    async mensajesContacto(): Promise<MensajeContacto[]> {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
            .from("mensajes_contacto")
            .select("*")
            .order("creado_en", { ascending: false });
        if (error) throw error;
        return data ?? [];
    },
};
