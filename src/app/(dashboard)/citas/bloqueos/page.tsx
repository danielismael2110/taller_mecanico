"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Plus, Trash01 } from "@untitledui/icons";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { DataTable, type Columna } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import type { BloqueoAgenda } from "@/lib/types/database";
import { mensajeError } from "@/lib/utils/error-handler";
import { formatFechaHora } from "@/lib/utils/formatters";
import { citasService } from "@/services/citas.service";

export default function BloqueosPage() {
    const [bloqueos, setBloqueos] = useState<BloqueoAgenda[]>([]);
    const [cargando, setCargando] = useState(true);
    const [modal, setModal] = useState(false);

    const cargar = useCallback(async () => {
        setCargando(true);
        try {
            setBloqueos(await citasService.bloqueos());
        } catch (e) {
            toast.error(mensajeError(e));
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        cargar();
    }, [cargar]);

    const eliminar = async (bid: string) => {
        try {
            await citasService.eliminarBloqueo(bid);
            toast.success("Bloqueo eliminado.");
            cargar();
        } catch (e) {
            toast.error(mensajeError(e));
        }
    };

    const columnas: Columna<BloqueoAgenda>[] = [
        { key: "inicio", header: "Desde", isRowHeader: true, render: (b) => formatFechaHora(b.inicio) },
        { key: "fin", header: "Hasta", render: (b) => formatFechaHora(b.fin) },
        { key: "motivo", header: "Motivo", render: (b) => b.motivo ?? "—" },
        {
            key: "acc",
            header: "",
            render: (b) => <ButtonUtility size="sm" color="tertiary" icon={Trash01} tooltip="Eliminar" onClick={() => eliminar(b.id)} />,
        },
    ];

    return (
        <div>
            <Button color="link-gray" iconLeading={ArrowLeft} href="/citas" className="mb-4">Volver a la agenda</Button>
            <PageHeader
                titulo="Bloqueos de agenda"
                descripcion="Bloquea horarios o días por feriados/mantenimiento."
                acciones={<Button color="primary" iconLeading={Plus} onClick={() => setModal(true)}>Nuevo bloqueo</Button>}
            />
            <DataTable columnas={columnas} filas={bloqueos} getId={(b) => b.id} cargando={cargando} mensajeVacio="No hay bloqueos registrados." />

            {modal && <ModalBloqueo onCerrar={() => setModal(false)} onGuardado={() => { setModal(false); cargar(); }} />}
        </div>
    );
}

function ModalBloqueo({ onCerrar, onGuardado }: { onCerrar: () => void; onGuardado: () => void }) {
    const [inicio, setInicio] = useState("");
    const [fin, setFin] = useState("");
    const [motivo, setMotivo] = useState("");
    const [guardando, setGuardando] = useState(false);

    const guardar = async () => {
        if (!inicio || !fin) return toast.error("Indica inicio y fin.");
        setGuardando(true);
        try {
            await citasService.crearBloqueo({ inicio: new Date(inicio).toISOString(), fin: new Date(fin).toISOString(), motivo });
            toast.success("Bloqueo creado.");
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
                        <h2 className="text-lg font-semibold text-primary">Nuevo bloqueo</h2>
                        <div className="mt-4 flex flex-col gap-4">
                            <Input label="Desde" type="datetime-local" value={inicio} onChange={setInicio} />
                            <Input label="Hasta" type="datetime-local" value={fin} onChange={setFin} />
                            <Input label="Motivo" value={motivo} onChange={setMotivo} placeholder="Feriado, mantenimiento..." />
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <Button color="secondary" onClick={onCerrar}>Cancelar</Button>
                            <Button color="primary" isLoading={guardando} onClick={guardar}>Crear bloqueo</Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
