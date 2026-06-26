"use client";

import { useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Car01, UploadCloud01 } from "@untitledui/icons";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { Card, CardBody } from "@/components/ui/card";
import { FormInput, FormSelect, FormTextArea } from "@/components/ui/form-fields";
import type { Vehiculo } from "@/lib/types/database";
import { mensajeError } from "@/lib/utils/error-handler";
import { vehiculoSchema, type VehiculoInput } from "@/lib/utils/validators";
import { vehiculosService } from "@/services/vehiculos.service";

interface OpcionCliente {
    id: string;
    label: string;
}

interface VehiculoFormProps {
    inicial?: Partial<Vehiculo>;
    clientes: OpcionCliente[];
    clienteFijo?: boolean;
    onGuardar: (datos: VehiculoInput) => Promise<void>;
    onCancelar: () => void;
    textoBoton?: string;
}

/** Formulario reutilizable de vehículo. */
export function VehiculoForm({ inicial, clientes, clienteFijo, onGuardar, onCancelar, textoBoton = "Guardar" }: VehiculoFormProps) {
    const { control, handleSubmit, setValue, formState } = useForm<VehiculoInput>({
        resolver: zodResolver(vehiculoSchema) as unknown as Resolver<VehiculoInput>,
        defaultValues: {
            cliente_id: inicial?.cliente_id ?? "",
            marca: inicial?.marca ?? "",
            modelo: inicial?.modelo ?? "",
            anio: inicial?.anio ?? undefined,
            placa: inicial?.placa ?? "",
            color: inicial?.color ?? "",
            chasis: inicial?.chasis ?? "",
            motor: inicial?.motor ?? "",
            notas: inicial?.notas ?? "",
            foto_url: inicial?.foto_url ?? "",
        },
    });

    const [fotoUrl, setFotoUrl] = useState<string | null>(inicial?.foto_url ?? null);
    const [subiendo, setSubiendo] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const subirFoto = async (file: File) => {
        if (file.size > 15 * 1024 * 1024) return toast.error("La imagen supera los 15 MB.");
        setSubiendo(true);
        try {
            const url = await vehiculosService.subirFotoArchivo(file);
            setFotoUrl(url);
            setValue("foto_url", url);
            toast.success("Foto subida.");
        } catch (e) {
            toast.error(mensajeError(e));
        } finally {
            setSubiendo(false);
        }
    };

    const submit = async (datos: VehiculoInput) => {
        try {
            await onGuardar(datos);
        } catch (e) {
            toast.error(mensajeError(e));
        }
    };

    return (
        <Card>
            <CardBody>
                <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
                    <div>
                        <p className="mb-1.5 text-sm font-medium text-secondary">Foto del vehículo</p>
                        <div className="flex items-center gap-4">
                            {fotoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={fotoUrl} alt="Vehículo" className="h-20 w-28 rounded-lg object-cover ring-1 ring-secondary" />
                            ) : (
                                <div className="flex h-20 w-28 items-center justify-center rounded-lg border border-dashed border-secondary text-fg-quaternary">
                                    <Car01 className="size-6" />
                                </div>
                            )}
                            <div>
                                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && subirFoto(e.target.files[0])} />
                                <Button size="sm" color="secondary" type="button" iconLeading={UploadCloud01} isLoading={subiendo} onClick={() => fileRef.current?.click()}>
                                    {fotoUrl ? "Cambiar foto" : "Subir foto"}
                                </Button>
                                <p className="mt-1 text-xs text-tertiary">JPG, PNG o WebP. Máx. 15 MB.</p>
                            </div>
                        </div>
                    </div>
                    {!clienteFijo && (
                        <FormSelect control={control} name="cliente_id" label="Propietario" items={clientes} isRequired placeholder="Selecciona un cliente" />
                    )}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormInput control={control} name="marca" label="Marca" placeholder="Toyota" isRequired />
                        <FormInput control={control} name="modelo" label="Modelo" placeholder="Corolla" isRequired />
                        <FormInput control={control} name="anio" label="Año" placeholder="2020" type="number" />
                        <FormInput control={control} name="placa" label="Placa" placeholder="1234-ABC" isRequired />
                        <FormInput control={control} name="color" label="Color" placeholder="Blanco" />
                        <FormInput control={control} name="chasis" label="Chasis" placeholder="N° de chasis" />
                        <FormInput control={control} name="motor" label="Motor" placeholder="N° de motor" />
                    </div>
                    <FormTextArea control={control} name="notas" label="Notas" placeholder="Observaciones (opcional)" />

                    <div className="mt-2 flex justify-end gap-3">
                        <Button color="secondary" onClick={onCancelar} type="button">
                            Cancelar
                        </Button>
                        <Button color="primary" type="submit" isLoading={formState.isSubmitting}>
                            {textoBoton}
                        </Button>
                    </div>
                </form>
            </CardBody>
        </Card>
    );
}
