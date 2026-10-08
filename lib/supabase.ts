import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
/** Sin las claves en .env.local el sitio se ve con los textos y productos de muestra, y el panel no abre. */
export const SUPABASE_READY = Boolean(SUPABASE_URL && SUPABASE_KEY);
export const MEDIA_BUCKET = "media";

/** Cliente anónimo para el sitio público: solo ve lo que las políticas dejan leer a cualquiera. */
export function publicClient() {
  return createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
}

/** Cliente con la sesión de quien está en el panel: lo que puede hacer lo deciden las políticas de la base. */
export async function sessionClient() {
  const store = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Desde un Server Component no se pueden escribir cookies: de refrescar la sesión se ocupa proxy.ts.
        }
      },
    },
  });
}
