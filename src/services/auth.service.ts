import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Perfil } from "@/lib/types/database";

/** Servicio de autenticación. */
export const authService = {
    async login(correo: string, password: string) {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.auth.signInWithPassword({ email: correo, password });
        if (error) throw error;
        return data;
    },

    /** Registro público de cliente. El trigger crea perfil + ficha de cliente. */
    async register(params: { nombre: string; correo: string; password: string; telefono?: string }) {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.auth.signUp({
            email: params.correo,
            password: params.password,
            options: {
                data: { nombre: params.nombre, telefono: params.telefono ?? null, rol: "cliente" },
                emailRedirectTo: `${window.location.origin}/verify-email`,
            },
        });
        if (error) throw error;
        return data;
    },

    async logout() {
        const supabase = getSupabaseBrowserClient();
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    /** Envía correo de recuperación. */
    async resetPassword(correo: string) {
        const supabase = getSupabaseBrowserClient();
        const { error } = await supabase.auth.resetPasswordForEmail(correo, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
    },

    /** Cambia la contraseña del usuario autenticado. */
    async updatePassword(password: string) {
        const supabase = getSupabaseBrowserClient();
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
    },

    async getUsuarioActual() {
        const supabase = getSupabaseBrowserClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        return user;
    },

    /** Perfil de aplicación (rol, nombre, avatar...). */
    async getPerfil(userId: string): Promise<Perfil | null> {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.from("perfiles").select("*").eq("id", userId).single();
        if (error) return null;
        return data;
    },

    async actualizarPerfil(userId: string, cambios: Partial<Perfil>) {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.from("perfiles").update(cambios).eq("id", userId).select().single();
        if (error) throw error;
        return data;
    },
};
