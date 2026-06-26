"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database";

/**
 * Cliente de Supabase para el navegador (componentes "use client").
 * Usa la publishable/anon key; la seguridad real la imponen las políticas RLS.
 */
export function createClient() {
    return createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    );
}

/** Instancia singleton para uso en el cliente. */
let browserClient: ReturnType<typeof createClient> | undefined;

export function getSupabaseBrowserClient() {
    if (!browserClient) {
        browserClient = createClient();
    }
    return browserClient;
}
