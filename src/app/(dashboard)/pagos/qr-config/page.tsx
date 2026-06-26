"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, UploadCloud01 } from "@untitledui/icons";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { TextArea } from "@/components/base/textarea/textarea";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import { useTallerContext } from "@/contexts/taller-context";
import { mensajeError } from "@/lib/utils/error-handler";
import { configuracionService } from "@/services/configuracion.service";

export default function QRConfigPage() {
    const router = useRouter();
    const { config, refrescar } = useTallerContext();
    const fileRef = useRef<HTMLInputElement>(null);
    const [titular, setTitular] = useState("");
    const [banco, setBanco] = useState("");
    const [instrucciones, setInstrucciones] = useState("");
    const [qrUrl, setQrUrl] = useState<string | null>(null);
    const [guardando, setGuardando] = useState(false);
    const [subiendo, setSubiendo] = useState(false);

    useEffect(() => {
        if (config) {
            setTitular(config.qr_titular ?? "");
            setBanco(config.qr_banco ?? "");
            setInstrucciones(config.qr_instrucciones ?? "");
            setQrUrl(config.qr_imagen_url);
        }
    }, [config]);

    const subir = async (file: File) => {
        setSubiendo(true);
        try {
            const url = await configuracionService.subirQR(file);
            setQrUrl(url);
            await refrescar();
            toast.success("QR actualizado.");
        } catch (e) {
            toast.error(mensajeError(e));
        } finally {
            setSubiendo(false);
        }
    };

    const guardar = async () => {
        setGuardando(true);
        try {
            await configuracionService.actualizar({ qr_titular: titular, qr_banco: banco, qr_instrucciones: instrucciones });
            await refrescar();
            toast.success("Datos del QR guardados.");
        } catch (e) {
            toast.error(mensajeError(e));
        } finally {
            setGuardando(false);
        }
    };

    if (!config) {
        return (
            <div className="flex justify-center py-20">
                <Spinner size="lg" label="Cargando..." />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl">
            <Button color="link-gray" iconLeading={ArrowLeft} href="/pagos" className="mb-4">Volver a pagos</Button>
            <PageHeader titulo="Configuración del QR" descripcion="Configura el QR estático del taller." />

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader titulo="Imagen del QR" />
                    <CardBody className="flex flex-col items-center gap-4">
                        {qrUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={qrUrl} alt="QR del taller" className="size-48 rounded-lg object-contain ring-1 ring-secondary" />
                        ) : (
                            <div className="flex size-48 items-center justify-center rounded-lg border border-dashed border-secondary text-sm text-tertiary">
                                Sin QR
                            </div>
                        )}
                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && subir(e.target.files[0])}
                        />
                        <Button color="secondary" iconLeading={UploadCloud01} isLoading={subiendo} onClick={() => fileRef.current?.click()}>
                            Subir imagen QR
                        </Button>
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader titulo="Datos de la cuenta" />
                    <CardBody className="flex flex-col gap-4">
                        <Input label="Titular" value={titular} onChange={setTitular} placeholder="Nombre del titular" />
                        <Input label="Banco" value={banco} onChange={setBanco} placeholder="Banco" />
                        <TextArea label="Instrucciones" value={instrucciones} onChange={setInstrucciones} placeholder="Instrucciones para el cliente" />
                        <Button color="primary" isLoading={guardando} onClick={guardar}>Guardar datos</Button>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}
