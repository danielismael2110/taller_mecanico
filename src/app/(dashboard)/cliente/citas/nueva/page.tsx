"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "@untitledui/icons";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { CitaForm, type DatosCita } from "@/components/business/cita-form";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/use-auth";
import type { Cliente } from "@/lib/types/database";
import { mensajeError } from "@/lib/utils/error-handler";
import { citasService } from "@/services/citas.service";
import { clientesService } from "@/services/clientes.service";

export default function SolicitarCitaPage() {
    const router = useRouter();
    const { userId } = useAuth();
    const [ficha, setFicha] = useState<Cliente | null>(null);
    const [vehiculos, setVehiculos] = useState<{ id: string; label: string }[]>([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        if (!userId) return;
        (async () => {
            try {
                const f = await clientesService.miFicha(userId);
                setFicha(f);
                if (f) {
                    const vs = await clientesService.vehiculos(f.id);
                    setVehiculos(vs.map((v) => ({ id: v.id, label: `${v.marca} ${v.modelo} · ${v.placa}` })));
                }
            } finally {
                setCargando(false);
            }
        })();
    }, [userId]);

    const guardar = async (datos: DatosCita) => {
        if (!ficha) return;
        try {
            await citasService.crear({
                cliente_id: ficha.id,
                vehiculo_id: datos.vehiculo_id,
                inicio: datos.inicio,
                fin: datos.fin,
                descripcion: datos.descripcion,
                estado: "solicitada",
            });
            toast.success("Cita solicitada. El taller la confirmará.");
            router.push("/cliente/citas");
        } catch (e) {
            toast.error(mensajeError(e));
            throw e;
        }
    };

    if (cargando) {
        return (
            <div className="flex justify-center py-20">
                <Spinner size="lg" label="Cargando..." />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl">
            <Button color="link-gray" iconLeading={ArrowLeft} href="/cliente/citas" className="mb-4">Volver a mis citas</Button>
            <PageHeader titulo="Solicitar cita" descripcion="Elige un horario disponible." />
            {vehiculos.length === 0 && (
                <div className="mb-4 rounded-lg bg-warning-primary px-4 py-3 text-sm text-warning-primary ring-1 ring-warning">
                    No tienes vehículos registrados. Puedes solicitar la cita igualmente y el taller registrará tu vehículo.
                </div>
            )}
            <CitaForm vehiculos={vehiculos} duracionFija={30} onGuardar={guardar} onCancelar={() => router.push("/cliente/citas")} />
        </div>
    );
}
