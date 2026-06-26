"use client";

import { useState, type ReactNode } from "react";
import { AlertTriangle, Trash01 } from "@untitledui/icons";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";

interface ConfirmacionModalProps {
    abierto: boolean;
    onCerrar: () => void;
    onConfirmar: () => void | Promise<void>;
    titulo: string;
    mensaje: ReactNode;
    textoConfirmar?: string;
    textoCancelar?: string;
    peligro?: boolean;
    cargando?: boolean;
}

/** Modal de confirmación antes de acciones críticas. */
export function ConfirmacionModal({
    abierto,
    onCerrar,
    onConfirmar,
    titulo,
    mensaje,
    textoConfirmar = "Confirmar",
    textoCancelar = "Cancelar",
    peligro = false,
    cargando = false,
}: ConfirmacionModalProps) {
    return (
        <ModalOverlay isOpen={abierto} onOpenChange={(o) => !o && onCerrar()} isDismissable>
            <Modal className="max-w-md">
                <Dialog>
                    <div className="rounded-2xl bg-primary p-6 shadow-xl">
                        <FeaturedIcon color={peligro ? "error" : "warning"} theme="light" size="lg" icon={peligro ? Trash01 : AlertTriangle} />
                        <h2 className="mt-4 text-lg font-semibold text-primary">{titulo}</h2>
                        <div className="mt-1 text-sm text-tertiary">{mensaje}</div>
                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <Button size="md" color="secondary" onClick={onCerrar} isDisabled={cargando} className={cx("sm:min-w-28")}>
                                {textoCancelar}
                            </Button>
                            <Button
                                size="md"
                                color={peligro ? "primary-destructive" : "primary"}
                                onClick={() => onConfirmar()}
                                isLoading={cargando}
                                className="sm:min-w-28"
                            >
                                {textoConfirmar}
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}

/** Hook utilitario para manejar el estado del modal de confirmación. */
export function useConfirmacion() {
    const [abierto, setAbierto] = useState(false);
    const [cargando, setCargando] = useState(false);
    return { abierto, setAbierto, cargando, setCargando };
}
