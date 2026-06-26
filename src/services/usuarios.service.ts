import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Perfil, RolUsuario } from "@/lib/types/database";

/** Gestión de usuarios internos y logs de acceso. */
export const usuariosService = {
    async listar(): Promise<Perfil[]> {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.from("perfiles").select("*").order("creado_en", { ascending: false });
        if (error) throw error;
        return data ?? [];
    },

    /**
     * Crea un usuario interno. El signUp dispara el trigger que crea el perfil.
     * El rol se pasa en la metadata para que `manejar_nuevo_usuario` lo aplique.
     * Nota: en producción esto debería ir por una Edge Function con service_role
     * para no cerrar la sesión del admin. Aquí se documenta la limitación.
     */
    async crear(params: { nombre: string; correo: string; password: string; rol: RolUsuario; telefono?: string }) {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.auth.signUp({
            email: params.correo,
            password: params.password,
            options: { data: { nombre: params.nombre, telefono: params.telefono ?? null, rol: params.rol } },
        });
        if (error) throw error;
        return data;
    },

    async actualizar(id: string, cambios: Partial<Perfil>) {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.from("perfiles").update(cambios).eq("id", id).select().single();
        if (error) throw error;
        return data;
    },

    async desactivar(id: string) {
        return this.actualizar(id, { activo: false });
    },
    async reactivar(id: string) {
        return this.actualizar(id, { activo: true });
    },
    async cambiarRol(id: string, rol: RolUsuario) {
        return this.actualizar(id, { rol });
    },
};
