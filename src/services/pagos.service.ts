import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Pago } from "@/lib/types/database";

/** Servicio de pagos y comprobantes. */
export const pagosService = {
    async listar(estado?: import("@/lib/types/database").EstadoPago) {
        const supabase = getSupabaseBrowserClient();
        let query = supabase
            .from("pagos")
            .select("*, orden:ordenes_trabajo(numero, total, cliente:clientes(nombre))")
            .order("creado_en", { ascending: false });
        if (estado) query = query.eq("estado", estado);
        const { data, error } = await query;
        if (error) throw error;
        return data ?? [];
    },

    async obtener(id: string) {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
            .from("pagos")
            .select("*, orden:ordenes_trabajo(numero, total, cliente:clientes(nombre))")
            .eq("id", id)
            .single();
        if (error) throw error;
        return data;
    },

    async porOrden(ordenId: string): Promise<Pago[]> {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
            .from("pagos")
            .select("*")
            .eq("orden_id", ordenId)
            .order("creado_en", { ascending: false });
        if (error) throw error;
        return data ?? [];
    },

    /** Registra pago en efectivo / mixto. */
    async registrar(pago: Partial<Pago>): Promise<Pago> {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.from("pagos").insert(pago).select().single();
        if (error) throw error;
        return data;
    },

    /** Cliente sube comprobante. El trigger notifica al taller. */
    async subirComprobante(pagoId: string, file: File): Promise<string> {
        const supabase = getSupabaseBrowserClient();
        const ext = file.name.split(".").pop();
        const path = `${pagoId}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("comprobantes").upload(path, file);
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("comprobantes").getPublicUrl(path);
        const { error } = await supabase
            .from("pagos")
            .update({ comprobante_url: data.publicUrl, estado: "en_revision" })
            .eq("id", pagoId);
        if (error) throw error;
        return data.publicUrl;
    },

    /** Valida comprobante: Pagado. El trigger marca la OT si se cubre el total. */
    async validar(pagoId: string, validadoPor: string) {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
            .from("pagos")
            .update({ estado: "pagado", validado_por: validadoPor, validado_en: new Date().toISOString() })
            .eq("id", pagoId)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /** Anula comprobante con motivo. */
    async anular(pagoId: string, motivo: string) {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
            .from("pagos")
            .update({ estado: "anulado", motivo_anulacion: motivo })
            .eq("id", pagoId)
            .select()
            .single();
        if (error) throw error;
        return data;
    },
};
