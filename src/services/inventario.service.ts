import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { MovimientoInventario, OrdenCompra, Proveedor, Repuesto, VStockCritico } from "@/lib/types/database";

/** Servicio de inventario: repuestos, movimientos, proveedores y compras. */
export const inventarioService = {
    // --- Repuestos ---
    async listar(busqueda?: string, soloActivos = true) {
        const supabase = getSupabaseBrowserClient();
        let query = supabase.from("repuestos").select("*").order("nombre");
        if (soloActivos) query = query.eq("activo", true);
        if (busqueda) query = query.or(`nombre.ilike.%${busqueda}%,codigo.ilike.%${busqueda}%,categoria.ilike.%${busqueda}%`);
        const { data, error } = await query;
        if (error) throw error;
        return (data ?? []) as Repuesto[];
    },

    async obtener(id: string): Promise<Repuesto> {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.from("repuestos").select("*").eq("id", id).single();
        if (error) throw error;
        return data;
    },

    async crear(repuesto: Partial<Repuesto>): Promise<Repuesto> {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.from("repuestos").insert(repuesto).select().single();
        if (error) throw error;
        return data;
    },

    async actualizar(id: string, cambios: Partial<Repuesto>): Promise<Repuesto> {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.from("repuestos").update(cambios).eq("id", id).select().single();
        if (error) throw error;
        return data;
    },

    /** Ajuste manual de stock con motivo obligatorio. Usa la función SQL. */
    async ajustarStock(repuestoId: string, nuevoStock: number, motivo: string) {
        const supabase = getSupabaseBrowserClient();
        const { error } = await supabase.rpc("ajustar_stock", {
            p_repuesto: repuestoId,
            p_nuevo_stock: nuevoStock,
            p_motivo: motivo,
        });
        if (error) throw error;
    },

    /** Historial de movimientos de un repuesto. */
    async movimientos(repuestoId: string): Promise<MovimientoInventario[]> {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
            .from("movimientos_inventario")
            .select("*")
            .eq("repuesto_id", repuestoId)
            .order("creado_en", { ascending: false });
        if (error) throw error;
        return data ?? [];
    },

    /** Repuestos en stock crítico. */
    async stockCritico(): Promise<VStockCritico[]> {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.from("v_stock_critico").select("*");
        if (error) throw error;
        return data ?? [];
    },

    /** Lista para selects (id + nombre + precio + stock). */
    async opciones(busqueda?: string) {
        const supabase = getSupabaseBrowserClient();
        let query = supabase.from("repuestos").select("id, nombre, codigo, precio_venta, stock").eq("activo", true).limit(20);
        if (busqueda) query = query.ilike("nombre", `%${busqueda}%`);
        const { data, error } = await query;
        if (error) throw error;
        return data ?? [];
    },

    // --- Proveedores ---
    async proveedores(): Promise<Proveedor[]> {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.from("proveedores").select("*").eq("activo", true).order("nombre");
        if (error) throw error;
        return data ?? [];
    },
    async crearProveedor(proveedor: Partial<Proveedor>) {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.from("proveedores").insert(proveedor).select().single();
        if (error) throw error;
        return data;
    },
    async actualizarProveedor(id: string, cambios: Partial<Proveedor>) {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.from("proveedores").update(cambios).eq("id", id).select().single();
        if (error) throw error;
        return data;
    },

    // --- Compras ---
    async compras(): Promise<OrdenCompra[]> {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
            .from("ordenes_compra")
            .select("*, proveedor:proveedores(nombre)")
            .order("creado_en", { ascending: false });
        if (error) throw error;
        return (data ?? []) as unknown as OrdenCompra[];
    },
    async crearCompra(compra: Partial<OrdenCompra>, items: { repuesto_id: string; cantidad: number; precio_unitario: number }[]) {
        const supabase = getSupabaseBrowserClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        const { data: oc, error } = await supabase
            .from("ordenes_compra")
            .insert({ ...compra, creado_por: user?.id ?? null })
            .select()
            .single();
        if (error) throw error;
        if (items.length) {
            const filas = items.map((i) => ({ ...i, orden_compra_id: oc.id }));
            const { error: e2 } = await supabase.from("detalle_compra").insert(filas);
            if (e2) throw e2;
        }
        return oc;
    },
    async compra(id: string) {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
            .from("ordenes_compra")
            .select("*, proveedor:proveedores(nombre, nit)")
            .eq("id", id)
            .single();
        if (error) throw error;
        return data;
    },
    async detalleCompra(ocId: string) {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
            .from("detalle_compra")
            .select("*, repuesto:repuestos(nombre, codigo)")
            .eq("orden_compra_id", ocId);
        if (error) throw error;
        return (data ?? []) as unknown as {
            id: string;
            cantidad: number;
            cantidad_recibida: number;
            precio_unitario: number;
            subtotal: number;
            repuesto?: { nombre?: string; codigo?: string } | null;
        }[];
    },
    /** Cambia el estado de la orden de compra (borrador → enviada → recibida...). */
    async cambiarEstadoCompra(id: string, estado: import("@/lib/types/database").EstadoCompra) {
        const supabase = getSupabaseBrowserClient();
        const cambios: Partial<OrdenCompra> = { estado };
        if (estado === "recibida") cambios.recibida_en = new Date().toISOString();
        const { data, error } = await supabase.from("ordenes_compra").update(cambios).eq("id", id).select().single();
        if (error) throw error;
        return data;
    },
    /** Recibe un ítem de compra y aumenta stock. */
    async recibirItem(itemId: string, cantidad: number) {
        const supabase = getSupabaseBrowserClient();
        const { error } = await supabase.rpc("recibir_item_compra", { p_item: itemId, p_cantidad: cantidad });
        if (error) throw error;
    },
};
