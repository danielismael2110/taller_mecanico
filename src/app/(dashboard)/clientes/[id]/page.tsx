"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Car01, Edit01, Mail01, MarkerPin01, Phone, Plus } from "@untitledui/icons";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Tab, TabList, TabPanel, Tabs } from "@/components/application/tabs/tabs";
import { Card, CardBody } from "@/components/ui/card";
import { EstadoBadge } from "@/components/ui/estado-badge";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import { ESTADOS_ORDEN } from "@/lib/constants";
import type { Cliente, OrdenTrabajo, Vehiculo } from "@/lib/types/database";
import { mensajeError } from "@/lib/utils/error-handler";
import { formatFecha, formatMoneda } from "@/lib/utils/formatters";
import { clientesService } from "@/services/clientes.service";

export default function DetalleClientePage() {
    const router = useRouter();
    const { id } = useParams<{ id: string }>();
    const [cliente, setCliente] = useState<Cliente | null>(null);
    const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
    const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        Promise.all([clientesService.obtener(id), clientesService.vehiculos(id), clientesService.ordenes(id)])
            .then(([c, v, o]) => {
                setCliente(c);
                setVehiculos(v);
                setOrdenes(o);
            })
            .catch((e) => toast.error(mensajeError(e)))
            .finally(() => setCargando(false));
    }, [id]);

    if (cargando || !cliente) {
        return (
            <div className="flex justify-center py-20">
                <Spinner size="lg" label="Cargando cliente..." />
            </div>
        );
    }

    return (
        <div>
            <Button color="link-gray" iconLeading={ArrowLeft} href="/clientes" className="mb-4">
                Volver a clientes
            </Button>
            <PageHeader
                titulo={cliente.nombre}
                descripcion="Ficha del cliente"
                acciones={
                    <Button color="secondary" iconLeading={Edit01} href={`/clientes/${id}/editar`}>
                        Editar
                    </Button>
                }
            />

            <Tabs>
                <TabList type="button-border">
                    <Tab id="datos" label="Datos" />
                    <Tab id="vehiculos" label={`Vehículos (${vehiculos.length})`} />
                    <Tab id="historial" label={`Historial OT (${ordenes.length})`} />
                </TabList>

                <TabPanel id="datos" className="mt-5">
                    <Card>
                        <CardBody>
                            <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                                <Dato label="Teléfono" valor={cliente.telefono} icono={Phone} />
                                <Dato label="Correo" valor={cliente.correo} icono={Mail01} />
                                <Dato label="CI / NIT" valor={cliente.ci_nit} />
                                <Dato label="Dirección" valor={cliente.direccion} icono={MarkerPin01} />
                                <Dato label="Registrado" valor={formatFecha(cliente.creado_en)} />
                                {cliente.notas && <Dato label="Notas" valor={cliente.notas} />}
                            </dl>
                        </CardBody>
                    </Card>
                </TabPanel>

                <TabPanel id="vehiculos" className="mt-5">
                    <div className="mb-4 flex justify-end">
                        <Button color="primary" iconLeading={Plus} href={`/clientes/vehiculos/nuevo?cliente=${id}`}>
                            Nuevo vehículo
                        </Button>
                    </div>
                    {vehiculos.length === 0 ? (
                        <Card>
                            <CardBody>
                                <p className="text-center text-sm text-tertiary">Este cliente no tiene vehículos registrados.</p>
                            </CardBody>
                        </Card>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {vehiculos.map((v) => (
                                <Link key={v.id} href={`/clientes/vehiculos/${v.id}`}>
                                    <Card className="p-5 transition hover:ring-brand">
                                        <div className="flex items-center gap-3">
                                            <span className="flex size-10 items-center justify-center rounded-lg bg-brand-primary_alt text-brand-secondary">
                                                <Car01 className="size-5" />
                                            </span>
                                            <div>
                                                <p className="font-semibold text-primary">{v.marca} {v.modelo}</p>
                                                <p className="text-sm text-tertiary">{v.placa} · {v.anio ?? "—"}</p>
                                            </div>
                                        </div>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </TabPanel>

                <TabPanel id="historial" className="mt-5">
                    {ordenes.length === 0 ? (
                        <Card>
                            <CardBody>
                                <p className="text-center text-sm text-tertiary">Sin órdenes de trabajo registradas.</p>
                            </CardBody>
                        </Card>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {ordenes.map((o) => (
                                <Link key={o.id} href={`/ordenes/${o.id}`}>
                                    <Card className="flex items-center justify-between p-4 transition hover:ring-brand">
                                        <div className="flex items-center gap-3">
                                            <span className="font-semibold text-primary">{o.numero}</span>
                                            <EstadoBadge label={ESTADOS_ORDEN[o.estado].label} color={ESTADOS_ORDEN[o.estado].color} />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-primary">{formatMoneda(o.total)}</p>
                                            <p className="text-xs text-tertiary">{formatFecha(o.creado_en)}</p>
                                        </div>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </TabPanel>
            </Tabs>
        </div>
    );
}

function Dato({ label, valor, icono: Icono }: { label: string; valor?: string | null; icono?: React.FC<{ className?: string }> }) {
    return (
        <div>
            <dt className="text-xs font-medium text-quaternary">{label}</dt>
            <dd className="mt-0.5 flex items-center gap-1.5 text-sm text-primary">
                {Icono && <Icono className="size-4 text-fg-quaternary" />}
                {valor || "—"}
            </dd>
        </div>
    );
}
