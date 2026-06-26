"use client";

import { Clock, Mail01, MarkerPin01, Phone, Tool01 } from "@untitledui/icons";
import Link from "next/link";
import { useTallerContext } from "@/contexts/taller-context";

/** Pie de página del portal con la información del taller. */
export function PublicFooter() {
    const { config } = useTallerContext();

    return (
        <footer className="border-t border-secondary bg-secondary">
            <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="flex size-9 items-center justify-center rounded-lg bg-brand-solid text-white">
                            <Tool01 className="size-5" />
                        </span>
                        <span className="text-lg font-bold text-primary">GaraGato</span>
                    </div>
                    <p className="mt-3 text-sm text-tertiary">{config?.nombre ?? "Taller Mecánico GaraGato"}</p>
                </div>

                <div>
                    <h4 className="text-sm font-semibold text-primary">Enlaces</h4>
                    <ul className="mt-3 flex flex-col gap-2 text-sm text-tertiary">
                        <li><Link href="/servicios" className="hover:text-primary">Servicios</Link></li>
                        <li><Link href="/contacto" className="hover:text-primary">Contacto</Link></li>
                        <li><Link href="/login" className="hover:text-primary">Iniciar sesión</Link></li>
                        <li><Link href="/register" className="hover:text-primary">Registrarse</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-sm font-semibold text-primary">Contacto</h4>
                    <ul className="mt-3 flex flex-col gap-2 text-sm text-tertiary">
                        {config?.telefono && (
                            <li className="flex items-center gap-2"><Phone className="size-4" /> {config.telefono}</li>
                        )}
                        {config?.correo && (
                            <li className="flex items-center gap-2"><Mail01 className="size-4" /> {config.correo}</li>
                        )}
                        {config?.direccion && (
                            <li className="flex items-center gap-2"><MarkerPin01 className="size-4" /> {config.direccion}</li>
                        )}
                    </ul>
                </div>

                <div>
                    <h4 className="text-sm font-semibold text-primary">Horario</h4>
                    <p className="mt-3 flex items-start gap-2 text-sm text-tertiary">
                        <Clock className="mt-0.5 size-4 shrink-0" />
                        {config?.horario ?? "Lun-Vie 8:00-18:00, Sáb 8:00-13:00"}
                    </p>
                </div>
            </div>
            <div className="border-t border-secondary py-4 text-center text-xs text-quaternary">
                © {new Date().getFullYear()} GaraGato. Todos los derechos reservados.
            </div>
        </footer>
    );
}
