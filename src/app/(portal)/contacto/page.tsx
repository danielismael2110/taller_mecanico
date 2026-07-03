"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, Mail01, MarkerPin01, Phone, Send01, User01 } from "@untitledui/icons";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { Card } from "@/components/ui/card";
import { FormInput, FormTextArea } from "@/components/ui/form-fields";
import { useTallerContext } from "@/contexts/taller-context";
import { contactoSchema, type ContactoInput } from "@/lib/utils/validators";
import { mensajeError } from "@/lib/utils/error-handler";
import { useMapsEmbed } from "@/hooks/use-maps-embed";
import { configuracionService } from "@/services/configuracion.service";

export default function ContactoPage() {
    const { config } = useTallerContext();
    const mapsUrl = useMapsEmbed(config?.maps_embed_url);
    const [enviado, setEnviado] = useState(false);
    const { control, handleSubmit, reset, formState } = useForm<ContactoInput>({
        resolver: zodResolver(contactoSchema),
        defaultValues: { nombre: "", correo: "", telefono: "", mensaje: "" },
    });

    const onSubmit = async (data: ContactoInput) => {
        try {
            await configuracionService.enviarContacto(data);
            setEnviado(true);
            reset();
            toast.success("Mensaje enviado. Te contactaremos pronto.");
        } catch (e) {
            toast.error(mensajeError(e));
        }
    };

    return (
        <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-primary lg:text-4xl">Contáctanos</h1>
                <p className="mt-2 text-tertiary">¿Tienes dudas? Escríbenos y te responderemos a la brevedad.</p>
            </div>

            <div className="mt-10 grid gap-8 lg:grid-cols-2">
                <Card className="p-6">
                    {enviado ? (
                        <div className="flex flex-col items-center py-10 text-center">
                            <CheckCircle className="size-12 text-success-primary" />
                            <h2 className="mt-4 text-lg font-semibold text-primary">¡Mensaje enviado!</h2>
                            <p className="mt-1 text-sm text-tertiary">Gracias por escribirnos. Te contactaremos pronto.</p>
                            <Button color="secondary" className="mt-6" onClick={() => setEnviado(false)}>
                                Enviar otro mensaje
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                            <FormInput control={control} name="nombre" label="Nombre" placeholder="Tu nombre" icon={User01} isRequired />
                            <FormInput control={control} name="correo" label="Correo" placeholder="tucorreo@ejemplo.com" icon={Mail01} type="email" />
                            <FormInput control={control} name="telefono" label="Teléfono" placeholder="Tu teléfono" icon={Phone} />
                            <FormTextArea control={control} name="mensaje" label="Mensaje" placeholder="¿En qué podemos ayudarte?" isRequired />
                            <Button type="submit" size="lg" color="primary" iconLeading={Send01} isLoading={formState.isSubmitting}>
                                Enviar mensaje
                            </Button>
                        </form>
                    )}
                </Card>

                <div className="flex flex-col gap-4">
                    <Card className="flex items-start gap-3 p-5">
                        <span className="flex size-10 items-center justify-center rounded-lg bg-brand-primary_alt text-brand-secondary">
                            <Phone className="size-5" />
                        </span>
                        <div>
                            <p className="text-sm font-semibold text-primary">Teléfono</p>
                            <p className="text-sm text-tertiary">{config?.telefono ?? "—"}</p>
                        </div>
                    </Card>
                    <Card className="flex items-start gap-3 p-5">
                        <span className="flex size-10 items-center justify-center rounded-lg bg-brand-primary_alt text-brand-secondary">
                            <Mail01 className="size-5" />
                        </span>
                        <div>
                            <p className="text-sm font-semibold text-primary">Correo</p>
                            <p className="text-sm text-tertiary">{config?.correo ?? "—"}</p>
                        </div>
                    </Card>
                    <Card className="flex items-start gap-3 p-5">
                        <span className="flex size-10 items-center justify-center rounded-lg bg-brand-primary_alt text-brand-secondary">
                            <MarkerPin01 className="size-5" />
                        </span>
                        <div>
                            <p className="text-sm font-semibold text-primary">Dirección</p>
                            <p className="text-sm text-tertiary">{config?.direccion ?? "—"}</p>
                        </div>
                    </Card>
                    {mapsUrl && (
                        <div className="aspect-video w-full overflow-hidden rounded-xl ring-1 ring-secondary">
                            <iframe src={mapsUrl} className="h-full w-full" loading="lazy" title="Ubicación" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
