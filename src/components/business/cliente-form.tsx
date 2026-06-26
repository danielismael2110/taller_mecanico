"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Mail01, Phone, User01 } from "@untitledui/icons";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { Card, CardBody } from "@/components/ui/card";
import { FormInput, FormTextArea } from "@/components/ui/form-fields";
import type { Cliente } from "@/lib/types/database";
import { mensajeError } from "@/lib/utils/error-handler";
import { clienteSchema, type ClienteInput } from "@/lib/utils/validators";

interface ClienteFormProps {
    inicial?: Partial<Cliente>;
    onGuardar: (datos: ClienteInput) => Promise<void>;
    onCancelar: () => void;
    textoBoton?: string;
}

/** Formulario reutilizable de cliente con validación. */
export function ClienteForm({ inicial, onGuardar, onCancelar, textoBoton = "Guardar" }: ClienteFormProps) {
    const { control, handleSubmit, formState } = useForm<ClienteInput>({
        resolver: zodResolver(clienteSchema),
        defaultValues: {
            nombre: inicial?.nombre ?? "",
            telefono: inicial?.telefono ?? "",
            correo: inicial?.correo ?? "",
            ci_nit: inicial?.ci_nit ?? "",
            direccion: inicial?.direccion ?? "",
            notas: inicial?.notas ?? "",
        },
    });

    const submit = async (datos: ClienteInput) => {
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
                        <FormInput control={control} name="nombre" label="Nombre completo" placeholder="Nombre del cliente" icon={User01} isRequired />
                        <FormInput control={control} name="ci_nit" label="CI / NIT" placeholder="Documento" />
                        <FormInput control={control} name="telefono" label="Teléfono" placeholder="Teléfono" icon={Phone} />
                        <FormInput control={control} name="correo" label="Correo" placeholder="correo@ejemplo.com" icon={Mail01} type="email" />
                    </div>
                    <FormInput control={control} name="direccion" label="Dirección" placeholder="Dirección" />
                    <FormTextArea control={control} name="notas" label="Notas" placeholder="Observaciones internas (opcional)" />

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
