"use client";

import { useCallback, useEffect, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { Input } from "@/components/base/input/input";
import { ExportarButton } from "@/components/business/exportar-button";
import { RequiereRol } from "@/components/layout/requiere-rol";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { DataTable, type Columna } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { mensajeError } from "@/lib/utils/error-handler";
import { exportarExcel } from "@/lib/utils/excel-export";
import { formatFecha, formatMoneda } from "@/lib/utils/formatters";
import { exportarTablaPDF } from "@/lib/utils/pdf-generator";
import { reportesService } from "@/services/reportes.service";
import type { VCargaMecanicos, VIngresos, VStockCritico, VTopServicios } from "@/lib/types/database";

const COLORES = ["#5c0b8b", "#0e7490", "#43377c", "#15803d", "#b45309", "#be123c", "#1d4ed8", "#7e22ce", "#be185d", "#0f766e"];

export default function ReportesPage() {
    const [ingresos, setIngresos] = useState<VIngresos[]>([]);
    const [top, setTop] = useState<VTopServicios[]>([]);
    const [carga, setCarga] = useState<VCargaMecanicos[]>([]);
    const [critico, setCritico] = useState<VStockCritico[]>([]);
    const [desde, setDesde] = useState("");
    const [hasta, setHasta] = useState("");

    const cargarIngresos = useCallback(async () => {
        try {
            setIngresos(await reportesService.ingresos(desde || undefined, hasta || undefined));
        } catch (e) {
            toast.error(mensajeError(e));
        }
    }, [desde, hasta]);

    useEffect(() => {
        cargarIngresos();
    }, [cargarIngresos]);

    useEffect(() => {
        Promise.all([reportesService.topServicios(), reportesService.cargaMecanicos(), reportesService.stockCritico()])
            .then(([t, c, s]) => { setTop(t); setCarga(c); setCritico(s); })
            .catch((e) => toast.error(mensajeError(e)));
    }, []);

    const totalIngresos = ingresos.reduce((acc, i) => acc + Number(i.ingresos ?? 0), 0);
    const ingresosChart = ingresos.map((i) => ({ dia: formatFecha(i.dia), ingresos: Number(i.ingresos ?? 0) }));

    // --- Exportaciones (RF-091) ---
    const expIngresosPDF = () => exportarTablaPDF("Ingresos por día", ["Día", "Ingresos"], ingresos.map((i) => [formatFecha(i.dia), formatMoneda(i.ingresos)]), "ingresos", `Total: ${formatMoneda(totalIngresos)}`);
    const expIngresosExcel = () => exportarExcel(ingresos.map((i) => ({ Día: formatFecha(i.dia), Ingresos: Number(i.ingresos ?? 0) })), "ingresos");
    const expTopPDF = () => exportarTablaPDF("Top 10 servicios", ["Servicio", "Veces", "Total"], top.map((t) => [t.nombre, t.veces, formatMoneda(t.total)]), "top-servicios");
    const expTopExcel = () => exportarExcel(top.map((t) => ({ Servicio: t.nombre, Veces: t.veces, Total: Number(t.total ?? 0) })), "top-servicios");
    const expCargaPDF = () => exportarTablaPDF("Carga por mecánico", ["Mecánico", "Órdenes", "Horas"], carga.map((c) => [c.nombre, c.ots_asignadas, c.horas_totales]), "carga-mecanicos");
    const expCargaExcel = () => exportarExcel(carga.map((c) => ({ Mecánico: c.nombre, Órdenes: c.ots_asignadas, Horas: Number(c.horas_totales ?? 0) })), "carga-mecanicos");
    const expStockPDF = () => exportarTablaPDF("Stock crítico", ["Código", "Nombre", "Stock", "Mínimo"], critico.map((c) => [c.codigo, c.nombre, c.stock, c.stock_minimo]), "stock-critico");
    const expStockExcel = () => exportarExcel(critico.map((c) => ({ Código: c.codigo, Nombre: c.nombre, Stock: c.stock, Mínimo: c.stock_minimo })), "stock-critico");

    const colsCritico: Columna<VStockCritico>[] = [
        { key: "codigo", header: "Código", isRowHeader: true, render: (r) => r.codigo },
        { key: "nombre", header: "Nombre", render: (r) => r.nombre },
        { key: "stock", header: "Stock", render: (r) => r.stock },
        { key: "minimo", header: "Mínimo", render: (r) => r.stock_minimo },
    ];

    return (
        <RequiereRol roles={["admin"]}>
            <PageHeader titulo="Reportes" descripcion="Indicadores del taller." />

            {/* RF-087: Ingresos por día con filtros de fecha */}
            <Card className="mb-6">
                <CardHeader
                    titulo="Ingresos por día"
                    descripcion="Pagos validados"
                    accion={<ExportarButton onPDF={expIngresosPDF} onExcel={expIngresosExcel} />}
                />
                <CardBody>
                    <div className="mb-4 flex flex-wrap items-end gap-4">
                        <div className="w-44"><Input label="Desde" type="date" value={desde} onChange={setDesde} /></div>
                        <div className="w-44"><Input label="Hasta" type="date" value={hasta} onChange={setHasta} /></div>
                        <div className="ml-auto text-right">
                            <p className="text-xs text-tertiary">Total del periodo</p>
                            <p className="text-2xl font-semibold text-primary">{formatMoneda(totalIngresos)}</p>
                        </div>
                    </div>
                    <div className="h-72">
                        {ingresosChart.length === 0 ? <Vacio /> : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={ingresosChart}>
                                    <defs>
                                        <linearGradient id="gradIng" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#5c0b8b" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#5c0b8b" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e7ec" vertical={false} />
                                    <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <RTooltip formatter={(v) => formatMoneda(Number(v))} />
                                    <Area type="monotone" dataKey="ingresos" stroke="#5c0b8b" fill="url(#gradIng)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </CardBody>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* RF-088: Top 10 servicios */}
                <Card>
                    <CardHeader titulo="Top 10 servicios" accion={<ExportarButton onPDF={expTopPDF} onExcel={expTopExcel} />} />
                    <div className="h-72 p-4">
                        {top.length === 0 ? <Vacio /> : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={top} dataKey="veces" nameKey="nombre" cx="50%" cy="50%" outerRadius={90}>
                                        {top.map((_, i) => <Cell key={i} fill={COLORES[i % COLORES.length]} />)}
                                    </Pie>
                                    <RTooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </Card>

                {/* RF-090: Carga por mecánico */}
                <Card>
                    <CardHeader titulo="Carga por mecánico" accion={<ExportarButton onPDF={expCargaPDF} onExcel={expCargaExcel} />} />
                    <div className="h-72 p-4">
                        {carga.length === 0 ? <Vacio /> : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={carga}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e7ec" vertical={false} />
                                    <XAxis dataKey="nombre" tick={{ fontSize: 12 }} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                                    <RTooltip />
                                    <Bar dataKey="ots_asignadas" name="Órdenes" fill="#5c0b8b" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </Card>
            </div>

            {/* RF-089: Stock crítico */}
            <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-primary">Repuestos en stock crítico</h2>
                    <ExportarButton onPDF={expStockPDF} onExcel={expStockExcel} />
                </div>
                <DataTable columnas={colsCritico} filas={critico} getId={(r) => r.id} mensajeVacio="No hay repuestos en stock crítico." />
            </div>

            {/* Detalle de servicios */}
            <div className="mt-6">
                <Card>
                    <CardHeader titulo="Servicios más realizados — detalle" />
                    <div className="p-4">
                        {top.length === 0 ? <p className="text-sm text-tertiary">Sin datos.</p> : (
                            <ul className="divide-y divide-secondary">
                                {top.map((t) => (
                                    <li key={t.id} className="flex justify-between py-2 text-sm">
                                        <span className="text-primary">{t.nombre}</span>
                                        <span className="text-tertiary">{t.veces} veces · {formatMoneda(t.total)}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </Card>
            </div>
        </RequiereRol>
    );
}

function Vacio() {
    return <p className="flex h-full items-center justify-center text-sm text-tertiary">Sin datos disponibles.</p>;
}
