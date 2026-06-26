"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock } from "@untitledui/icons";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { TextArea } from "@/components/base/textarea/textarea";
import { Card, CardBody } from "@/components/ui/card";
import { mensajeError } from "@/lib/utils/error-handler";
import { citasService } from "@/services/citas.service";

interface Opcion {
    id: string;
    label: string;
}

export interface DatosCita {
    vehiculo_id: string | null;
    mecanico_id: string | null;
    inicio: string;
    fin: string;
    descripcion: string;
}

interface CitaFormProps {
    vehiculos: Opcion[];
    mecanicos?: Opcion[];
    /** Si se indica, la duración es fija (en minutos) y se oculta el selector. */
    duracionFija?: number;
    onGuardar: (datos: DatosCita) => Promise<void>;
    onCancelar: () => void;
}

const DURACIONES = [
    { id: "30", label: "30 minutos" },
    { id: "60", label: "1 hora" },
    { id: "90", label: "1 hora 30 min" },
    { id: "120", label: "2 horas" },
];

/** Formulario de cita que muestra SOLO horarios disponibles. */
export function CitaForm({ vehiculos, mecanicos, duracionFija, onGuardar, onCancelar }: CitaFormProps) {
    const [vehiculoId, setVehiculoId] = useState<string | null>(null);
    const [mecanicoId, setMecanicoId] = useState<string | null>(null);
    const [fecha, setFecha] = useState("");
    const [hora, setHora] = useState<string | null>(null);
    const [duracion, setDuracion] = useState(duracionFija ? String(duracionFija) : "60");
    const [descripcion, setDescripcion] = useState("");
    const [slots, setSlots] = useState<{ hora: string; disponible: boolean; motivo?: "ocupado" | "pasado" | "cierre" }[]>([]);
    const [cargandoSlots, setCargandoSlots] = useState(false);
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        if (!fecha) {
            setSlots([]);
            return;
        }
        setCargandoSlots(true);
        setHora(null);
        citasService
            .slotsDelDia(fecha, mecanicoId ?? undefined, Number(duracion))
            .then(setSlots)
            .catch(() => setSlots([]))
            .finally(() => setCargandoSlots(false));
    }, [fecha, mecanicoId, duracion]);

    const hayDisponibles = slots.some((s) => s.disponible);

    const guardar = async () => {
        if (!fecha || !hora) return toast.error("Selecciona fecha y un horario disponible.");
        setGuardando(true);
        try {
            const inicio = new Date(`${fecha}T${hora}:00`);
            const fin = new Date(inicio.getTime() + Number(duracion) * 60000);
            await onGuardar({
                vehiculo_id: vehiculoId,
                mecanico_id: mecanicoId,
                inicio: inicio.toISOString(),
                fin: fin.toISOString(),
                descripcion,
            });
        } catch (e) {
            toast.error(mensajeError(e));
        } finally {
            setGuardando(false);
        }
    };

    return (
        <Card>
            <CardBody className="flex flex-col gap-4">
                <Select label="Vehículo" placeholder="Selecciona un vehículo" selectedKey={vehiculoId} onSelectionChange={(k) => setVehiculoId(String(k))} items={vehiculos}>
                    {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                </Select>

                {mecanicos && (
                    <Select label="Mecánico (opcional)" placeholder="Cualquier mecánico" selectedKey={mecanicoId} onSelectionChange={(k) => setMecanicoId(String(k))} items={mecanicos}>
                        {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                    </Select>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                    <Input label="Fecha" type="date" icon={Calendar} value={fecha} onChange={setFecha} />
                    {duracionFija ? (
                        <Input label="Duración" value={`${duracionFija} minutos`} isDisabled />
                    ) : (
                        <Select label="Duración" selectedKey={duracion} onSelectionChange={(k) => setDuracion(String(k))} items={DURACIONES}>
                            {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                        </Select>
                    )}
                </div>

                <div>
                    <p className="mb-2 flex items-center gap-1 text-sm font-medium text-secondary">
                        <Clock className="size-4" /> Elige un horario
                    </p>
                    {!fecha ? (
                        <p className="text-sm text-tertiary">Selecciona una fecha para ver los horarios.</p>
                    ) : cargandoSlots ? (
                        <p className="text-sm text-tertiary">Buscando disponibilidad...</p>
                    ) : (
                        <>
                            <div className="flex flex-wrap gap-2">
                                {slots.map((s) => {
                                    const titulo = !s.disponible
                                        ? s.motivo === "ocupado"
                                            ? "No disponible (ya reservado)"
                                            : s.motivo === "pasado"
                                              ? "Horario ya pasado"
                                              : "Fuera del horario de atención"
                                        : "Disponible";
                                    return (
                                        <button
                                            key={s.hora}
                                            type="button"
                                            disabled={!s.disponible}
                                            title={titulo}
                                            onClick={() => s.disponible && setHora(s.hora)}
                                            className={
                                                "rounded-lg px-3 py-2 text-sm font-medium ring-1 transition " +
                                                (!s.disponible
                                                    ? "cursor-not-allowed bg-secondary text-quaternary line-through ring-secondary opacity-60"
                                                    : hora === s.hora
                                                      ? "bg-brand-solid text-white ring-transparent"
                                                      : "bg-primary text-secondary ring-secondary hover:bg-secondary")
                                            }
                                        >
                                            {s.hora}
                                        </button>
                                    );
                                })}
                            </div>
                            {!hayDisponibles && (
                                <p className="mt-2 text-sm text-error-primary">No hay horarios disponibles ese día. Prueba con otra fecha.</p>
                            )}
                            <p className="mt-2 flex items-center gap-3 text-xs text-tertiary">
                                <span className="flex items-center gap-1"><span className="size-2.5 rounded bg-primary ring-1 ring-secondary" /> Disponible</span>
                                <span className="flex items-center gap-1"><span className="size-2.5 rounded bg-secondary opacity-60" /> No disponible</span>
                            </p>
                        </>
                    )}
                </div>

                <TextArea label="Descripción" value={descripcion} onChange={setDescripcion} placeholder="Motivo de la cita" />

                <div className="mt-2 flex justify-end gap-3">
                    <Button color="secondary" type="button" onClick={onCancelar}>Cancelar</Button>
                    <Button color="primary" isLoading={guardando} onClick={guardar} isDisabled={!hora}>Agendar cita</Button>
                </div>
            </CardBody>
        </Card>
    );
}
