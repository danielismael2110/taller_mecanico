"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Calendar, Car01, Check, User01, X } from "@untitledui/icons";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EstadoBadge } from "@/components/ui/estado-badge";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import { ESTADOS_CITA } from "@/lib/constants";
import type { EstadoCita } from "@/lib/types/database";
import { mensajeError } from "@/lib/utils/error-handler";
import { formatFechaHora } from "@/lib/utils/formatters";
import { citasService } from "@/services/citas.service";

interface CitaDetalle {
    id: string;
    inicio: string;
    fin: string;
    estado: EstadoCita;
    descripcion: string | null;
    cliente?: { nombre?: string } | null;
    vehiculo?: { marca?: string; modelo?: string; placa?: string } | null;
    mecanico?: { nombre?: string } | null;
}

export default function DetalleCitaPage() {
    const router = useRouter();
    const { id } = useParams<{ id: string }>();
    const [cita, setCita] = useState<CitaDetalle | null>(null);
    const [cargando, setCargando] = useState(true);
    const [procesando, setProcesando] = useState(false);

    const cargar = useCallback(async () => {
        try {
            setCita((await citasService.obtener(id)) as unknown as CitaDetalle);
        } catch (e) {
            toast.error(mensajeError(e));
        } finally {
            setCargando(false);
        }
    }, [id]);

    useEffect(() => {
        cargar();
    }, [cargar]);

    const cambiar = async (estado: EstadoCita) => {
        setProcesando(true);
        try {
            await citasService.cambiarEstado(id, estado);
            toast.success("Cita actualizada.");
            cargar();
        } catch (e) {
            toast.error(mensajeError(e));
        } finally {
            setProcesando(false);
        }
    };

    if (cargando || !cita) {
        return (
            <div className="flex justify-center py-20">
                <Spinner size="lg" label="Cargando cita..." />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-2xl">
            <Button color="link-gray" iconLeading={ArrowLeft} href="/citas" className="mb-4">Volver a la agenda</Button>
            <PageHeader titulo="Detalle de la cita" />

            <Card>
                <CardHeader titulo={formatFechaHora(cita.inicio)} accion={<EstadoBadge label={ESTADOS_CITA[cita.estado].label} color={ESTADOS_CITA[cita.estado].color} size="md" />} />
                <CardBody className="flex flex-col gap-3 text-sm">
                    <Fila icono={User01} label="Cliente" valor={cita.cliente?.nombre} />
                    <Fila icono={Car01} label="Vehículo" valor={cita.vehiculo ? `${cita.vehiculo.marca} ${cita.vehiculo.modelo} · ${cita.vehiculo.placa}` : null} />
                    <Fila icono={User01} label="Mecánico" valor={cita.mecanico?.nombre} />
                    <Fila icono={Calendar} label="Horario" valor={`${formatFechaHora(cita.inicio)} — ${formatFechaHora(cita.fin)}`} />
                    {cita.descripcion && <Fila label="Descripción" valor={cita.descripcion} />}
                </CardBody>
            </Card>

            {!["cancelada", "completada", "no_asistio"].includes(cita.estado) && (
                <div className="mt-4 flex flex-wrap gap-3">
                    {cita.estado === "solicitada" && (
                        <Button color="primary" iconLeading={Check} isLoading={procesando} onClick={() => cambiar("confirmada")}>
                            Confirmar cita
                        </Button>
                    )}
                    <Button color="secondary" iconLeading={Check} isLoading={procesando} onClick={() => cambiar("completada")}>
                        Marcar completada
                    </Button>
                    <Button color="secondary-destructive" iconLeading={X} isLoading={procesando} onClick={() => cambiar("cancelada")}>
                        Cancelar cita
                    </Button>
                </div>
            )}
        </div>
    );
}

function Fila({ icono: Icono, label, valor }: { icono?: React.FC<{ className?: string }>; label: string; valor?: string | null }) {
    return (
        <div className="flex items-start gap-2">
            {Icono && <Icono className="mt-0.5 size-4 text-fg-quaternary" />}
            <div>
                <dt className="text-xs font-medium text-quaternary">{label}</dt>
                <dd className="text-primary">{valor || "—"}</dd>
            </div>
        </div>
    );
}
