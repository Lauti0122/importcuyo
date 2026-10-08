export type Theme = {
  bg: string;
  paper: string;
  primary: string;
  ink: string;
  accent: string;
  soft: string;
  silver: string;
};

export type Banner = {
  id: string;
  image: string | null;
  /** Ícono al lado del título; vacío = sin ícono. */
  icon: string;
  /** Muestra los logos de las tarjetas aceptadas (Visa, Mastercard, Naranja X y American Express). */
  cards: boolean;
  title: string;
  text: string;
  buttonLabel: string;
  /** "#catalogo", un link completo o "whatsapp" para abrir la consulta por WhatsApp. */
  link: string;
  active: boolean;
};

/** Foto del carrusel de portada con su encuadre: `x`/`y` de 0 a 100 (50 = centrada), `zoom` en % (100 = llena justo). */
export type HeroSlide = { image: string; x: number; y: number; zoom: number };

/** Un paso de "Cómo comprar": van en orden y se numeran solos. */
export type Step = { id: string; icon: string; title: string; text: string };

/** Una de las personas detrás del emprendimiento; Instagram sin arroba y WhatsApp solo números, ambos opcionales. */
export type Person = { id: string; name: string; instagram: string; whatsapp: string };

/** Color guardado en el panel para reutilizar al cargar productos. */
export type ColorPreset = { name: string; hex: string };

export type Site = {
  brand: { name: string; description: string };
  hero: {
    eyebrow: string;
    tagline: string;
    text: string;
    image: string | null;
    overlay: number;
    /** Fotos que rotan después de la portada. */
    slides: HeroSlide[];
  };
  strip: string[];
  steps: Step[];
  /** "Quiénes somos". Sin foto subida desde el panel se usa la del proyecto (public/landing/equipo.jpg). */
  about: { title: string; text: string; caption: string; image: string | null; people: Person[] };
  banners: Banner[];
  contact: {
    whatsapp: string;
    instagram: string;
    email: string;
    generalMessage: string;
    productMessage: string;
    address: string;
    hours: string;
  };
  footer: { about: string; note: string; payments: string[] };
  shop: {
    /** Pesos por dólar para mostrar el equivalente en pesos; 0 = el catálogo muestra solo dólares. */
    usdRate: number;
    colors: ColorPreset[];
    categories: string[];
  };
  theme: Theme;
};

/** Una versión del producto con su precio en dólares: "256 GB", "46 mm", "Con cancelación de ruido". */
export type ProductVariant = {
  /** Vacío cuando el producto tiene una sola versión. */
  label: string;
  /** Precio en efectivo o transferencia. */
  price: number;
  /** Oferta sobre el precio en efectivo. */
  priceSale: number | null;
  /** Precio con tarjeta en hasta 3 cuotas sin interés (miércoles y sábados); `null` si no se ofrece. */
  priceCard: number | null;
  /** Precio con tarjeta en hasta 12 cuotas fijas; `null` si no se ofrece. */
  priceCard12: number | null;
  /** Se puede encargar. El negocio trabaja por encargue, sin stock propio: `false` marca lo que por ahora no se trae. */
  inStock: boolean;
};

export type ProductColor = {
  name: string;
  hex: string;
  images: string[];
};

export type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  /** Datos cortos que se muestran como chips: "256 GB", "Cámara 48 MP". */
  specs: string[];
  /** Etiqueta libre sobre la foto: "Open Box", "Digital". */
  badge: string;
  isNew: boolean;
  visible: boolean;
  colors: ProductColor[];
  variants: ProductVariant[];
};
