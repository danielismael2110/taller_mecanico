"use client";

import { useEffect, useState } from "react";
import { Calendar, Car01, ClipboardCheck, Plus } from "@untitledui/icons";
import Link from "next/link";
import { Button } from "@/components/base/buttons/button";
import { StepperEstados } from "@/components/business/stepper-estados";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EstadoBadge } from "@/components/ui/estado-badge";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/use-auth";
import { ESTADOS_ORDEN } from "@/lib/constants";
import type { Cita, Cliente, OrdenTrabajo, Vehiculo } from "@/lib/types/database";
import { formatFechaHora, formatMoneda } from "@/lib/utils/formatters";
import { citasService } from "@/services/citas.service";
import { clientesService } from "@/services/clientes.service";

export default function ClienteDashboardPage() {
    const { userId, perfil } = useAuth();
    const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
    const [ordenActiva, setOrdenActiva] = useState<OrdenTrabajo | null>(null);
    const [proximaCita, setProximaCita] = useState<Cita | null>(null);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        if (!userId) return;
        (async () => {
            try {
                const ficha: Cliente | null = await clientesService.miFicha(userId);
                if (ficha) {
                    const [vs, os] = await Promise.all([clientesService.vehiculos(ficha.id), clientesService.ordenes(ficha.id)]);
                    setVehiculos(vs);
                    setOrdenActiva(os.find((o) => !["entregado", "pagado", "cancelado"].includes(o.estado)) ?? null);
                }
                const citas = await citasService.listar(new Date().toISOString());
                setProximaCita((citas[0] as unknown as Cita) ?? null);
            } finally {
                setCargando(false);
            }
        })();
    }, [userId]);

    if (cargando) {
        return (
            <div className="flex justify-center py-20">
                <Spinner size="lg" label="Cargando tu panel..." />
            </div>
        );
    }

    return (
        <div>
            <PageHeader
                titulo={`Hola, ${perfil?.nombre ?? ""} 👋`}
                descripcion="Resumen de tu actividad en el taller."
                acciones={<Button color="primary" iconLeading={Plus} href="/cliente/citas/nueva">Solicitar cita</Button>}
            />

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader titulo="Orden activa" descripcion="Estado actual de tu vehículo en el taller" />
                    <CardBody>
                        {ordenActiva ? (
                            <div>
                                <div className="mb-4 flex items-center gap-3">
                                    <span className="font-semibold text-primary">{ordenActiva.numero}</span>
                                    <EstadoBadge label={ESTADOS_ORDEN[ordenActiva.estado].label} color={ESTADOS_ORDEN[ordenActiva.estado].color} />
                                    <span className="ml-auto text-sm text-tertiary">{formatMoneda(ordenActiva.total)}</span>
                                </div>
                                <StepperEstados estado={ordenActiva.estado} />
                                <Link href="/cliente/ordenes" className="mt-4 inline-block text-sm font-semibold text-brand-secondary hover:underline">
                                    Ver todas mis órdenes →
                                </Link>
                            </div>
                        ) : (
                            <p className="text-sm text-tertiary">No tienes órdenes activas en este momento.</p>
                        )}
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader titulo="Próxima cita" />
                    <CardBody>
                        {proximaCita ? (
                            <div className="flex items-start gap-3">
                                <span className="flex size-10 items-center justify-center rounded-lg bg-brand-primary_alt text-brand-secondary">
                                    <Calendar className="size-5" />
                                </span>
                                <div>
                                    <p className="font-medium text-primary">{formatFechaHora(proximaCita.inicio)}</p>
                                    <p className="text-sm text-tertiary">{proximaCita.descripcion ?? "Cita agendada"}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-tertiary">No tienes citas próximas.</p>
                        )}
                    </CardBody>
                </Card>
            </div>

            <Card className="mt-6">
                <CardHeader titulo="Mis vehículos" accion={<ClipboardCheck className="size-5 text-fg-quaternary" />} />
                <CardBody>
                    {vehiculos.length === 0 ? (
                        <p className="text-sm text-tertiary">No tienes vehículos registrados. Contacta al taller para registrarlos.</p>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {vehiculos.map((v) => (
                                <div key={v.id} className="flex items-center gap-3 rounded-lg border border-secondary p-4">
                                    <span className="flex size-10 items-center justify-center rounded-lg bg-brand-primary_alt text-brand-secondary">
                                        <Car01 className="size-5" />
                                    </span>
                                    <div>
                                        <p className="font-semibold text-primary">{v.marca} {v.modelo}</p>
                                        <p className="text-sm text-tertiary">{v.placa}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardBody>
            </Card>
        </div>
    );
}
