import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AppProviders } from "@/providers/app-providers";
import { RouteProvider } from "@/providers/router-provider";
import { Theme } from "@/providers/theme";
import "@/styles/globals.css";
import { cx } from "@/utils/cx";

const inter = Inter({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-inter",
});

export const metadata: Metadata = {
    title: "GaraGato — Gestión de Taller Mecánico",
    description: "Sistema de gestión y control para el taller mecánico GaraGato.",
};

export const viewport: Viewport = {
    themeColor: "#5c0b8b",
    colorScheme: "light dark",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es" suppressHydrationWarning>
            <body className={cx(inter.variable, "bg-primary antialiased")}>
                <RouteProvider>
                    <Theme>
                        <AppProviders>{children}</AppProviders>
                    </Theme>
                </RouteProvider>
            </body>
        </html>
    );
}
