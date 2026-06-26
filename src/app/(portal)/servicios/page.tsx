"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, Clock } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { SearchBar } from "@/components/business/search-bar";
import { serviciosService } from "@/services/servicios.service";
import type { Servicio } from "@/lib/types/database";
import { formatDuracion, formatMoneda } from "@/lib/utils/formatters";

export default function CatalogoServiciosPage() {
    const [servicios, setServicios] = useState<Servicio[]>([]);
    const [cargando, setCargando] = useState(true);
    const [busqueda, setBusqueda] = useState("");

    useEffect(() => {
        serviciosService
            .listar(true)
            .then(setServicios)
            .catch(() => setServicios([]))
            .finally(() => setCargando(false));
    }, []);

    const filtrados = useMemo(
        () => servicios.filter((s) => s.nombre.toLowerCase().includes(busqueda.toLowerCase())),
        [servicios, busqueda],
    );

    const categorias = useMemo(() => {
        const map = new Map<string, Servicio[]>();
        for (const s of filtrados) {
            const cat = s.categoria ?? "General";
            if (!map.has(cat)) map.set(cat, []);
            map.get(cat)!.push(s);
        }
        return Array.from(map.entries());
    }, [filtrados]);

    return (
        <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-primary lg:text-4xl">Catálogo de servicios</h1>
                <p className="mt-2 text-tertiary">Selecciona un servicio y reserva tu cita en línea.</p>
            </div>

            <div className="mx-auto mt-8 max-w-md">
                <SearchBar onBuscar={setBusqueda} placeholder="Buscar servicio..." />
            </div>

            {cargando ? (
                <div className="mt-16 flex justify-center">
                    <Spinner size="lg" label="Cargando servicios..." />
                </div>
            ) : categorias.length === 0 ? (
                <p className="mt-16 text-center text-tertiary">No se encontraron servicios.</p>
            ) : (
                <div className="mt-10 flex flex-col gap-12">
                    {categorias.map(([categoria, items]) => (
                        <div key={categoria}>
                            <h2 className="mb-4 text-xl font-semibold text-primary">{categoria}</h2>
                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {items.map((s) => (
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
                                        <Button size="md" color="primary" href="/login" className="mt-4" iconLeading={Calendar}>
                                            Reservar cita
                                        </Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
