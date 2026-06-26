import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Notificacion } from "@/lib/types/database";

/** Servicio de notificaciones in-app. */
export const notificacionesService = {
    async listar(usuarioId: string, limite = 30): Promise<Notificacion[]> {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
            .from("notificaciones")
            .select("*")
            .eq("usuario_id", usuarioId)
            .order("creado_en", { ascending: false })
            .limit(limite);
        if (error) throw error;
        return data ?? [];
    },

    async noLeidas(usuarioId: string): Promise<number> {
        const supabase = getSupabaseBrowserClient();
        const { count, error } = await supabase
            .from("notificaciones")
            .select("id", { count: "exact", head: true })
            .eq("usuario_id", usuarioId)
            .eq("leida", false);
        if (error) return 0;
        return count ?? 0;
    },

    async marcarLeida(id: number) {
        const supabase = getSupabaseBrowserClient();
        const { error } = await supabase.from("notificaciones").update({ leida: true }).eq("id", id);
        if (error) throw error;
    },

    async marcarTodasLeidas(usuarioId: string) {
        const supabase = getSupabaseBrowserClient();
        const { error } = await supabase
            .from("notificaciones")
            .update({ leida: true })
            .eq("usuario_id", usuarioId)
            .eq("leida", false);
        if (error) throw error;
    },

    /** Suscripción en tiempo real a nuevas notificaciones del usuario. */
    suscribir(usuarioId: string, onNueva: (n: Notificacion) => void) {
        const supabase = getSupabaseBrowserClient();
        const canal = supabase
            .channel(`notif-${usuarioId}`)
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "notificaciones", filter: `usuario_id=eq.${usuarioId}` },
                (payload) => onNueva(payload.new as Notificacion),
            )
            .subscribe();
        return () => {
            supabase.removeChannel(canal);
        };
    },
};
