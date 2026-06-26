"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { TextArea } from "@/components/base/textarea/textarea";
import { RequiereRol } from "@/components/layout/requiere-rol";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import { useTallerContext } from "@/contexts/taller-context";
import type { ConfiguracionTaller } from "@/lib/types/database";
import { mensajeError } from "@/lib/utils/error-handler";
import { formatFechaHora } from "@/lib/utils/formatters";
import { authService } from "@/services/auth.service";
import { configuracionService } from "@/services/configuracion.service";

export default function ConfiguracionPage() {
    const { config, refrescar } = useTallerContext();
    const [form, setForm] = useState<Partial<ConfiguracionTaller>>({});
    const [actualizadoPor, setActualizadoPor] = useState<string | null>(null);
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        if (config) setForm(config);
    }, [config]);

    useEffect(() => {
        if (config?.actualizado_por) {
            authService.getPerfil(config.actualizado_por).then((p) => setActualizadoPor(p?.nombre ?? null)).catch(() => setActualizadoPor(null));
        } else {
            setActualizadoPor(null);
        }
    }, [config?.actualizado_por]);

    const set = (k: keyof ConfiguracionTaller) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
    const setNum = (k: keyof ConfiguracionTaller) => (v: string) => setForm((f) => ({ ...f, [k]: Number(v) }));

    const guardar = async () => {
        setGuardando(true);
        try {
            await configuracionService.actualizar({
                nombre: form.nombre,
                direccion: form.direccion,
                telefono: form.telefono,
                correo: form.correo,
                horario: form.horario,
                maps_embed_url: form.maps_embed_url,
                iva_porcentaje: form.iva_porcentaje,
                descuento_max: form.descuento_max,
                moneda: form.moneda,
            });
            await refrescar();
            toast.success("Configuración guardada.");
        } catch (e) {
            toast.error(mensajeError(e));
        } finally {
            setGuardando(false);
        }
    };

    if (!config) {
        return (
            <div className="flex justify-center py-20">
                <Spinner size="lg" label="Cargando configuración..." />
            </div>
        );
    }

    return (
        <RequiereRol roles={["admin", "recepcionista"]}>
            <PageHeader titulo="Configuración del taller" descripcion="Parámetros generales, IVA y descuentos." />

            {config.actualizado_en && (
                <div className="mb-4 rounded-lg bg-secondary px-4 py-2.5 text-sm text-tertiary ring-1 ring-secondary">
                    Última actualización
                    {actualizadoPor ? <> por <span className="font-medium text-primary">{actualizadoPor}</span></> : ""}
                    {" · "}
                    <span className="font-medium text-primary">{formatFechaHora(config.actualizado_en)}</span>
                </div>
            )}

            <div className="flex flex-col gap-6">
                <Card>
                    <CardHeader titulo="Información del taller" descripcion="Datos públicos" />
                    <CardBody className="grid gap-4 sm:grid-cols-2">
                        <Input label="Nombre" value={form.nombre ?? ""} onChange={set("nombre")} />
                        <Input label="Teléfono" value={form.telefono ?? ""} onChange={set("telefono")} />
                        <Input label="Correo" value={form.correo ?? ""} onChange={set("correo")} />
                        <Input label="Dirección" value={form.direccion ?? ""} onChange={set("direccion")} />
                        <Input label="Horario" value={form.horario ?? ""} onChange={set("horario")} />
                        <Input label="Moneda" value={form.moneda ?? ""} onChange={set("moneda")} />
                        <div className="sm:col-span-2">
                            <TextArea label="URL de Google Maps (embed)" value={form.maps_embed_url ?? ""} onChange={set("maps_embed_url")} placeholder="https://www.google.com/maps/embed?..." />
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader titulo="Parámetros monetarios" descripcion="IVA y descuento máximo configurables" />
                    <CardBody className="grid gap-4 sm:grid-cols-2">
                        <Input label="IVA (%)" type="number" value={String(form.iva_porcentaje ?? 13)} onChange={setNum("iva_porcentaje")} />
                        <Input label="Descuento máximo (%)" type="number" value={String(form.descuento_max ?? 100)} onChange={setNum("descuento_max")} />
                    </CardBody>
                </Card>

                <div className="flex justify-end">
                    <Button color="primary" isLoading={guardando} onClick={guardar}>Guardar configuración</Button>
                </div>
            </div>
        </RequiereRol>
    );
}
