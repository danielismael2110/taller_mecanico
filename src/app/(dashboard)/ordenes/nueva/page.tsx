"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "@untitledui/icons";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Card, CardBody } from "@/components/ui/card";
import { FormSelect, FormTextArea } from "@/components/ui/form-fields";
import { PageHeader } from "@/components/ui/page-header";
import { PRIORIDAD_OPCIONES } from "@/lib/constants";
import type { Vehiculo } from "@/lib/types/database";
import { mensajeError } from "@/lib/utils/error-handler";
import { ordenSchema, type OrdenInput } from "@/lib/utils/validators";
import { clientesService } from "@/services/clientes.service";
import { ordenesService } from "@/services/ordenes.service";

export default function NuevaOrdenPage() {
    const router = useRouter();
    const [clientes, setClientes] = useState<{ id: string; label: string }[]>([]);
    const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
    const [cantidadMecanicos, setCantidadMecanicos] = useState("1");

    const { control, handleSubmit, watch, setValue, formState } = useForm<OrdenInput>({
        resolver: zodResolver(ordenSchema) as unknown as Resolver<OrdenInput>,
        defaultValues: { cliente_id: "", vehiculo_id: "", prioridad: "media", problema_reportado: "" },
    });

    const clienteId = watch("cliente_id");

    useEffect(() => {
        clientesService.opciones().then((cs) => setClientes(cs.map((c) => ({ id: c.id, label: c.nombre })))).catch(() => {});
    }, []);

    useEffect(() => {
        if (!clienteId) {
            setVehiculos([]);
            return;
        }
        clientesService.vehiculos(clienteId).then(setVehiculos).catch(() => setVehiculos([]));
        setValue("vehiculo_id", "");
    }, [clienteId, setValue]);

    const vehiculoItems = useMemo(
        () => vehiculos.map((v) => ({ id: v.id, label: `${v.marca} ${v.modelo} · ${v.placa}` })),
        [vehiculos],
    );

    const onSubmit = async (datos: OrdenInput) => {
        try {
            const orden = await ordenesService.crear({
                cliente_id: datos.cliente_id,
                vehiculo_id: datos.vehiculo_id,
                prioridad: datos.prioridad,
                problema_reportado: datos.problema_reportado,
                estado: "pendiente_asignacion",
                cantidad_mecanicos_requeridos: Math.max(1, Number(cantidadMecanicos) || 1),
            });
            toast.success(`Orden ${orden.numero} creada. Pendiente de asignación de mecánicos.`);
            router.push(`/ordenes/${orden.id}`);
        } catch (e) {
            toast.error(mensajeError(e));
        }
    };

    return (
        <div className="mx-auto max-w-3xl">
            <Button color="link-gray" iconLeading={ArrowLeft} href="/ordenes" className="mb-4">
                Volver a órdenes
            </Button>
            <PageHeader titulo="Nueva orden de trabajo" descripcion="Registra el ingreso de un vehículo." />

            <Card>
                <CardBody>
                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                        <FormSelect control={control} name="cliente_id" label="Cliente" items={clientes} isRequired placeholder="Selecciona un cliente" />
                        <FormSelect
                            control={control}
                            name="vehiculo_id"
                            label="Vehículo"
                            items={vehiculoItems}
                            isRequired
                            placeholder={clienteId ? "Selecciona un vehículo" : "Primero elige un cliente"}
                        />
                        <FormSelect control={control} name="prioridad" label="Prioridad" items={PRIORIDAD_OPCIONES.map((p) => ({ id: p.value, label: p.label }))} />
                        <FormTextArea control={control} name="problema_reportado" label="Problema reportado" placeholder="Describe el problema indicado por el cliente" />

                        <Input
                            label="Cantidad de mecánicos requeridos"
                            type="number"
                            value={cantidadMecanicos}
                            onChange={setCantidadMecanicos}
                            hint="Los mecánicos verán esta orden y podrán aceptarla. Cuando se completen los requeridos, la OT pasará a diagnóstico."
                        />

                        <div className="mt-2 flex justify-end gap-3">
                            <Button color="secondary" type="button" onClick={() => router.push("/ordenes")}>
                                Cancelar
                            </Button>
                            <Button color="primary" type="submit" isLoading={formState.isSubmitting}>
                                Crear orden
                            </Button>
                        </div>
                    </form>
                </CardBody>
            </Card>
        </div>
    );
}
