import * as XLSX from "xlsx";

/** Exporta un arreglo de objetos a un archivo .xlsx descargable. */
export function exportarExcel(filas: Record<string, unknown>[], nombreArchivo: string, hoja = "Datos") {
    const worksheet = XLSX.utils.json_to_sheet(filas);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, hoja);
    XLSX.writeFile(workbook, `${nombreArchivo}.xlsx`);
}
