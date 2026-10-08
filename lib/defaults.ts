import type { Product, ProductColor, ProductVariant, Site, Theme } from "./types";

// Paleta del manual de marca de Import Cuyo.
export const BRAND_THEME: Theme = {
  bg: "#F4F6FA",
  paper: "#FFFFFF",
  primary: "#16233D",
  ink: "#101A2E",
  accent: "#2F5FA8",
  soft: "#E1E9F6",
  silver: "#C9CFD8",
};

export const MAX_HERO_SLIDES = 8;
export const MAX_SLIDE_ZOOM = 300;
/** Tope de categorías de productos. */
export const MAX_CATEGORIES = 60;

/** Tope de colores guardados para reutilizar al cargar productos. */
export const MAX_COLOR_PRESETS = 200;

export const DEFAULT_SITE: Site = {
  brand: {
    name: "Import Cuyo",
    description:
      "Import Cuyo. Productos importados en Mendoza: tecnología, consolas, audio, hogar y más, con precios en dólares.",
  },
  hero: {
    eyebrow: "",
    tagline: "Lo que buscás, importado directo a Mendoza.",
    text: "Tecnología, consolas, audio, hogar y mucho más. Trabajamos por encargue: elegís el producto y lo traemos, original y sellado.",
    image: null,
    overlay: 55,
    slides: [],
  },
  strip: [
    "Productos originales y sellados",
    "Entregas en Mendoza",
    "Trabajamos por encargue",
  ],
  steps: [
    { id: "s-consultar", icon: "whatsapp", title: "Consultá por el producto", text: "Escribinos por WhatsApp y contanos qué producto buscás." },
    { id: "s-senar", icon: "dollar", title: "Señalo con un monto mínimo", text: "Con la seña hacemos el encargue. El resto lo pagás cuando te entregamos el pedido." },
    { id: "s-recibir", icon: "truck", title: "Recibilo en 3 a 5 días hábiles", text: "Lo retirás en uno de nuestros puntos de entrega." },
  ],
  about: {
    title: "Quiénes somos",
    text: "Somos tres amigos que nos conocemos desde chicos. Compartimos temporadas enteras en el club y, de tanto hablar de armar algo propio, nació Import Cuyo.\n\nTe contamos quiénes están del otro lado: tres personas que responden los mensajes, hacen los encargues y se ocupan de que tu pedido llegue bien. Queremos que compres con absoluta confianza, sabiendo que hacemos todo con el mayor profesionalismo y dedicación.",
    caption: "No es la mejor foto, pero es la que había.",
    people: [
      { id: "p-juliano", name: "Juliano", instagram: "juli.argumedo", whatsapp: "5492613348352" },
      { id: "p-lautaro", name: "Lautaro", instagram: "lautibua", whatsapp: "5492612068833" },
      { id: "p-alvaro", name: "Álvaro", instagram: "alvaro.argumedo1", whatsapp: "5492615528974" },
    ],
    image: null,
  },
  banners: [
    {
      id: "b-cuotas",
      image: null,
      icon: "",
      cards: true,
      title: "3 cuotas sin interés",
      text: "Miércoles y sábados, con tarjeta de crédito.",
      buttonLabel: "Ver catálogo",
      link: "#catalogo",
      active: true,
    },
    {
      id: "b-pedidos",
      image: null,
      icon: "",
      cards: false,
      title: "¿Buscás otro producto?",
      text: "Pedinos cotización y lo traemos por encargue.",
      buttonLabel: "Pedir cotización",
      link: "whatsapp",
      active: true,
    },
  ],
  contact: {
    whatsapp: "5492612068833",
    instagram: "importcuyo",
    email: "",
    generalMessage: "Hola {marca}! Quiero consultar por un producto del catálogo",
    productMessage: "Hola! Me interesa: {producto}, {version}, color {color}. ¿Cómo hago para encargarlo?",
    address: "",
    hours: "",
  },
  footer: {
    about: "Importamos productos de todo tipo, sobre todo tecnología, y los entregamos en Mendoza. Originales, con atención personalizada y precios claros.",
    note: "Mendoza, Argentina",
    payments: ["Efectivo", "Transferencia", "Pesos argentinos", "Dólares"],
  },
  shop: {
    usdRate: 0,
    colors: [
      { name: "Black", hex: "#1F2022" },
      { name: "Silver", hex: "#DFE1E4" },
      { name: "Cosmic Orange", hex: "#EE7A3E" },
      { name: "Deep Blue", hex: "#33486B" },
      { name: "Sage", hex: "#B4BE96" },
      { name: "Burgundy", hex: "#6A3348" },
      { name: "Glacier", hex: "#7693BE" },
      { name: "Blanco", hex: "#F2F2F0" },
    ],
    // Vacío: hasta que se guarde la lista, las categorías son las que ya usan los productos.
    categories: [],
  },
  theme: BRAND_THEME,
};

