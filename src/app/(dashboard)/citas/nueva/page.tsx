"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "@untitledui/icons";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { CitaForm, type DatosCita } from "@/components/business/cita-form";
import { PageHeader } from "@/components/ui/page-header";
import { mensajeError } from "@/lib/utils/error-handler";
import { citasService } from "@/services/citas.service";
import { ordenesService } from "@/services/ordenes.service";
import { vehiculosService } from "@/services/vehiculos.service";

export default function NuevaCitaPage() {
    const router = useRouter();
    const [vehiculos, setVehiculos] = useState<{ id: string; label: string }[]>([]);
    const [mecanicos, setMecanicos] = useState<{ id: string; label: string }[]>([]);

    useEffect(() => {
        vehiculosService.listar().then((vs) => setVehiculos(vs.map((v) => ({ id: v.id, label: `${v.marca} ${v.modelo} · ${v.placa}` })))).catch(() => {});
        ordenesService.mecanicos().then((ms) => setMecanicos(ms.map((m) => ({ id: m.id, label: m.nombre })))).catch(() => {});
    }, []);

    const guardar = async (datos: DatosCita) => {
        try {
            await citasService.crear({
                vehiculo_id: datos.vehiculo_id,
                mecanico_id: datos.mecanico_id,
                inicio: datos.inicio,
                fin: datos.fin,
                descripcion: datos.descripcion,
                estado: "confirmada",
            });
            toast.success("Cita agendada.");
            router.push("/citas");
        } catch (e) {
            toast.error(mensajeError(e));
            throw e;
        }
    };

    return (
        <div className="mx-auto max-w-3xl">
            <Button color="link-gray" iconLeading={ArrowLeft} href="/citas" className="mb-4">Volver a la agenda</Button>
            <PageHeader titulo="Nueva cita" descripcion="Agenda una cita en un horario disponible." />
            <CitaForm vehiculos={vehiculos} mecanicos={mecanicos} onGuardar={guardar} onCancelar={() => router.push("/citas")} />
        </div>
    );
}
