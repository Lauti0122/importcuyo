import "server-only";
import { sessionClient, SUPABASE_READY } from "./supabase";

/** Hay sesión iniciada y la cuenta está en la tabla `admins`. */
export async function isAdmin() {
  if (!SUPABASE_READY) return false;
  const supabase = await sessionClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return false;
  const { data: allowed } = await supabase.rpc("is_admin");
  return allowed === true;
}

export async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("No autorizado");
}
