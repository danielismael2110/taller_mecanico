"use client";

import type { ComponentType, HTMLAttributes, ReactNode } from "react";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { Input } from "@/components/base/input/input";
import { TextArea } from "@/components/base/textarea/textarea";
import { Select } from "@/components/base/select/select";

interface BaseProps<T extends FieldValues> {
    control: Control<T>;
    name: Path<T>;
    label?: string;
    placeholder?: string;
    isRequired?: boolean;
}

/** Input de texto conectado a react-hook-form + UntitledUI. */
export function FormInput<T extends FieldValues>({
    control,
    name,
    label,
    placeholder,
    isRequired,
    type = "text",
    icon,
}: BaseProps<T> & { type?: string; icon?: ComponentType<HTMLAttributes<HTMLOrSVGElement>> }) {
    return (
        <Controller
            control={control}
            name={name}
            render={({ field, fieldState }) => (
                <Input
                    label={label}
                    placeholder={placeholder}
                    isRequired={isRequired}
                    type={type}
                    icon={icon}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    isInvalid={!!fieldState.error}
                    hint={fieldState.error?.message}
                />
            )}
        />
    );
}

/** Área de texto conectada a react-hook-form. */
export function FormTextArea<T extends FieldValues>({ control, name, label, placeholder, isRequired }: BaseProps<T>) {
    return (
        <Controller
            control={control}
            name={name}
            render={({ field, fieldState }) => (
                <TextArea
                    label={label}
                    placeholder={placeholder}
                    isRequired={isRequired}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    isInvalid={!!fieldState.error}
                    hint={fieldState.error?.message}
                />
            )}
        />
    );
}

interface OpcionSelect {
    id: string;
    label: string;
    supportingText?: string;
}

/** Select conectado a react-hook-form. */
export function FormSelect<T extends FieldValues>({
    control,
    name,
    label,
    placeholder = "Seleccionar...",
    isRequired,
    items,
    children,
}: BaseProps<T> & { items: OpcionSelect[]; children?: (item: OpcionSelect) => ReactNode }) {
    return (
        <Controller
            control={control}
            name={name}
            render={({ field, fieldState }) => (
                <Select
                    label={label}
                    placeholder={placeholder}
                    isRequired={isRequired}
                    items={items}
                    selectedKey={field.value ?? null}
                    onSelectionChange={(key) => field.onChange(key === null ? "" : String(key))}
                    isInvalid={!!fieldState.error}
                    hint={fieldState.error?.message}
                >
                    {(item) => (children ? children(item as OpcionSelect) : <Select.Item id={item.id}>{(item as OpcionSelect).label}</Select.Item>)}
                </Select>
            )}
        />
    );
}
