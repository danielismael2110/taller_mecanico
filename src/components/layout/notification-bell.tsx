"use client";

import { Bell01, CheckDone01 } from "@untitledui/icons";
import { Button as AriaButton, Dialog, DialogTrigger, Popover } from "react-aria-components";
import { useRouter } from "next/navigation";
import { Button } from "@/components/base/buttons/button";
import { useNotifications } from "@/hooks/use-notifications";
import { formatTiempoRelativo } from "@/lib/utils/formatters";
import { cx } from "@/utils/cx";

/** Campanita de notificaciones in-app con contador y panel (Anexo A). */
export function NotificationBell() {
    const router = useRouter();
    const { notificaciones, noLeidas, marcarLeida, marcarTodasLeidas } = useNotifications();

    return (
        <DialogTrigger>
            <AriaButton
                aria-label="Notificaciones"
                className="relative flex size-10 cursor-pointer items-center justify-center rounded-lg text-fg-quaternary outline-focus-ring transition hover:bg-primary_hover hover:text-fg-secondary focus-visible:outline-2"
            >
                <Bell01 className="size-5" />
                {noLeidas > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex min-w-4 items-center justify-center rounded-full bg-error-solid px-1 text-[10px] font-bold text-white">
                        {noLeidas > 9 ? "9+" : noLeidas}
                    </span>
                )}
            </AriaButton>

            <Popover
                placement="bottom end"
                className="z-50 w-screen max-w-96 origin-top-right rounded-xl bg-primary shadow-lg ring-1 ring-secondary outline-hidden data-[entering]:animate-in data-[entering]:fade-in data-[entering]:zoom-in-95"
            >
                <Dialog className="outline-hidden">
                    <div className="flex items-center justify-between border-b border-secondary px-4 py-3">
                        <p className="text-sm font-semibold text-primary">Notificaciones</p>
                        {noLeidas > 0 && (
                            <Button size="xs" color="link-color" iconLeading={CheckDone01} onClick={() => marcarTodasLeidas()}>
                                Marcar todas
                            </Button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {notificaciones.length === 0 ? (
                            <p className="px-4 py-10 text-center text-sm text-tertiary">No tienes notificaciones.</p>
                        ) : (
                            <ul className="divide-y divide-secondary">
                                {notificaciones.map((n) => (
                                    <li key={n.id}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!n.leida) marcarLeida(n.id);
                                                if (n.url) router.push(n.url);
                                            }}
                                            className={cx(
                                                "flex w-full flex-col gap-0.5 px-4 py-3 text-left transition hover:bg-primary_hover",
                                                !n.leida && "bg-brand-primary/5",
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                {!n.leida && <span className="size-2 shrink-0 rounded-full bg-brand-solid" />}
                                                <span className="text-sm font-semibold text-primary">{n.titulo}</span>
                                            </div>
                                            {n.mensaje && <span className="line-clamp-2 text-sm text-tertiary">{n.mensaje}</span>}
                                            <span className="text-xs text-quaternary">{formatTiempoRelativo(n.creado_en)}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </Dialog>
            </Popover>
        </DialogTrigger>
    );
}
