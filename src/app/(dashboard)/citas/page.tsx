"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar as CalendarIcon, Lock01, Plus } from "@untitledui/icons";
import { Calendar, dateFnsLocalizer, type View } from "react-big-calendar";
import { format, getDay, parse, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import { ESTADOS_CITA } from "@/lib/constants";
import type { EstadoCita } from "@/lib/types/database";
import { mensajeError } from "@/lib/utils/error-handler";
import { citasService } from "@/services/citas.service";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: () => startOfWeek(new Date(), { locale: es }),
    getDay,
    locales: { es },
});

const COLOR_ESTADO: Record<EstadoCita, string> = {
    solicitada: "#b45309",
    confirmada: "#15803d",
    reprogramada: "#0e7490",
    cancelada: "#be123c",
    completada: "#475467",
    no_asistio: "#be123c",
};

interface Evento {
    id: string;
    title: string;
    start: Date;
    end: Date;
    estado: EstadoCita;
}

export default function CitasPage() {
    const router = useRouter();
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [cargando, setCargando] = useState(true);
    const [vista, setVista] = useState<View>("week");
    const [fecha, setFecha] = useState(new Date());

    useEffect(() => {
        citasService
            .listar()
            .then((citas) =>
                setEventos(
                    citas.map((c) => {
                        const cita = c as unknown as {
                            id: string;
                            inicio: string;
                            fin: string;
                            estado: EstadoCita;
                            cliente?: { nombre?: string };
                            vehiculo?: { placa?: string };
                        };
                        return {
                            id: cita.id,
                            title: `${cita.cliente?.nombre ?? "Cita"} ${cita.vehiculo?.placa ? `· ${cita.vehiculo.placa}` : ""}`,
                            start: new Date(cita.inicio),
                            end: new Date(cita.fin),
                            estado: cita.estado,
                        };
                    }),
                ),
            )
            .catch((e) => toast.error(mensajeError(e)))
            .finally(() => setCargando(false));
    }, []);

    const leyenda = useMemo(() => Object.values(ESTADOS_CITA), []);

    return (
        <div>
            <PageHeader
                titulo="Citas y agenda"
                descripcion="Calendario semanal con colores por estado."
                acciones={
                    <>
                        <Button color="secondary" iconLeading={Lock01} href="/citas/bloqueos">Bloqueos</Button>
                        <Button color="primary" iconLeading={Plus} href="/citas/nueva">Nueva cita</Button>
                    </>
                }
            />

            <div className="mb-4 flex flex-wrap gap-3">
                {leyenda.map((e) => (
                    <span key={e.value} className="flex items-center gap-1.5 text-xs text-tertiary">
                        <span className="size-3 rounded-full" style={{ background: COLOR_ESTADO[e.value] }} />
                        {e.label}
                    </span>
                ))}
            </div>

            <Card className="p-4">
                {cargando ? (
                    <div className="flex justify-center py-20">
                        <Spinner size="lg" label="Cargando agenda..." />
                    </div>
                ) : (
                    <div style={{ height: 650 }}>
                        <Calendar
                            localizer={localizer}
                            culture="es"
                            events={eventos}
                            startAccessor="start"
                            endAccessor="end"
                            view={vista}
                            onView={setVista}
                            date={fecha}
                            onNavigate={setFecha}
                            views={["month", "week", "day", "agenda"]}
                            min={new Date(0, 0, 0, 7, 0)}
                            max={new Date(0, 0, 0, 20, 0)}
                            onSelectEvent={(e) => router.push(`/citas/${(e as Evento).id}`)}
                            eventPropGetter={(e) => ({
                                style: { backgroundColor: COLOR_ESTADO[(e as Evento).estado], border: "none", borderRadius: 6, fontSize: 12 },
                            })}
                            messages={{
                                today: "Hoy",
                                previous: "Anterior",
                                next: "Siguiente",
                                month: "Mes",
                                week: "Semana",
                                day: "Día",
                                agenda: "Agenda",
                                date: "Fecha",
                                time: "Hora",
                                event: "Cita",
                                noEventsInRange: "No hay citas en este rango.",
                            }}
                        />
                    </div>
                )}
            </Card>
        </div>
    );
}
