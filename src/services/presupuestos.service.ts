import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { DetallePresupuesto, Presupuesto } from "@/lib/types/database";

/** Servicio de presupuestos. */
export const presupuestosService = {
    async listar(estado?: import("@/lib/types/database").EstadoPresupuesto) {
        const supabase = getSupabaseBrowserClient();
        let query = supabase
            .from("presupuestos")
            .select("*, orden:ordenes_trabajo(numero, cliente:clientes(nombre))")
            .order("creado_en", { ascending: false });
        if (estado) query = query.eq("estado", estado);
        const { data, error } = await query;
        if (error) throw error;
        return data ?? [];
    },

    async obtener(id: string) {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
            .from("presupuestos")
            .select(
                "*, orden:ordenes_trabajo(numero, total, problema_reportado, diagnostico, vehiculo:vehiculos(marca, modelo, placa), cliente:clientes(nombre, correo))",
            )
            .eq("id", id)
            .single();
        if (error) throw error;
        return data;
    },

    async detalle(presupuestoId: string): Promise<DetallePresupuesto[]> {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.from("detalle_presupuesto").select("*").eq("presupuesto_id", presupuestoId);
        if (error) throw error;
        return data ?? [];
    },

    /** Genera presupuesto desde la OT con sus líneas. */
    async generarDesdeOrden(ordenId: string) {
        const supabase = getSupabaseBrowserClient();
        const { data: orden, error: e1 } = await supabase.from("ordenes_trabajo").select("*").eq("id", ordenId).single();
        if (e1) throw e1;

        const { count } = await supabase
            .from("presupuestos")
            .select("id", { count: "exact", head: true })
            .eq("orden_id", ordenId);
        const version = (count ?? 0) + 1;

        const { data: presu, error } = await supabase
            .from("presupuestos")
            .insert({
                orden_id: ordenId,
                version,
                estado: "borrador",
                subtotal_servicios: orden.subtotal_servicios,
                subtotal_repuestos: orden.subtotal_repuestos,
                descuento_monto: orden.descuento_monto,
                iva_monto: orden.iva_monto,
                total: orden.total,
            })
            .select()
            .single();
        if (error) throw error;

        // Copiar líneas (snapshot)
        const [servicios, repuestos] = await Promise.all([
            supabase.from("orden_servicios").select("*").eq("orden_id", ordenId),
            supabase.from("orden_repuestos").select("*").eq("orden_id", ordenId),
        ]);
        const lineas = [
            ...(servicios.data ?? []).map((s) => ({
                presupuesto_id: presu.id,
                tipo: "servicio" as const,
                descripcion: s.descripcion,
                precio: s.precio,
                cantidad: s.cantidad,
            })),
            ...(repuestos.data ?? []).map((r) => ({
                presupuesto_id: presu.id,
                tipo: "repuesto" as const,
                descripcion: r.descripcion,
                precio: r.precio,
                cantidad: r.cantidad,
            })),
        ];
        if (lineas.length) await supabase.from("detalle_presupuesto").insert(lineas);
        return presu;
    },

    /** Marca el presupuesto como enviado. El trigger notifica al cliente. */
    async enviar(id: string) {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
            .from("presupuestos")
            .update({ estado: "enviado", enviado_en: new Date().toISOString() })
            .eq("id", id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /** El cliente aprueba. El trigger cambia el estado de la OT. */
    async aprobar(id: string) {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
            .from("presupuestos")
            .update({ estado: "aprobado", respondido_en: new Date().toISOString() })
            .eq("id", id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /** El cliente rechaza con motivo obligatorio. */
    async rechazar(id: string, motivo: string) {
        if (!motivo?.trim()) throw new Error("El motivo es obligatorio para rechazar.");
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
            .from("presupuestos")
            .update({ estado: "rechazado", motivo_rechazo: motivo, respondido_en: new Date().toISOString() })
            .eq("id", id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /** Versiones de un presupuesto por OT. */
    async versiones(ordenId: string): Promise<Presupuesto[]> {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
            .from("presupuestos")
            .select("*")
            .eq("orden_id", ordenId)
            .order("version", { ascending: false });
        if (error) throw error;
        return data ?? [];
    },
};
