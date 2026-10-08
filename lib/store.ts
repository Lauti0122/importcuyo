import "server-only";
import { randomUUID } from "crypto";
import { cache } from "react";
import { DEFAULT_SITE, SAMPLE_PRODUCTS } from "./defaults";
import { MEDIA_BUCKET, publicClient, sessionClient, SUPABASE_READY, SUPABASE_URL } from "./supabase";
import type { HeroSlide, Product, Site } from "./types";

type ProductRow = { id: string; visible: boolean; data: Product };

function check<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

const toProducts = (rows: ProductRow[] | null) => (rows ?? []).map((row) => ({ ...row.data, id: row.id, visible: row.visible }));

export const getSite = cache(async (): Promise<Site> => {
  if (!SUPABASE_READY) return DEFAULT_SITE;
  const row = check(await publicClient().from("site").select("data").eq("id", 1).maybeSingle());
  const saved = row?.data as Partial<Site> | undefined;
  if (!saved) return DEFAULT_SITE;
  // Las primeras fotos del carrusel se guardaron como URL suelta, sin encuadre.
  const slides = ((saved.hero?.slides ?? []) as (HeroSlide | string)[]).map((s) => (typeof s === "string" ? { image: s, x: 50, y: 50, zoom: 100 } : s));
  // Se mezcla con los valores por defecto para que un guardado viejo siga sirviendo.
  return {
    ...DEFAULT_SITE,
    ...saved,
    brand: { ...DEFAULT_SITE.brand, ...saved.brand },
    hero: { ...DEFAULT_SITE.hero, ...saved.hero, slides },
    about: { ...DEFAULT_SITE.about, ...saved.about },
    contact: { ...DEFAULT_SITE.contact, ...saved.contact },
    footer: { ...DEFAULT_SITE.footer, ...saved.footer },
    shop: { ...DEFAULT_SITE.shop, ...saved.shop },
    theme: { ...DEFAULT_SITE.theme, ...saved.theme },
  };
});

export async function saveSite(site: Site) {
  const supabase = await sessionClient();
  check(await supabase.from("site").upsert({ id: 1, data: site, updated_at: new Date().toISOString() }));
}

/** Lo que ve cualquier visitante: solo los productos visibles. */
export async function getProducts(): Promise<Product[]> {
  if (!SUPABASE_READY) return SAMPLE_PRODUCTS;
  return toProducts(check(await publicClient().from("products").select("id, visible, data").eq("visible", true).order("position")));
}

/** Un producto para su página de detalle; `null` si no existe o está oculto. */
export const getProduct = cache(async (id: string): Promise<Product | null> => {
  if (!SUPABASE_READY) return SAMPLE_PRODUCTS.find((p) => p.id === id) ?? null;
  const rows = check(await publicClient().from("products").select("id, visible, data").eq("id", id).eq("visible", true).limit(1));
  return toProducts(rows)[0] ?? null;
});

/** Para el panel: todos, incluidos los ocultos. */
export async function getAllProducts(): Promise<Product[]> {
  const supabase = await sessionClient();
  return toProducts(check(await supabase.from("products").select("id, visible, data").order("position")));
}

export async function saveProduct(product: Product) {
  const supabase = await sessionClient();
  const row = { id: product.id, visible: product.visible, data: product, updated_at: new Date().toISOString() };
  const existing = check(await supabase.from("products").select("id").eq("id", product.id).maybeSingle());
  if (existing) {
    check(await supabase.from("products").update(row).eq("id", product.id));
    return;
  }
  // Los productos nuevos van primeros en el catálogo.
  const first = check(await supabase.from("products").select("position").order("position").limit(1).maybeSingle());
  check(await supabase.from("products").insert({ ...row, position: (first?.position ?? 0) - 1 }));
}

export async function deleteProduct(id: string) {
  const supabase = await sessionClient();
  check(await supabase.from("products").delete().eq("id", id));
}

export async function reorderProducts(ids: string[]) {
  const supabase = await sessionClient();
  const results = await Promise.all(ids.map((id, position) => supabase.from("products").update({ position }).eq("id", id)));
  results.forEach(check);
}

/** Sube una imagen al bucket público y devuelve su URL. */
export async function saveUpload(ext: string, contentType: string, data: Buffer) {
  const supabase = await sessionClient();
  const name = `${randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(name, data, {
    contentType,
    // Cada subida tiene un nombre único, así que el archivo nunca cambia.
    cacheControl: "31536000",
  });
  if (error) throw new Error(error.message);
  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(name).data.publicUrl;
}

const MEDIA_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/`;
// Una imagen subida pero todavía sin guardar (un producto a medio cargar) no se toca hasta pasado este tiempo.
const ORPHAN_AGE_MS = 24 * 60 * 60 * 1000;

export const productImages = (product: Product) => product.colors.flatMap((c) => c.images);
export const siteImages = (site: Site) => [site.hero.image, site.about.image, ...site.hero.slides.map((s) => s.image), ...site.banners.map((b) => b.image)].filter((url): url is string => Boolean(url));

const mediaName = (url: string) => (url.startsWith(MEDIA_PREFIX) ? url.slice(MEDIA_PREFIX.length) : null);

/**
 * Borra del bucket las imágenes que ya no usa ningún producto ni el sitio.
 * `removed` son las que se acaban de quitar: se borran en el momento. Además se barren las
 * que quedaron huérfanas hace más de un día (fotos subidas en un producto que nunca se guardó).
 * Nunca hace fallar un guardado: si algo sale mal, simplemente no borra.
 */
export async function cleanupImages(removed: string[]) {
  try {
    const supabase = await sessionClient();
    // Se leen las referencias ya guardadas; si alguna lectura falla, `check` corta y no se borra nada.
    const products = toProducts(check(await supabase.from("products").select("id, visible, data")));
    const siteRow = check(await supabase.from("site").select("data").eq("id", 1).maybeSingle());
    const savedSite = siteRow?.data as Partial<Site> | undefined;
    const used = new Set(
      [...products.flatMap(productImages), savedSite?.hero?.image, savedSite?.about?.image, ...(savedSite?.hero?.slides ?? []).map((s) => s.image), ...(savedSite?.banners ?? []).map((b) => b.image)]
        .map((url) => (url ? mediaName(url) : null))
        .filter((name): name is string => name !== null),
    );

    const doomed = new Set(removed.map(mediaName).filter((name): name is string => name !== null && !used.has(name)));

    const bucket = supabase.storage.from(MEDIA_BUCKET);
    const cutoff = Date.now() - ORPHAN_AGE_MS;
    for (let offset = 0; ; offset += 1000) {
      const page = check(await bucket.list("", { limit: 1000, offset }));
      for (const file of page ?? []) {
        if (!used.has(file.name) && file.created_at && Date.parse(file.created_at) < cutoff) doomed.add(file.name);
      }
      if (!page || page.length < 1000) break;
    }

    const names = [...doomed];
    for (let i = 0; i < names.length; i += 100) check(await bucket.remove(names.slice(i, i + 100)));
  } catch (err) {
    console.error("No se pudieron limpiar las imágenes sin uso:", err);
  }
}
