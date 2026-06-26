"use client";

import { useCallback, useEffect, useState } from "react";
import { Calendar, Clock, Plus, X } from "@untitledui/icons";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { ConfirmacionModal } from "@/components/business/confirmacion-modal";
import { Card, CardBody } from "@/components/ui/card";
import { EstadoBadge } from "@/components/ui/estado-badge";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import { ESTADOS_CITA } from "@/lib/constants";
import type { EstadoCita } from "@/lib/types/database";
import { mensajeError } from "@/lib/utils/error-handler";
import { formatFechaHora } from "@/lib/utils/formatters";
import { citasService } from "@/services/citas.service";

interface FilaCita {
    id: string;
    inicio: string;
    fin: string;
    estado: EstadoCita;
    descripcion: string | null;
    mecanico_id: string | null;
    vehiculo?: { marca?: string; modelo?: string; placa?: string } | null;
}

const MODIFICABLE: EstadoCita[] = ["solicitada", "confirmada", "reprogramada"];

export default function MisCitasPage() {
    const [citas, setCitas] = useState<FilaCita[]>([]);
    const [cargando, setCargando] = useState(true);
    const [aCancelar, setACancelar] = useState<FilaCita | null>(null);
    const [aReprogramar, setAReprogramar] = useState<FilaCita | null>(null);
    const [procesando, setProcesando] = useState(false);

    const cargar = useCallback(async () => {
        setCargando(true);
        try {
            setCitas((await citasService.listar()) as unknown as FilaCita[]);
        } catch (e) {
            toast.error(mensajeError(e));
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        cargar();
    }, [cargar]);

    const cancelar = async () => {
        if (!aCancelar) return;
        setProcesando(true);
        try {
            await citasService.cambiarEstado(aCancelar.id, "cancelada");
            toast.success("Cita cancelada.");
            setACancelar(null);
            cargar();
        } catch (e) {
            toast.error(mensajeError(e));
        } finally {
            setProcesando(false);
        }
    };

    if (cargando) {
        return (
            <div className="flex justify-center py-20">
                <Spinner size="lg" label="Cargando tus citas..." />
            </div>
        );
    }

    return (
        <div>
            <PageHeader
                titulo="Mis citas"
                descripcion="Solicita, reprograma o cancela tus citas."
                acciones={<Button color="primary" iconLeading={Plus} href="/cliente/citas/nueva">Solicitar cita</Button>}
            />

            {citas.length === 0 ? (
                <Card><CardBody><p className="text-center text-sm text-tertiary">No tienes citas. ¡Solicita una!</p></CardBody></Card>
            ) : (
                <div className="flex flex-col gap-3">
                    {citas.map((c) => (
                        <Card key={c.id}>
                            <CardBody className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="font-semibold text-primary">{formatFechaHora(c.inicio)}</p>
                                    <p className="text-sm text-tertiary">
                                        {c.vehiculo ? `${c.vehiculo.marca} ${c.vehiculo.modelo} · ${c.vehiculo.placa}` : c.descripcion ?? "Cita"}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <EstadoBadge label={ESTADOS_CITA[c.estado].label} color={ESTADOS_CITA[c.estado].color} />
                                    {MODIFICABLE.includes(c.estado) && (
                                        <>
                                            <Button size="sm" color="secondary" iconLeading={Clock} onClick={() => setAReprogramar(c)}>
                                                Reprogramar
                                            </Button>
                                            <Button size="sm" color="secondary-destructive" iconLeading={X} onClick={() => setACancelar(c)}>
                                                Cancelar
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            )}

            <ConfirmacionModal
                abierto={!!aCancelar}
                onCerrar={() => setACancelar(null)}
                onConfirmar={cancelar}
                titulo="Cancelar cita"
                mensaje={`¿Cancelar tu cita del ${aCancelar ? formatFechaHora(aCancelar.inicio) : ""}?`}
                textoConfirmar="Sí, cancelar"
                textoCancelar="No"
                peligro
                cargando={procesando}
            />

            {aReprogramar && (
                <ReprogramarModal
                    cita={aReprogramar}
                    onCerrar={() => setAReprogramar(null)}
                    onGuardado={() => { setAReprogramar(null); cargar(); }}
                />
            )}
        </div>
    );
}

function ReprogramarModal({ cita, onCerrar, onGuardado }: { cita: FilaCita; onCerrar: () => void; onGuardado: () => void }) {
    const [fecha, setFecha] = useState("");
    const [hora, setHora] = useState<string | null>(null);
    const [slots, setSlots] = useState<string[]>([]);
    const [cargandoSlots, setCargandoSlots] = useState(false);
    const [guardando, setGuardando] = useState(false);

    const duracionMin = Math.max(30, Math.round((new Date(cita.fin).getTime() - new Date(cita.inicio).getTime()) / 60000));

    useEffect(() => {
        if (!fecha) {
            setSlots([]);
            return;
        }
        setCargandoSlots(true);
        setHora(null);
        citasService
            .horariosDisponibles(fecha, cita.mecanico_id ?? undefined, duracionMin)
            .then(setSlots)
            .catch(() => setSlots([]))
            .finally(() => setCargandoSlots(false));
    }, [fecha, cita.mecanico_id, duracionMin]);

    const guardar = async () => {
        if (!fecha || !hora) return toast.error("Selecciona una nueva fecha y horario.");
        setGuardando(true);
        try {
            const inicio = new Date(`${fecha}T${hora}:00`);
            const fin = new Date(inicio.getTime() + duracionMin * 60000);
            await citasService.reprogramar(cita.id, inicio.toISOString(), fin.toISOString());
            toast.success("Cita reprogramada.");
            onGuardado();
        } catch (e) {
            toast.error(mensajeError(e));
        } finally {
            setGuardando(false);
        }
    };

    return (
        <ModalOverlay isOpen onOpenChange={(o) => !o && onCerrar()} isDismissable>
            <Modal className="max-w-md">
                <Dialog>
                    <div className="rounded-2xl bg-primary p-6 shadow-xl">
                        <h2 className="text-lg font-semibold text-primary">Reprogramar cita</h2>
                        <p className="mt-1 text-sm text-tertiary">Actual: {formatFechaHora(cita.inicio)}</p>

                        <div className="mt-4 flex flex-col gap-4">
                            <Input label="Nueva fecha" type="date" icon={Calendar} value={fecha} onChange={setFecha} />
                            <div>
                                <p className="mb-2 flex items-center gap-1 text-sm font-medium text-secondary">
                                    <Clock className="size-4" /> Horarios disponibles
                                </p>
                                {!fecha ? (
                                    <p className="text-sm text-tertiary">Elige una fecha.</p>
                                ) : cargandoSlots ? (
                                    <p className="text-sm text-tertiary">Buscando disponibilidad...</p>
                                ) : slots.length === 0 ? (
                                    <p className="text-sm text-error-primary">No hay horarios disponibles ese día.</p>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {slots.map((s) => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => setHora(s)}
                                                className={
                                                    "rounded-lg px-3 py-2 text-sm font-medium ring-1 transition " +
                                                    (hora === s ? "bg-brand-solid text-white ring-transparent" : "bg-primary text-secondary ring-secondary hover:bg-secondary")
                                                }
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <Button color="secondary" onClick={onCerrar}>Cancelar</Button>
                            <Button color="primary" isLoading={guardando} isDisabled={!hora} onClick={guardar}>Reprogramar</Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
