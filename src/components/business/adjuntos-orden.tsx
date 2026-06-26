"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileX02, Paperclip, UploadCloud01 } from "@untitledui/icons";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import type { AdjuntoOrden } from "@/lib/types/database";
import { mensajeError } from "@/lib/utils/error-handler";
import { ordenesService } from "@/services/ordenes.service";

/**
 * Adjuntos de la OT. El personal interno (recepción/mecánico) puede
 * subir fotos o documentos; el cliente los ve en modo solo lectura.
 */
export function AdjuntosOrden({ ordenId, puedeSubir = false }: { ordenId: string; puedeSubir?: boolean }) {
    const [adjuntos, setAdjuntos] = useState<AdjuntoOrden[]>([]);
    const [subiendo, setSubiendo] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const cargar = useCallback(() => {
        ordenesService.adjuntos(ordenId).then(setAdjuntos).catch(() => setAdjuntos([]));
    }, [ordenId]);

    useEffect(() => {
        cargar();
    }, [cargar]);

    const subir = async (file: File) => {
        if (file.size > 15 * 1024 * 1024) return toast.error("El archivo supera los 15 MB.");
        setSubiendo(true);
        try {
            await ordenesService.subirAdjunto(ordenId, file);
            toast.success("Adjunto subido.");
            cargar();
        } catch (e) {
            toast.error(mensajeError(e));
        } finally {
            setSubiendo(false);
        }
    };

    return (
        <div>
            {puedeSubir && (
                <div className="mb-4">
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && subir(e.target.files[0])}
                    />
                    <Button size="sm" color="secondary" iconLeading={UploadCloud01} isLoading={subiendo} onClick={() => fileRef.current?.click()}>
                        Subir adjunto
                    </Button>
                    <p className="mt-1 text-xs text-tertiary">Fotos o PDF, máx. 15 MB.</p>
                </div>
            )}

            {adjuntos.length === 0 ? (
                <p className="text-sm text-tertiary">Sin adjuntos.</p>
            ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {adjuntos.map((a) => {
                        const esImagen = a.tipo === "imagen" || /\.(jpe?g|png|webp|gif)$/i.test(a.url);
                        return (
                            <a
                                key={a.id}
                                href={a.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group block overflow-hidden rounded-lg ring-1 ring-secondary transition hover:ring-brand"
                            >
                                {esImagen ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={a.url} alt={a.nombre_archivo ?? "Adjunto"} className="h-28 w-full object-cover" />
                                ) : (
                                    <div className="flex h-28 w-full flex-col items-center justify-center gap-1 bg-secondary text-fg-quaternary">
                                        <FileX02 className="size-7" />
                                        <span className="px-2 text-center text-xs text-tertiary">{a.nombre_archivo ?? "Documento"}</span>
                                    </div>
                                )}
                            </a>
                        );
                    })}
                </div>
            )}

            {!puedeSubir && adjuntos.length > 0 && (
                <p className="mt-2 flex items-center gap-1 text-xs text-quaternary">
                    <Paperclip className="size-3.5" /> Evidencias subidas por el taller.
                </p>
            )}
        </div>
    );
}
