"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { Card, CardBody } from "@/components/ui/card";
import { FormInput, FormTextArea } from "@/components/ui/form-fields";
import type { Repuesto } from "@/lib/types/database";
import { mensajeError } from "@/lib/utils/error-handler";
import { repuestoSchema, type RepuestoInput } from "@/lib/utils/validators";

interface RepuestoFormProps {
    inicial?: Partial<Repuesto>;
    onGuardar: (datos: RepuestoInput) => Promise<void>;
    onCancelar: () => void;
    textoBoton?: string;
    ocultarStock?: boolean;
}

/** Formulario reutilizable de repuesto. */
export function RepuestoForm({ inicial, onGuardar, onCancelar, textoBoton = "Guardar", ocultarStock }: RepuestoFormProps) {
    const { control, handleSubmit, formState } = useForm<RepuestoInput>({
        resolver: zodResolver(repuestoSchema) as unknown as Resolver<RepuestoInput>,
        defaultValues: {
            codigo: inicial?.codigo ?? "",
            nombre: inicial?.nombre ?? "",
            categoria: inicial?.categoria ?? "",
            descripcion: inicial?.descripcion ?? "",
            precio_compra: inicial?.precio_compra ?? 0,
            precio_venta: inicial?.precio_venta ?? 0,
            stock: inicial?.stock ?? 0,
            stock_minimo: inicial?.stock_minimo ?? 0,
            ubicacion: inicial?.ubicacion ?? "",
        },
    });

    const submit = async (datos: RepuestoInput) => {
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
                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormInput control={control} name="codigo" label="Código" placeholder="REP-001" isRequired />
                        <FormInput control={control} name="nombre" label="Nombre" placeholder="Filtro de aceite" isRequired />
                        <FormInput control={control} name="categoria" label="Categoría" placeholder="Filtros" />
                        <FormInput control={control} name="ubicacion" label="Ubicación" placeholder="Estante A-3" />
                        <FormInput control={control} name="precio_compra" label="Precio de compra (Bs)" type="number" />
                        <FormInput control={control} name="precio_venta" label="Precio de venta (Bs)" type="number" />
                        {!ocultarStock && <FormInput control={control} name="stock" label="Stock inicial" type="number" />}
                        <FormInput control={control} name="stock_minimo" label="Stock mínimo (alerta)" type="number" />
                    </div>
                    <FormTextArea control={control} name="descripcion" label="Descripción" placeholder="Detalles del repuesto (opcional)" />

                    <div className="mt-2 flex justify-end gap-3">
                        <Button color="secondary" onClick={onCancelar} type="button">Cancelar</Button>
                        <Button color="primary" type="submit" isLoading={formState.isSubmitting}>{textoBoton}</Button>
                    </div>
                </form>
            </CardBody>
        </Card>
    );
}
