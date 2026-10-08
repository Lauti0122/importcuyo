import { DEFAULT_SITE, MAX_CATEGORIES, MAX_COLOR_PRESETS, MAX_HERO_SLIDES, MAX_SLIDE_ZOOM } from "./defaults";
import { HEX } from "./theme";
import type { Product, Site, Theme } from "./types";

// Lo que llega del panel se normaliza antes de guardarse: nunca se confía en la forma del JSON.

const str = (v: unknown, max = 400) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const num = (v: unknown, min = 0, max = 1e9) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;
};
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const obj = (v: unknown) => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});
// Solo se aceptan imágenes subidas al bucket público del proyecto.
const MEDIA_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/`;
const image = (v: unknown) =>
  typeof v === "string" && v.startsWith(MEDIA_URL) && /^[\w-]+\.(jpg|png|webp|avif)$/.test(v.slice(MEDIA_URL.length)) ? v : null;
const link = (v: unknown) => {
  const s = str(v, 500);
  return s === "whatsapp" || /^(#|\/|https?:\/\/)/.test(s) ? s : "";
};
const email = (v: unknown) => {
  const s = str(v, 120).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? s : "";
};
const id = (v: unknown) => str(v, 60).replace(/[^\w-]/g, "") || crypto.randomUUID();

export function cleanSite(input: unknown): Site {
  const s = obj(input);
  const brand = obj(s.brand);
  const hero = obj(s.hero);
  const contact = obj(s.contact);
  const footer = obj(s.footer);
  const about = obj(s.about);
  const shop = obj(s.shop);
  const theme = obj(s.theme);
  return {
    brand: {
      name: str(brand.name, 40) || DEFAULT_SITE.brand.name,
      description: str(brand.description, 300),
    },
    hero: {
      eyebrow: str(hero.eyebrow, 80),
      tagline: str(hero.tagline, 80),
      text: str(hero.text, 400),
      image: image(hero.image),
      overlay: num(hero.overlay, 0, 90),
      slides: list(hero.slides)
        .map((raw) => {
          const sl = typeof raw === "string" ? { image: raw } : obj(raw);
          const src = image(sl.image);
          return src ? { image: src, x: num(sl.x ?? 50, 0, 100), y: num(sl.y ?? 50, 0, 100), zoom: num(sl.zoom, 100, MAX_SLIDE_ZOOM) } : null;
        })
        .filter((sl) => sl !== null)
        .filter((sl, i, all) => all.findIndex((other) => other.image === sl.image) === i)
        .slice(0, MAX_HERO_SLIDES),
    },
    strip: list(s.strip).map((t) => str(t, 120)).filter(Boolean).slice(0, 12),
    steps: list(s.steps)
      .slice(0, 4)
      .map((raw) => {
        const st = obj(raw);
        return { id: id(st.id), icon: str(st.icon, 30), title: str(st.title, 60), text: str(st.text, 240) };
      })
      .filter((st) => st.title),
    about: {
      title: str(about.title, 60),
      text: str(about.text, 900),
      caption: str(about.caption, 120),
      image: image(about.image),
      people: list(about.people)
        .slice(0, 6)
        .map((raw) => {
          const person = obj(raw);
          return {
            id: id(person.id),
            name: str(person.name, 40),
            instagram: str(person.instagram, 40).replace(/[^\w.]/g, ""),
            whatsapp: str(person.whatsapp, 20).replace(/\D/g, ""),
          };
        })
        .filter((person) => person.name),
    },
    banners: list(s.banners).slice(0, 12).map((raw) => {
      const b = obj(raw);
      return {
        id: id(b.id),
        image: image(b.image),
        icon: str(b.icon, 30),
        cards: b.cards === true,
        title: str(b.title, 80),
        text: str(b.text, 240),
        buttonLabel: str(b.buttonLabel, 40),
        link: link(b.link),
        active: b.active !== false,
      };
    }),
    contact: {
      whatsapp: str(contact.whatsapp, 20).replace(/\D/g, ""),
      instagram: str(contact.instagram, 40).replace(/[^\w.]/g, ""),
      email: email(contact.email),
      generalMessage: str(contact.generalMessage, 300) || DEFAULT_SITE.contact.generalMessage,
      productMessage: str(contact.productMessage, 300) || DEFAULT_SITE.contact.productMessage,
      address: str(contact.address, 160),
      hours: str(contact.hours, 160),
    },
    footer: {
      about: str(footer.about, 400),
      note: str(footer.note, 160),
      payments: list(footer.payments).map((p) => str(p, 40)).filter(Boolean).slice(0, 10),
    },
    shop: {
      usdRate: num(shop.usdRate, 0, 1e6),
      colors: list(shop.colors)
        .map((raw) => {
          const c = obj(raw);
          return { name: str(c.name, 30), hex: str(c.hex, 7).toUpperCase() };
        })
        .filter((c) => c.name && HEX.test(c.hex))
        .slice(0, MAX_COLOR_PRESETS),
      categories: [...new Set(list(shop.categories).map((c) => str(c, 40)).filter(Boolean))].slice(0, MAX_CATEGORIES),
    },
    theme: Object.fromEntries(
      Object.entries(DEFAULT_SITE.theme).map(([key, fallback]) => {
        const value = theme[key];
        return [key, typeof value === "string" && HEX.test(value) ? value : fallback];
      }),
    ) as Theme,
  };
}

export function cleanProduct(input: unknown): Product {
  const p = obj(input);
  return {
    id: id(p.id),
    name: str(p.name, 80),
    brand: str(p.brand, 40),
    category: str(p.category, 40) || "Sin categoría",
    description: str(p.description, 1200),
    specs: list(p.specs).map((x) => str(x, 40)).filter(Boolean).slice(0, 8),
    badge: str(p.badge, 24),
    isNew: p.isNew === true,
    visible: p.visible !== false,
    colors: list(p.colors).slice(0, 12).map((raw) => {
      const c = obj(raw);
      const hex = str(c.hex, 7);
      return {
        name: str(c.name, 30) || "Único",
        hex: HEX.test(hex) ? hex : "#1F2022",
        images: list(c.images).map(image).filter((x): x is string => x !== null).slice(0, 12),
      };
    }),
    variants: list(p.variants)
      .slice(0, 12)
      .map((raw) => {
        const v = obj(raw);
        const price = num(v.price);
        const sale = num(v.priceSale);
        const card = num(v.priceCard);
        const card12 = num(v.priceCard12);
        return {
          label: str(v.label, 40),
          price,
          priceSale: sale > 0 && sale < price ? sale : null,
          priceCard: card > 0 ? card : null,
          priceCard12: card12 > 0 ? card12 : null,
          inStock: v.inStock !== false,
        };
      })
      .filter((v) => v.price > 0),
  };
}
