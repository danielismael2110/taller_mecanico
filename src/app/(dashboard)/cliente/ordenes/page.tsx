"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdjuntosOrden } from "@/components/business/adjuntos-orden";
import { StepperEstados } from "@/components/business/stepper-estados";
import { Card, CardBody } from "@/components/ui/card";
import { EstadoBadge } from "@/components/ui/estado-badge";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/use-auth";
import { ESTADOS_ORDEN } from "@/lib/constants";
import type { OrdenTrabajo } from "@/lib/types/database";
import { mensajeError } from "@/lib/utils/error-handler";
import { formatFecha, formatMoneda } from "@/lib/utils/formatters";
import { clientesService } from "@/services/clientes.service";

export default function MisOrdenesPage() {
    const { userId } = useAuth();
    const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        if (!userId) return;
        (async () => {
            try {
                const ficha = await clientesService.miFicha(userId);
                if (ficha) setOrdenes(await clientesService.ordenes(ficha.id));
            } catch (e) {
                toast.error(mensajeError(e));
            } finally {
                setCargando(false);
            }
        })();
    }, [userId]);

    if (cargando) {
        return (
            <div className="flex justify-center py-20">
                <Spinner size="lg" label="Cargando tus órdenes..." />
            </div>
        );
    }

    return (
        <div>
            <PageHeader titulo="Mis órdenes de trabajo" descripcion="Estado y progreso de tus reparaciones." />
            {ordenes.length === 0 ? (
                <Card><CardBody><p className="text-center text-sm text-tertiary">Aún no tienes órdenes de trabajo.</p></CardBody></Card>
            ) : (
                <div className="flex flex-col gap-5">
                    {ordenes.map((o) => (
                        <Card key={o.id}>
                            <CardBody>
                                <div className="mb-4 flex flex-wrap items-center gap-3">
                                    <span className="font-semibold text-primary">{o.numero}</span>
                                    <EstadoBadge label={ESTADOS_ORDEN[o.estado].label} color={ESTADOS_ORDEN[o.estado].color} />
                                    <span className="text-sm text-tertiary">{formatFecha(o.creado_en)}</span>
                                    <span className="ml-auto font-medium text-primary">{formatMoneda(o.total)}</span>
                                </div>
                                <StepperEstados estado={o.estado} />
                                <div className="mt-5 border-t border-secondary pt-4">
                                    <p className="mb-3 text-sm font-semibold text-primary">Evidencias / adjuntos</p>
                                    <AdjuntosOrden ordenId={o.id} />
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
