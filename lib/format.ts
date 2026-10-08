import type { CSSProperties } from "react";
import type { HeroSlide, Product, ProductVariant, Site } from "./types";

const number = (n: number) => n.toLocaleString("es-AR", { maximumFractionDigits: 0 });

export const usd = (n: number) => `US$ ${number(n)}`;
export const ars = (n: number) => `$ ${number(n)}`;

/** Equivalente en pesos a la cotización cargada en el panel, redondeado a mil. */
export const toArs = (price: number, usdRate: number) => Math.round((price * usdRate) / 1000) * 1000;

/** Valor de cada cuota, redondeado a cien pesos. */
export const installment = (price: number, usdRate: number, count: number) => Math.round((price * usdRate) / count / 100) * 100;

/** Lo que se paga hoy en efectivo por una versión: el precio de oferta si hay, si no el normal. */
export const finalPrice = (v: ProductVariant) => v.priceSale ?? v.price;

export const onSale = (p: Product) => p.variants.some((v) => v.priceSale);

/** El precio más bajo del producto, para ordenar y para el "desde" de la tarjeta. */
export const fromPrice = (p: Product) => Math.min(...p.variants.map(finalPrice));

/** Texto oscuro o claro según el fondo, para el monograma de las muestras sin foto. */
export function inkOn(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? "rgba(22,35,61,.5)" : "rgba(255,255,255,.55)";
}

export const instagramUrl = (user: string) => `https://www.instagram.com/${user}`;

/** Link para consultar: WhatsApp si hay número cargado, si no mensaje directo de Instagram; `null` si no hay ninguno. */
export function contactUrl(contact: Site["contact"], message: string) {
  const number = contact.whatsapp.replace(/\D/g, "");
  if (number) return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  if (contact.instagram) return `https://ig.me/m/${contact.instagram}`;
  return null;
}

/** Mensaje de los botones de WhatsApp que no son de un producto (encabezado, portada, pie y botón flotante). */
export const generalMessage = (site: Site) => site.contact.generalMessage.replaceAll("{marca}", site.brand.name);

/**
 * Arma el mensaje del botón "Consultar" de un producto a partir del texto cargado en el panel.
 * Si el producto tiene una sola versión sin nombre, se saca {version} junto con la coma que la precede.
 */
export function productMessage(template: string, p: { producto: string; color: string; version: string }) {
  const withVersion = p.version ? template.replaceAll("{version}", p.version) : template.replace(/,?\s*\{version\}/gi, "");
  return withVersion.replaceAll("{producto}", p.producto).replaceAll("{color}", p.color);
}

/** 5492615551234 -> 261 555-1234 */
export function prettyPhone(raw: string) {
  const local = raw.replace(/\D/g, "").replace(/^549?/, "");
  if (local.length !== 10) return raw;
  return `${local.slice(0, 3)} ${local.slice(3, 6)}-${local.slice(6)}`;
}

/** Encuadre de una foto del carrusel: el zoom agranda desde el mismo punto que se eligió como foco. */
export function slideStyle({ x, y, zoom }: HeroSlide): CSSProperties {
  return { objectPosition: `${x}% ${y}%`, transformOrigin: `${x}% ${y}%`, transform: zoom > 100 ? `scale(${zoom / 100})` : undefined };
}
