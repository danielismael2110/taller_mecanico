"use client";

import type { ReactNode } from "react";
import { Table, TableCard } from "@/components/application/table/table";
import { PaginationPageDefault } from "@/components/application/pagination/pagination";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { SkeletonTable } from "./skeleton";

export interface Columna<T> {
    key: string;
    header: string;
    render: (fila: T) => ReactNode;
    isRowHeader?: boolean;
}

interface DataTableProps<T> {
    titulo?: string;
    descripcion?: string;
    columnas: Columna<T>[];
    filas: T[];
    getId: (fila: T) => string;
    cargando?: boolean;
    accionesCabecera?: ReactNode;
    onFilaClick?: (fila: T) => void;
    // Paginación
    pagina?: number;
    totalPaginas?: number;
    onCambiarPagina?: (pagina: number) => void;
    mensajeVacio?: string;
}

/** Tabla de datos reutilizable con búsqueda/paginación (UntitledUI Table). */
export function DataTable<T>({
    titulo,
    descripcion,
    columnas,
    filas,
    getId,
    cargando,
    accionesCabecera,
    onFilaClick,
    pagina,
    totalPaginas,
    onCambiarPagina,
    mensajeVacio = "No hay registros para mostrar.",
}: DataTableProps<T>) {
    return (
        <TableCard.Root size="md">
            {(titulo || accionesCabecera) && (
                <TableCard.Header title={titulo ?? ""} description={descripcion} contentTrailing={accionesCabecera} />
            )}

            {cargando ? (
                <SkeletonTable columnas={columnas.length} />
            ) : filas.length === 0 ? (
                <div className="py-12">
                    <EmptyState size="sm">
                        <EmptyState.Header />
                        <EmptyState.Content>
                            <EmptyState.Title>Sin resultados</EmptyState.Title>
                            <EmptyState.Description>{mensajeVacio}</EmptyState.Description>
                        </EmptyState.Content>
                    </EmptyState>
                </div>
            ) : (
                <Table aria-label={titulo ?? "Tabla de datos"}>
                    <Table.Header>
                        {columnas.map((c) => (
                            <Table.Head key={c.key} id={c.key} label={c.header} isRowHeader={c.isRowHeader} />
                        ))}
                    </Table.Header>
                    <Table.Body>
                        {filas.map((fila) => (
                            <Table.Row
                                key={getId(fila)}
                                id={getId(fila)}
                                onAction={onFilaClick ? () => onFilaClick(fila) : undefined}
                                className={onFilaClick ? "cursor-pointer" : undefined}
                            >
                                {columnas.map((c) => (
                                    <Table.Cell key={c.key}>{c.render(fila)}</Table.Cell>
                                ))}
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table>
            )}

            {!cargando && totalPaginas && totalPaginas > 1 && onCambiarPagina && (
                <div className="border-t border-secondary">
                    <PaginationPageDefault page={pagina ?? 1} total={totalPaginas} onPageChange={onCambiarPagina} />
                </div>
            )}
        </TableCard.Root>
    );
}
