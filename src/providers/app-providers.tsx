"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/auth-context";
import { NotificationProvider } from "@/contexts/notification-context";
import { TallerProvider } from "@/contexts/taller-context";

/** Agrupa todos los proveedores de aplicación (auth, taller, notificaciones, toasts). */
export function AppProviders({ children }: { children: ReactNode }) {
    return (
        <AuthProvider>
            <TallerProvider>
                <NotificationProvider>
                    {children}
                    <Toaster position="top-right" richColors closeButton />
                </NotificationProvider>
            </TallerProvider>
        </AuthProvider>
    );
}
