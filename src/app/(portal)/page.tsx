"use client";

import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle, Clock, Tool01, Wallet01, Calendar } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Card } from "@/components/ui/card";
import { useTallerContext } from "@/contexts/taller-context";
import { serviciosService } from "@/services/servicios.service";
import type { Servicio } from "@/lib/types/database";
import { formatMoneda, formatDuracion } from "@/lib/utils/formatters";

const VENTAJAS = [
    { icon: Tool01, titulo: "Mecánicos certificados", texto: "Personal capacitado y herramientas modernas para tu vehículo." },
    { icon: Clock, titulo: "Entrega puntual", texto: "Seguimiento en tiempo real del estado de tu orden de trabajo." },
    { icon: Wallet01, titulo: "Precios transparentes", texto: "Presupuestos claros que apruebas antes de iniciar la reparación." },
];

export default function LandingPage() {
    const { config } = useTallerContext();
    const [servicios, setServicios] = useState<Servicio[]>([]);

    useEffect(() => {
        serviciosService.destacados(6).then(setServicios).catch(() => setServicios([]));
    }, []);

    return (
        <div>
            {/* Hero */}
            <section className="relative overflow-hidden bg-secondary">
                <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 lg:grid-cols-2 lg:px-8 lg:py-24">
                    <div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-primary_alt px-3 py-1 text-sm font-medium text-brand-secondary">
                            <CheckCircle className="size-4" /> Taller mecánico de confianza
                        </span>
                        <h1 className="mt-4 text-4xl font-bold tracking-tight text-primary lg:text-5xl">
                            Cuidamos tu vehículo como si fuera nuestro
                        </h1>
                        <p className="mt-4 text-lg text-tertiary">
                            En {config?.nombre ?? "GaraGato"} ofrecemos diagnóstico, mantenimiento y reparación con seguimiento en
                            línea de cada orden de trabajo.
                        </p>
                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Button size="xl" color="primary" href="/register" iconTrailing={ArrowRight}>
                                Solicita tu cita
                            </Button>
                            <Button size="xl" color="secondary" href="/servicios">
                                Ver servicios
                            </Button>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br from-brand-solid to-brand-solid_hover p-8 shadow-xl">
                            <div className="flex h-full flex-col justify-between text-white">
                                <Tool01 className="size-12 opacity-80" />
                                <div>
                                    <p className="text-3xl font-bold">+15 años</p>
                                    <p className="opacity-90">de experiencia al servicio de tu auto</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Ventajas */}
            <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
                <div className="grid gap-6 md:grid-cols-3">
                    {VENTAJAS.map((v) => (
                        <Card key={v.titulo} className="p-6">
                            <span className="flex size-11 items-center justify-center rounded-lg bg-brand-primary_alt text-brand-secondary">
                                <v.icon className="size-6" />
                            </span>
                            <h3 className="mt-4 text-lg font-semibold text-primary">{v.titulo}</h3>
                            <p className="mt-1 text-sm text-tertiary">{v.texto}</p>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Servicios destacados */}
            <section className="bg-secondary py-16">
                <div className="mx-auto max-w-7xl px-4 lg:px-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-primary">Servicios destacados</h2>
                        <p className="mt-2 text-tertiary">Conoce algunos de los servicios que ofrecemos.</p>
                    </div>
                    <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {servicios.length === 0 ? (
                            <p className="col-span-full text-center text-tertiary">Pronto publicaremos nuestro catálogo.</p>
                        ) : (
                            servicios.map((s) => (
                                <Card key={s.id} className="flex flex-col overflow-hidden">
                                    {s.imagen_url && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={s.imagen_url} alt={s.nombre} className="h-40 w-full object-cover" />
                                    )}
                                    <div className="flex flex-1 flex-col p-6">
                                    <h3 className="text-lg font-semibold text-primary">{s.nombre}</h3>
                                    {s.descripcion && <p className="mt-1 flex-1 text-sm text-tertiary">{s.descripcion}</p>}
                                    <div className="mt-4 flex items-center justify-between">
                                        <span className="text-lg font-bold text-brand-secondary">{formatMoneda(s.precio)}</span>
                                        {s.tiempo_estimado_min && (
                                            <span className="flex items-center gap-1 text-sm text-tertiary">
                                                <Clock className="size-4" /> {formatDuracion(s.tiempo_estimado_min)}
                                            </span>
                                        )}
                                    </div>
                                    <Button size="md" color="secondary" href="/login" className="mt-4" iconLeading={Calendar}>
                                        Reservar
                                    </Button>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                    <div className="mt-10 text-center">
                        <Button size="lg" color="primary" href="/servicios" iconTrailing={ArrowRight}>
                            Ver catálogo completo
                        </Button>
                    </div>
                </div>
            </section>

            {/* Ubicación / mapa */}
            {config?.maps_embed_url && (
                <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
                    <h2 className="mb-6 text-2xl font-bold text-primary">¿Dónde estamos?</h2>
                    <div className="aspect-video w-full overflow-hidden rounded-2xl ring-1 ring-secondary">
                        <iframe src={config.maps_embed_url} className="h-full w-full" loading="lazy" title="Ubicación del taller" />
                    </div>
                </section>
            )}
        </div>
    );
}
