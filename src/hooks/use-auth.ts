"use client";

import { useAuthContext } from "@/contexts/auth-context";

/** Acceso a la sesión: usuario, rol y logout. */
export const useAuth = useAuthContext;
