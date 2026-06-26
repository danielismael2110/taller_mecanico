import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { BloqueoAgenda, Cita, EstadoCita } from "@/lib/types/database";

/** Horario laboral por defecto del taller (para calcular disponibilidad). */
const HORA_APERTURA = 8;
const HORA_CIERRE = 18;

/** Servicio de citas y agenda. */
export const citasService = {
    async listar(desde?: string, hasta?: string) {
        const supabase = getSupabaseBrowserClient();
        let query = supabase
            .from("citas")
            .select("*, cliente:clientes(nombre), vehiculo:vehiculos(marca, modelo, placa), mecanico:perfiles(nombre)")
            .order("inicio", { ascending: true });
        if (desde) query = query.gte("inicio", desde);
        if (hasta) query = query.lte("inicio", hasta);
        const { data, error } = await query;
        if (error) throw error;
        return data ?? [];
    },

    async obtener(id: string) {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
            .from("citas")
            .select("*, cliente:clientes(nombre), vehiculo:vehiculos(marca, modelo, placa), mecanico:perfiles(nombre)")
            .eq("id", id)
            .single();
        if (error) throw error;
        return data;
    },

    async crear(cita: Partial<Cita>): Promise<Cita> {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.from("citas").insert(cita).select().single();
        if (error) throw error;
        return data;
    },

    async cambiarEstado(id: string, estado: EstadoCita) {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.from("citas").update({ estado }).eq("id", id).select().single();
        if (error) throw error;
        return data;
    },

    async reprogramar(id: string, inicio: string, fin: string) {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
            .from("citas")
            .update({ inicio, fin, estado: "reprogramada" })
            .eq("id", id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /**
     * Devuelve TODOS los slots de 30 min del día con su disponibilidad,
     * indicando el motivo cuando no están disponibles (ocupado / pasado / cierre).
     */
    async slotsDelDia(
        fecha: string,
        mecanicoId?: string,
        duracionMin = 30,
    ): Promise<{ hora: string; disponible: boolean; motivo?: "ocupado" | "pasado" | "cierre" }[]> {
        const supabase = getSupabaseBrowserClient();
        const inicioDia = new Date(`${fecha}T00:00:00`);
        const finDia = new Date(`${fecha}T23:59:59`);

        let citasQuery = supabase
            .from("citas")
            .select("inicio, fin, mecanico_id")
            .gte("inicio", inicioDia.toISOString())
            .lte("inicio", finDia.toISOString())
            .not("estado", "in", "(cancelada,no_asistio)");
        if (mecanicoId) citasQuery = citasQuery.eq("mecanico_id", mecanicoId);

        const bloqueosQuery = supabase
            .from("bloqueos_agenda")
            .select("inicio, fin, mecanico_id")
            .lte("inicio", finDia.toISOString())
            .gte("fin", inicioDia.toISOString());

        const [{ data: citas }, { data: bloqueos }] = await Promise.all([citasQuery, bloqueosQuery]);

        const ocupados = [
            ...(citas ?? []).map((c) => ({ inicio: new Date(c.inicio), fin: new Date(c.fin) })),
            ...(bloqueos ?? [])
                .filter((b) => !mecanicoId || b.mecanico_id === null || b.mecanico_id === mecanicoId)
                .map((b) => ({ inicio: new Date(b.inicio), fin: new Date(b.fin) })),
        ];

        const slots: { hora: string; disponible: boolean; motivo?: "ocupado" | "pasado" | "cierre" }[] = [];
        const cierre = new Date(`${fecha}T${String(HORA_CIERRE).padStart(2, "0")}:00:00`);
        for (let min = HORA_APERTURA * 60; min < HORA_CIERRE * 60; min += 30) {
            const hh = String(Math.floor(min / 60)).padStart(2, "0");
            const mm = String(min % 60).padStart(2, "0");
            const hora = `${hh}:${mm}`;
            const slotInicio = new Date(`${fecha}T${hh}:${mm}:00`);
            const slotFin = new Date(slotInicio.getTime() + duracionMin * 60 * 1000);

            if (slotFin > cierre) {
                slots.push({ hora, disponible: false, motivo: "cierre" });
            } else if (slotInicio.getTime() < Date.now()) {
                slots.push({ hora, disponible: false, motivo: "pasado" });
            } else if (ocupados.some((o) => slotInicio < o.fin && slotFin > o.inicio)) {
                slots.push({ hora, disponible: false, motivo: "ocupado" });
            } else {
                slots.push({ hora, disponible: true });
            }
        }
        return slots;
    },

    /** Solo las horas disponibles (compatibilidad). */
    async horariosDisponibles(fecha: string, mecanicoId?: string, duracionMin = 30): Promise<string[]> {
        const slots = await this.slotsDelDia(fecha, mecanicoId, duracionMin);
        return slots.filter((s) => s.disponible).map((s) => s.hora);
    },

    // --- Bloqueos de agenda ---
    async bloqueos(): Promise<BloqueoAgenda[]> {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.from("bloqueos_agenda").select("*").order("inicio", { ascending: false });
        if (error) throw error;
        return data ?? [];
    },
    async crearBloqueo(bloqueo: Partial<BloqueoAgenda>) {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.from("bloqueos_agenda").insert(bloqueo).select().single();
        if (error) throw error;
        return data;
    },
    async eliminarBloqueo(id: string) {
        const supabase = getSupabaseBrowserClient();
        const { error } = await supabase.from("bloqueos_agenda").delete().eq("id", id);
        if (error) throw error;
    },
};
