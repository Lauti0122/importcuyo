"use server";

import { redirect } from "next/navigation";
import { isAdmin, requireAdmin } from "@/lib/auth";
import { cleanProduct, cleanSite } from "@/lib/sanitize";
import {
  cleanupImages,
  deleteProduct,
  getAllProducts,
  getSite,
  productImages,
  reorderProducts,
  saveProduct,
  saveSite,
  siteImages,
} from "@/lib/store";
import { sessionClient } from "@/lib/supabase";
import type { ColorPreset, Product, Site } from "@/lib/types";

export async function login(_prev: string | null, form: FormData): Promise<string | null> {
  const supabase = await sessionClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(form.get("email") ?? "").trim(),
    password: String(form.get("password") ?? ""),
  });
  if (error) return "El email o la contraseña no son correctos.";
  if (!(await isAdmin())) {
    await supabase.auth.signOut();
    return "Esa cuenta no tiene acceso al panel.";
  }
  redirect("/admin");
}

export async function logout() {
  await (await sessionClient()).auth.signOut();
  redirect("/admin/login");
}

export async function saveSiteAction(site: Site): Promise<Site> {
  await requireAdmin();
  const clean = cleanSite(site);
  const before = siteImages(await getSite());
  await saveSite(clean);
  const kept = new Set(siteImages(clean));
  await cleanupImages(before.filter((url) => !kept.has(url)));
  return clean;
}

/** Guarda solo los colores predeterminados, para poder sumar uno desde el formulario de un producto. */
export async function saveColorPresetsAction(colors: ColorPreset[]): Promise<ColorPreset[]> {
  await requireAdmin();
  const site = await getSite();
  const clean = cleanSite({ ...site, shop: { ...site.shop, colors } });
  await saveSite(clean);
  return clean.shop.colors;
}

export async function saveProductAction(product: Product): Promise<Product[]> {
  await requireAdmin();
  const clean = cleanProduct(product);
  if (!clean.name) throw new Error("El producto necesita un nombre.");
  if (!clean.colors.length) throw new Error("El producto necesita al menos un color.");
  if (!clean.variants.length) throw new Error("El producto necesita al menos un precio.");
  const previous = (await getAllProducts()).find((p) => p.id === clean.id);
  await saveProduct(clean);
  const kept = new Set(productImages(clean));
  await cleanupImages(previous ? productImages(previous).filter((url) => !kept.has(url)) : []);
  return getAllProducts();
}

export async function deleteProductAction(id: string): Promise<Product[]> {
  await requireAdmin();
  const previous = (await getAllProducts()).find((p) => p.id === id);
  await deleteProduct(id);
  await cleanupImages(previous ? productImages(previous) : []);
  return getAllProducts();
}

export async function reorderProductsAction(ids: string[]): Promise<Product[]> {
  await requireAdmin();
  await reorderProducts(ids);
  return getAllProducts();
}
