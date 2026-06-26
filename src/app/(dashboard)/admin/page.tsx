"use client";

import { useEffect, useState } from "react";
import {
    AlertTriangle,
    Calendar,
    ClipboardCheck,
    Coins01,
    TrendUp01,
} from "@untitledui/icons";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip as RTooltip,
    XAxis,
    YAxis,
} from "recharts";
import { Card, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/use-auth";
import { formatMoneda } from "@/lib/utils/formatters";
import { reportesService } from "@/services/reportes.service";
import type { VCargaMecanicos, VIngresos, VTopServicios } from "@/lib/types/database";

const COLORES_PIE = ["#5c0b8b", "#0e7490", "#43377c", "#15803d", "#b45309", "#be123c"];

interface Metricas {
    ingresoTotal: number;
    ordenesTotales: number;
    ordenesAbiertas: number;
    citasHoy: number;
    stockCriticoCount: number;
}

export default function AdminDashboardPage() {
    const { perfil } = useAuth();
    const [metricas, setMetricas] = useState<Metricas | null>(null);
    const [ingresos, setIngresos] = useState<VIngresos[]>([]);
    const [topServicios, setTopServicios] = useState<VTopServicios[]>([]);
    const [carga, setCarga] = useState<VCargaMecanicos[]>([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        Promise.all([
            reportesService.metricasDashboard(),
            reportesService.ingresos(),
            reportesService.topServicios(),
            reportesService.cargaMecanicos(),
        ])
            .then(([m, i, t, c]) => {
                setMetricas(m);
                setIngresos(i.map((x) => ({ ...x, dia: new Date(x.dia).toLocaleDateString("es-BO", { day: "2-digit", month: "short" }) })));
                setTopServicios(t);
                setCarga(c);
            })
            .catch(() => {})
            .finally(() => setCargando(false));
    }, []);

    if (cargando) {
        return (
            <div className="flex justify-center py-20">
                <Spinner size="lg" label="Cargando panel..." />
            </div>
        );
    }

    return (
        <div>
            <PageHeader titulo={`Hola, ${perfil?.nombre ?? "bienvenido"} 👋`} descripcion="Resumen general del taller." />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard titulo="Ingresos cobrados" valor={formatMoneda(metricas?.ingresoTotal)} icono={Coins01} color="bg-success-solid" tendencia={{ valor: 12, positiva: true }} />
                <StatCard titulo="Órdenes totales" valor={metricas?.ordenesTotales ?? 0} icono={ClipboardCheck} color="bg-brand-solid" />
                <StatCard titulo="Órdenes abiertas" valor={metricas?.ordenesAbiertas ?? 0} icono={TrendUp01} color="bg-blue-solid" />
                <StatCard titulo="Citas de hoy" valor={metricas?.citasHoy ?? 0} icono={Calendar} color="bg-purple-solid" />
            </div>

            {(metricas?.stockCriticoCount ?? 0) > 0 && (
                <div className="mt-4 flex items-center gap-3 rounded-xl bg-warning-primary px-4 py-3 ring-1 ring-warning">
                    <AlertTriangle className="size-5 text-warning-primary" />
                    <p className="text-sm font-medium text-warning-primary">
                        {metricas?.stockCriticoCount} repuesto(s) en stock crítico. Revisa el inventario.
                    </p>
                </div>
            )}

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader titulo="Ingresos" descripcion="Pagos validados por día" />
                    <div className="h-72 p-4">
                        {ingresos.length === 0 ? (
                            <p className="flex h-full items-center justify-center text-sm text-tertiary">Sin datos de ingresos aún.</p>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={ingresos}>
                                    <defs>
                                        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#5c0b8b" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#5c0b8b" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e7ec" vertical={false} />
                                    <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <RTooltip formatter={(v) => formatMoneda(Number(v))} />
                                    <Area type="monotone" dataKey="ingresos" stroke="#5c0b8b" fill="url(#grad)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </Card>

                <Card>
                    <CardHeader titulo="Top servicios" descripcion="Más realizados" />
                    <div className="h-72 p-4">
                        {topServicios.length === 0 ? (
                            <p className="flex h-full items-center justify-center text-sm text-tertiary">Sin datos.</p>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={topServicios} dataKey="veces" nameKey="nombre" cx="50%" cy="50%" outerRadius={90}>
                                        {topServicios.map((_, i) => (
                                            <Cell key={i} fill={COLORES_PIE[i % COLORES_PIE.length]} />
                                        ))}
                                    </Pie>
                                    <RTooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </Card>
            </div>

            <Card className="mt-6">
                <CardHeader titulo="Carga de trabajo por mecánico" descripcion="Órdenes asignadas" />
                <div className="h-72 p-4">
                    {carga.length === 0 ? (
                        <p className="flex h-full items-center justify-center text-sm text-tertiary">Sin mecánicos registrados.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={carga}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e4e7ec" vertical={false} />
                                <XAxis dataKey="nombre" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                                <RTooltip />
                                <Bar dataKey="ots_asignadas" name="Órdenes" fill="#5c0b8b" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </Card>
        </div>
    );
}