const color = (name: string, hex: string): ProductColor => ({ name, hex, images: [] });
const variant = (label: string, price: number, priceSale: number | null = null): ProductVariant => ({ label, price, priceSale, priceCard: null, priceCard12: null, inStock: true });

function sample(
  id: string,
  name: string,
  brand: string,
  category: string,
  specs: string[],
  colors: ProductColor[],
  variants: ProductVariant[],
  extra: Partial<Product> = {},
): Product {
  return { id, name, brand, category, description: "", specs, badge: "", isNew: false, visible: true, colors, variants, ...extra };
}

// Productos de muestra: sirven para ver el catálogo armado hasta cargar los reales.
export const SAMPLE_PRODUCTS: Product[] = [
  sample(
    "m-iphone-18-pro",
    "iPhone 18 Pro",
    "Apple",
    "Celulares",
    ['6,3"', "Cámara 48 MP", "A20 Pro"],
    [color("Black", "#1F2022"), color("Burgundy", "#6A3348"), color("Silver", "#DFE1E4"), color("Glacier", "#7693BE")],
    [variant("256 GB", 1650), variant("512 GB", 1850)],
    { isNew: true },
  ),
  sample(
    "m-iphone-17-pro-max",
    "iPhone 17 Pro Max",
    "Apple",
    "Celulares",
    ['6,9"', "Cámara 48 MP"],
    [color("Cosmic Orange", "#EE7A3E"), color("Deep Blue", "#33486B"), color("Silver", "#DFE1E4")],
    [variant("256 GB", 1370, 1320)],
  ),
  sample("m-iphone-17", "iPhone 17", "Apple", "Celulares", ['6,3"', "Cámara 48 MP"], [color("Sage", "#B4BE96"), color("Black", "#1F2022")], [
    variant("256 GB", 1020),
  ]),
  sample(
    "m-macbook-neo",
    "MacBook Neo",
    "Apple",
    "Notebooks",
    ['13" Liquid Retina', "A18 Pro"],
    [color("Citrus", "#D9E26B"), color("Silver", "#DFE1E4")],
    [variant("256 GB", 850), variant("512 GB", 950)],
    { isNew: true },
  ),
  sample("m-airpods-4", "AirPods 4", "Apple", "Audio", ["Estuche USB-C", "Audio espacial"], [color("Blanco", "#F2F2F0")], [
    variant("Estándar", 200),
    variant("Con cancelación de ruido", 250),
  ]),
  sample("m-ps5-slim", "PlayStation 5 Slim", "Sony", "Gaming", ["825 GB SSD", "4K"], [color("Blanco", "#F2F2F0")], [variant("Digital", 750)], {
    badge: "Digital",
  }),
  sample("m-jbl-charge-6", "JBL Charge 6", "JBL", "Audio", ["45 W", "28 h de batería", "IP68"], [color("Black", "#1F2022")], [variant("", 170)]),
  sample(
    "m-xiaomi-s40",
    "Xiaomi Robot Vacuum S40",
    "Xiaomi",
    "Hogar",
    ["Aspira y trapea", "Navegación láser"],
    [color("Black", "#1F2022"), color("Blanco", "#F2F2F0")],
    [variant("", 230)],
  ),
];
