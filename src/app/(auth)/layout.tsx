import type { ReactNode } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/foundations/logo/logo-mark";

/** Layout de autenticación: tarjeta centrada con marca del taller. */
export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-dvh flex-col bg-secondary">
            <header className="px-6 py-5">
                <Link href="/" className="inline-flex items-center gap-2">
                    <LogoMark />
                    <span className="text-lg font-bold text-primary">GaraGato</span>
                </Link>
            </header>
            <main className="flex flex-1 items-center justify-center px-4 py-8">
                <div className="w-full max-w-md">{children}</div>
            </main>
        </div>
    );
}
