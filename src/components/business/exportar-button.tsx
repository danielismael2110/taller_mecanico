"use client";

import { ChevronDown, Download01, FileX02 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";

interface ExportarButtonProps {
    onPDF?: () => void;
    onExcel?: () => void;
    label?: string;
}

/** Menú desplegable de exportación PDF / Excel. */
export function ExportarButton({ onPDF, onExcel, label = "Exportar" }: ExportarButtonProps) {
    return (
        <Dropdown.Root>
            <Button size="md" color="secondary" iconLeading={Download01} iconTrailing={ChevronDown}>
                {label}
            </Button>
            <Dropdown.Popover className="w-48">
                <Dropdown.Menu>
                    {onPDF && (
                        <Dropdown.Item icon={FileX02} onAction={onPDF}>
                            <span className="pr-4">{label} a PDF</span>
                        </Dropdown.Item>
                    )}
                    {onExcel && (
                        <Dropdown.Item icon={Download01} onAction={onExcel}>
                            <span className="pr-4">{label} a Excel</span>
                        </Dropdown.Item>
                    )}
                </Dropdown.Menu>
            </Dropdown.Popover>
        </Dropdown.Root>
    );
}
