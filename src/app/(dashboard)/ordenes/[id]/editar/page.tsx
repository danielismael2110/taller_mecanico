"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "@untitledui/icons";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { TextArea } from "@/components/base/textarea/textarea";
import { Card, CardBody } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import type { OrdenTrabajo } from "@/lib/types/database";
import { mensajeError } from "@/lib/utils/error-handler";
import { ordenesService } from "@/services/ordenes.service";

export default function EditarOrdenPage() {
    const router = useRouter();
    const { id } = useParams<{ id: string }>();
    const [orden, setOrden] = useState<OrdenTrabajo | null>(null);
    const [diagnostico, setDiagnostico] = useState("");
    const [trabajo, setTrabajo] = useState("");
    const [horas, setHoras] = useState("0");
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        ordenesService.obtener(id).then((o) => {
            const ord = o as unknown as OrdenTrabajo;
            setOrden(ord);
            setDiagnostico(ord.diagnostico ?? "");
            setTrabajo(ord.trabajo_realizado ?? "");
            setHoras(String(ord.horas_trabajo ?? 0));
        }).catch((e) => toast.error(mensajeError(e)));
    }, [id]);

    const guardar = async () => {
        if (!orden) return;
        setGuardando(true);
        try {
            // Bloqueo optimista: enviamos la versión leída.
            await ordenesService.actualizar(id, {
                diagnostico,
                trabajo_realizado: trabajo,
                horas_trabajo: Number(horas) || 0,
                version: orden.version,
            });
            toast.success("Orden actualizada.");
            router.push(`/ordenes/${id}`);
        } catch (e) {
            toast.error(mensajeError(e));
        } finally {
            setGuardando(false);
        }
    };

    if (!orden) {
        return (
            <div className="flex justify-center py-20">
                <Spinner size="lg" label="Cargando..." />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl">
            <Button color="link-gray" iconLeading={ArrowLeft} href={`/ordenes/${id}`} className="mb-4">
                Volver a la orden
            </Button>
            <PageHeader titulo={`Editar ${orden.numero}`} descripcion="Diagnóstico y trabajo realizado." />
            <Card>
                <CardBody className="flex flex-col gap-4">
                    <TextArea label="Diagnóstico" value={diagnostico} onChange={setDiagnostico} placeholder="Hallazgos del diagnóstico" />
                    <TextArea label="Trabajo realizado" value={trabajo} onChange={setTrabajo} placeholder="Trabajos efectuados" />
                    <Input label="Horas de trabajo" type="number" value={horas} onChange={setHoras} />
                    <div className="flex justify-end gap-3">
                        <Button color="secondary" onClick={() => router.push(`/ordenes/${id}`)}>Cancelar</Button>
                        <Button color="primary" isLoading={guardando} onClick={guardar}>Guardar cambios</Button>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}
