import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { VCargaMecanicos, VIngresos, VStockCritico, VTopServicios } from "@/lib/types/database";

/** Servicio de reportes y métricas. */
export const reportesService = {
    /** Ingresos por día. */
    async ingresos(desde?: string, hasta?: string): Promise<VIngresos[]> {
        const supabase = getSupabaseBrowserClient();
        let query = supabase.from("v_ingresos").select("*").order("dia");
        if (desde) query = query.gte("dia", desde);
        if (hasta) query = query.lte("dia", hasta);
        const { data, error } = await query;
        if (error) throw error;
        return data ?? [];
    },

    /** Top 10 de servicios. */
    async topServicios(): Promise<VTopServicios[]> {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.from("v_top_servicios").select("*");
        if (error) throw error;
        return data ?? [];
    },

    /** Stock crítico. */
    async stockCritico(): Promise<VStockCritico[]> {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.from("v_stock_critico").select("*");
        if (error) throw error;
        return data ?? [];
    },

    /** Carga de trabajo por mecánico. */
    async cargaMecanicos(): Promise<VCargaMecanicos[]> {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.from("v_carga_mecanicos").select("*");
        if (error) throw error;
        return data ?? [];
    },

    /** Métricas resumidas para el dashboard de administración. */
    async metricasDashboard() {
        const supabase = getSupabaseBrowserClient();
        const [ordenes, ordenesAbiertas, citasHoy, stockCritico] = await Promise.all([
            supabase.from("ordenes_trabajo").select("id, total, total_pagado, estado, creado_en"),
            supabase
                .from("ordenes_trabajo")
                .select("id", { count: "exact", head: true })
                .not("estado", "in", "(entregado,pagado,cancelado)"),
            supabase
                .from("citas")
                .select("id", { count: "exact", head: true })
                .gte("inicio", new Date().toISOString().slice(0, 10)),
            supabase.from("v_stock_critico").select("id", { count: "exact", head: true }),
        ]);

        const filas = ordenes.data ?? [];
        const ingresoTotal = filas.reduce((acc, o) => acc + Number(o.total_pagado ?? 0), 0);
        const ordenesTotales = filas.length;

        return {
            ingresoTotal,
            ordenesTotales,
            ordenesAbiertas: ordenesAbiertas.count ?? 0,
            citasHoy: citasHoy.count ?? 0,
            stockCriticoCount: stockCritico.count ?? 0,
        };
    },
};
