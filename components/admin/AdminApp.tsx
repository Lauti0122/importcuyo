"use client";

import { ArrowDown, ArrowUp, ExternalLink, LogOut, Monitor, Plus, Smartphone, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { logout, saveSiteAction } from "@/app/admin/actions";
import { STEP_ICONS } from "@/components/site/icons";
import { BRAND_THEME, MAX_CATEGORIES, MAX_COLOR_PRESETS, MAX_HERO_SLIDES, MAX_SLIDE_ZOOM } from "@/lib/defaults";
import { slideStyle } from "@/lib/format";
import { themeCss } from "@/lib/theme";
import type { Banner, ColorPreset, HeroSlide, Person, Product, Site, Step, Theme } from "@/lib/types";
import { ProductsTab } from "./ProductsTab";
import { ColorInput, Field, ImageInput, Text, UploadButton } from "./ui";

const TABS = [
  ["productos", "Productos"],
  ["categorias", "Categorías"],
  ["portada", "Portada"],
  ["banners", "Banners"],
  ["info", "Marquesina y cómo comprar"],
  ["datos", "Datos y contacto"],
  ["colores", "Colores"],
] as const;
type TabId = (typeof TABS)[number][0];

const THEME_FIELDS: [keyof Theme, string, string][] = [
  ["bg", "Fondo", "El fondo general de la página."],
  ["paper", "Tarjetas", "Fondo de las tarjetas de producto y de los botones claros."],
  ["primary", "Principal", "Fondo de la portada, textos, botones y etiquetas."],
  ["accent", "Acento", "Detalles: bordes resaltados, marca de cada producto, etiqueta Oferta y puntos de la marquesina."],
  ["soft", "Suave", "Características del producto y banners sin foto."],
  ["silver", "Plata", "Tercer tono para banners sin foto."],
  ["ink", "Oscuro", "Marquesina y pie de página."],
];

const PRESETS: [string, Theme][] = [
  ["Navy Import Cuyo", BRAND_THEME],
  ["Azul marca", { bg: "#F4F6FA", paper: "#FFFFFF", primary: "#2F5FA8", ink: "#16233D", accent: "#4E82D9", soft: "#E1E9F6", silver: "#C9CFD8" }],
  ["Noche", { bg: "#101A2E", paper: "#16233D", primary: "#2F5FA8", ink: "#0B111B", accent: "#4E82D9", soft: "#1D2C4A", silver: "#C9CFD8" }],
];

function moveItem<T>(list: T[], index: number, delta: number) {
  const next = [...list];
  [next[index], next[index + delta]] = [next[index + delta], next[index]];
  return next;
}

export function AdminApp({ site: savedInitial, products: productsInitial }: { site: Site; products: Product[] }) {
  const [tab, setTab] = useState<TabId>("productos");
  const [colorView, setColorView] = useState<"sitio" | "productos">("sitio");
  const [saved, setSaved] = useState(savedInitial);
  const [site, setSite] = useState(savedInitial);
  const [products, setProducts] = useState(productsInitial);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  // Las categorías guardadas más las que ya usa algún producto: así las existentes aparecen sin tener que cargarlas.
  const used = [...new Set(products.map((p) => p.category))].filter((c) => !site.shop.categories.includes(c)).sort((a, b) => a.localeCompare(b, "es"));
  const categories = [...site.shop.categories, ...used];

  const dirty = JSON.stringify(site) !== JSON.stringify(saved);
  const patch = <K extends keyof Site>(key: K, value: Partial<Site[K]>) =>
    setSite((prev) => ({ ...prev, [key]: { ...prev[key], ...value } }));

  // Un color guardado desde el formulario de un producto ya quedó en la base: no cuenta como cambio pendiente.
  const setColorPresets = (colors: ColorPreset[]) => {
    const withColors = (prev: Site) => ({ ...prev, shop: { ...prev.shop, colors } });
    setSaved(withColors);
    setSite(withColors);
  };

  const save = () =>
    startTransition(async () => {
      try {
        setError("");
        const clean = await saveSiteAction(site);
        setSaved(clean);
        setSite(clean);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudieron guardar los cambios");
      }
    });

  return (
    <div className="admin">
      <header className="admin-top">
        <strong>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-horizontal-oscuro.svg" alt={saved.brand.name} /> <span>Panel</span>
        </strong>
        <div>
          <a className="a-btn" href="/" target="_blank" rel="noopener">
            <ExternalLink aria-hidden /> Ver el sitio
          </a>
          <form action={logout}>
            <button className="a-btn">
              <LogOut aria-hidden /> Salir
            </button>
          </form>
        </div>
      </header>

      <div className="admin-body">
        <nav className="admin-tabs" aria-label="Secciones">
          {TABS.map(([id, label]) => (
            <button key={id} className={tab === id ? "active" : ""} aria-current={tab === id} onClick={() => (setTab(id), window.scrollTo(0, 0))}>
              {label}
            </button>
          ))}
        </nav>

        <main className="admin-main">
          {tab === "productos" && <ProductsTab products={products} onChange={setProducts} categories={categories} usdRate={saved.shop.usdRate} colorPresets={site.shop.colors} onColorPresets={setColorPresets} />}

          {tab === "categorias" && <CategoriesTab categories={categories} products={products} onChange={(list) => patch("shop", { categories: list })} />}

          {tab === "portada" && (
            <section>
              <div className="tab-head">
                <div>
                  <h2>Portada</h2>
                  <p>Lo primero que se ve al entrar: el logo, el título y los botones.</p>
                </div>
              </div>
              <div className="panel">
                <span className="field-label">Imagen de fondo</span>
                <p className="field-hint">Sin imagen, la portada usa el color principal. Mejor una foto horizontal y ancha.</p>
                <ImageInput value={site.hero.image} onChange={(image) => patch("hero", { image })} />
                {site.hero.image && (
                  <Field label={`Oscurecer la foto: ${site.hero.overlay}%`} hint="Subilo si el texto no se lee bien sobre la foto.">
                    <input type="range" min={0} max={90} step={5} value={site.hero.overlay} onChange={(e) => patch("hero", { overlay: Number(e.target.value) })} />
                  </Field>
                )}
              </div>
              <SlidesPanel slides={site.hero.slides} onChange={(slides) => patch("hero", { slides })} />
              <div className="panel">
                <div className="form-grid">
                  <Field label="Texto chico de arriba">
                    <Text value={site.hero.eyebrow} onChange={(eyebrow) => patch("hero", { eyebrow })} />
                  </Field>
                  <Field label="Título">
                    <Text value={site.hero.tagline} onChange={(tagline) => patch("hero", { tagline })} />
                  </Field>
                  <Field label="Descripción" wide>
                    <Text value={site.hero.text} onChange={(text) => patch("hero", { text })} multiline />
                  </Field>
                </div>
              </div>
            </section>
          )}

          {tab === "banners" && (
            <BannersTab banners={site.banners} onChange={(banners) => setSite((prev) => ({ ...prev, banners }))} />
          )}

          {tab === "info" && (
            <section>
              <div className="tab-head">
                <div>
                  <h2>Marquesina y cómo comprar</h2>
                  <p>La cinta de texto que se mueve bajo la portada y los pasos de “Cómo comprar”.</p>
                </div>
              </div>
              <div className="panel">
                <h3>Marquesina</h3>
                {site.strip.map((text, i) => (
                  <div className="line-row" key={i}>
                    <Text value={text} onChange={(v) => setSite((prev) => ({ ...prev, strip: prev.strip.map((t, j) => (j === i ? v : t)) }))} />
                    <button className="icon-btn" onClick={() => setSite((prev) => ({ ...prev, strip: prev.strip.filter((_, j) => j !== i) }))} aria-label="Quitar frase">
                      <Trash2 />
                    </button>
                  </div>
                ))}
                <button className="a-btn" onClick={() => setSite((prev) => ({ ...prev, strip: [...prev.strip, ""] }))}>
                  <Plus aria-hidden /> Agregar frase
                </button>
              </div>

              <div className="panel">
                <h3>Cómo comprar</h3>
                <p className="field-hint">Los pasos se muestran numerados, en este orden. Sin pasos, la sección no aparece.</p>
                {site.steps.map((step, i) => {
                  const setStep = (value: Partial<Step>) => setSite((prev) => ({ ...prev, steps: prev.steps.map((x, j) => (j === i ? { ...x, ...value } : x)) }));
                  return (
                    <div className="step-row" key={step.id}>
                      <strong>{i + 1}</strong>
                      <div className="form-grid">
                        <div className="field is-wide">
                          <span className="field-label">Ícono</span>
                          <div className="icon-picker">
                            {Object.entries(STEP_ICONS).map(([name, { label, Icon }]) => (
                              <button key={name} className={step.icon === name ? "active" : ""} onClick={() => setStep({ icon: name })} title={label} aria-label={label} aria-pressed={step.icon === name}>
                                <Icon strokeWidth={1.5} />
                              </button>
                            ))}
                          </div>
                        </div>
                        <Field label="Título">
                          <Text value={step.title} onChange={(title) => setStep({ title })} maxLength={60} />
                        </Field>
                        <Field label="Texto">
                          <Text value={step.text} onChange={(text) => setStep({ text })} maxLength={240} />
                        </Field>
                      </div>
                      <button className="icon-btn" onClick={() => setSite((prev) => ({ ...prev, steps: prev.steps.filter((_, j) => j !== i) }))} aria-label={`Quitar el paso ${i + 1}`}>
                        <Trash2 />
                      </button>
                    </div>
                  );
                })}
                {site.steps.length < 4 && (
                  <button className="a-btn" onClick={() => setSite((prev) => ({ ...prev, steps: [...prev.steps, { id: crypto.randomUUID(), icon: "message", title: "", text: "" }] }))}>
                    <Plus aria-hidden /> Agregar paso
                  </button>
                )}
              </div>

            </section>
          )}

          {tab === "datos" && (
            <section>
              <div className="tab-head">
                <div>
                  <h2>Datos y contacto</h2>
                  <p>Nombre de la marca, contacto y lo que aparece en el pie de página.</p>
                </div>
              </div>
              <div className="panel">
                <h3>Marca</h3>
                <div className="form-grid">
                  <Field label="Nombre">
                    <Text value={site.brand.name} onChange={(name) => patch("brand", { name })} />
                  </Field>
                  <Field label="Descripción para Google y para cuando se comparte el link" wide>
                    <Text value={site.brand.description} onChange={(description) => patch("brand", { description })} multiline />
                  </Field>
                </div>
              </div>
              <div className="panel">
                <h3>Quiénes somos</h3>
                <span className="field-label">Foto</span>
                <p className="field-hint">Queda mejor en vertical. Sin foto subida se usa la que ya está cargada en el sitio.</p>
                <ImageInput value={site.about.image} onChange={(image) => patch("about", { image })} />
                <div className="form-grid">
                  <Field label="Título">
                    <Text value={site.about.title} onChange={(title) => patch("about", { title })} maxLength={60} />
                  </Field>
                  <Field label="Pie de foto">
                    <Text value={site.about.caption} onChange={(caption) => patch("about", { caption })} maxLength={120} />
                  </Field>
                  <Field label="Texto" hint="Si queda vacío, la sección no aparece." wide>
                    <Text value={site.about.text} onChange={(text) => patch("about", { text })} multiline maxLength={900} />
                  </Field>
                </div>
                <span className="field-label">Quiénes están detrás</span>
                <p className="field-hint">Nombre, usuario de Instagram sin arroba y WhatsApp con código de país (5492615551234). Instagram y WhatsApp son opcionales.</p>
                {site.about.people.map((person, i) => {
                  const setPerson = (value: Partial<Person>) => patch("about", { people: site.about.people.map((x, j) => (j === i ? { ...x, ...value } : x)) });
                  return (
                    <div className="line-row" key={person.id}>
                      <Text value={person.name} onChange={(name) => setPerson({ name })} placeholder="Nombre" maxLength={40} />
                      <Text value={person.instagram} onChange={(instagram) => setPerson({ instagram })} placeholder="Instagram" maxLength={40} />
                      <Text value={person.whatsapp} onChange={(whatsapp) => setPerson({ whatsapp })} placeholder="WhatsApp" inputMode="tel" maxLength={20} />
                      <button className="icon-btn" onClick={() => patch("about", { people: site.about.people.filter((_, j) => j !== i) })} aria-label={`Quitar a ${person.name || "esta persona"}`}>
                        <Trash2 />
                      </button>
                    </div>
                  );
                })}
                {site.about.people.length < 6 && (
                  <button className="a-btn" onClick={() => patch("about", { people: [...site.about.people, { id: crypto.randomUUID(), name: "", instagram: "", whatsapp: "" }] })}>
                    <Plus aria-hidden /> Agregar persona
                  </button>
                )}
              </div>
              <div className="panel">
                <h3>Contacto</h3>
                <div className="form-grid">
                  <Field label="WhatsApp" hint="Con código de país y área, solo números: 5492615551234. Si queda vacío, las consultas van a Instagram.">
                    <Text value={site.contact.whatsapp} onChange={(whatsapp) => patch("contact", { whatsapp })} inputMode="tel" placeholder="5492615551234" />
                  </Field>
                  <Field label="Instagram" hint="El usuario, sin la arroba. Si queda vacío, no se muestra.">
                    <Text value={site.contact.instagram} onChange={(instagram) => patch("contact", { instagram })} />
                  </Field>
                  <Field label="Email de contacto" hint="Aparece en el pie de página. Si queda vacío, no se muestra.">
                    <Text value={site.contact.email} onChange={(email) => patch("contact", { email })} inputMode="email" placeholder="hola@tumarca.com" />
                  </Field>
                  <Field
                    label="Mensaje de los botones de WhatsApp"
                    hint="Es el texto que se abre en WhatsApp desde el encabezado, la portada, el pie de página y el botón flotante. {marca} se reemplaza por el nombre de la marca. Si queda vacío, vuelve el mensaje original."
                    wide
                  >
                    <Text value={site.contact.generalMessage} onChange={(generalMessage) => patch("contact", { generalMessage })} multiline maxLength={300} />
                  </Field>
                  <Field
                    label="Mensaje del botón Consultar"
                    hint="Es el texto que se abre en WhatsApp al tocar Consultar en un producto. {producto}, {version} y {color} se reemplazan por lo que eligió la persona. Si queda vacío, vuelve el mensaje original."
                    wide
                  >
                    <Text value={site.contact.productMessage} onChange={(productMessage) => patch("contact", { productMessage })} multiline maxLength={300} />
                  </Field>
                  <Field label="Dirección" hint="Aparece en el pie de página. Si queda vacía, no se muestra.">
                    <Text value={site.contact.address} onChange={(address) => patch("contact", { address })} />
                  </Field>
                  <Field label="Horarios" hint="Aparecen en el pie de página. Si quedan vacíos, no se muestran.">
                    <Text value={site.contact.hours} onChange={(hours) => patch("contact", { hours })} placeholder="Lunes a sábado de 10 a 20 h" />
                  </Field>
                </div>
              </div>
              <div className="panel">
                <h3>Pie de página</h3>
                <div className="form-grid">
                  <Field label="Sobre la marca" wide>
                    <Text value={site.footer.about} onChange={(about) => patch("footer", { about })} multiline />
                  </Field>
                  <Field label="Medios de pago" hint="Separados por coma.">
                    <Text
                      value={site.footer.payments.join(", ")}
                      onChange={(v) => patch("footer", { payments: v.split(",").map((x) => x.trimStart()) })}
                    />
                  </Field>
                </div>
              </div>
              <div className="panel">
                <h3>Catálogo</h3>
                <div className="form-grid">
                  <Field
                    label="Cotización del dólar (pesos)"
                    hint="Los precios se cargan en dólares y el catálogo muestra además el equivalente en pesos, redondeado a mil. En 0 se usa el dólar oficial del día (dolarapi.com); si cargás un valor, se usa ese."
                  >
                    <Text value={site.shop.usdRate ? String(site.shop.usdRate) : ""} onChange={(v) => patch("shop", { usdRate: Number(v.replace(/\D/g, "")) || 0 })} inputMode="numeric" placeholder="0" />
                  </Field>
                </div>
              </div>
            </section>
          )}

          {tab === "colores" && (
            <section>
              <div className="tab-head">
                <div>
                  <h2>Colores</h2>
                  <p>
                    {colorView === "sitio"
                      ? "El color del texto se ajusta solo para que siempre se lea sobre el fondo que elijas."
                      : "Los colores que usás siempre. Al cargar un producto aparecen para elegirlos con un toque, sin escribir el código."}
                  </p>
                </div>
                {colorView === "productos" && (
                  <button
                    className="a-btn is-primary"
                    disabled={site.shop.colors.length >= MAX_COLOR_PRESETS}
                    onClick={() => patch("shop", { colors: [...site.shop.colors, { name: "", hex: "#1F2022" }] })}
                  >
                    <Plus aria-hidden /> Agregar color
                  </button>
                )}
              </div>
              <div className="view-switch" role="group" aria-label="Qué colores editar">
                <button className={colorView === "sitio" ? "active" : ""} aria-pressed={colorView === "sitio"} onClick={() => setColorView("sitio")}>
                  Colores del sitio
                </button>
                <button className={colorView === "productos" ? "active" : ""} aria-pressed={colorView === "productos"} onClick={() => setColorView("productos")}>
                  Colores de productos
                </button>
              </div>
              {colorView === "productos" &&
                (site.shop.colors.length === 0 ? (
                  <div className="empty">
                    <p>Todavía no hay colores guardados. Agregá los que usás siempre.</p>
                  </div>
                ) : (
                  <div className="panel">
                    <div className="preset-list">
                      {site.shop.colors.map((c, i) => {
                        const setPreset = (value: Partial<ColorPreset>) =>
                          patch("shop", { colors: site.shop.colors.map((x, j) => (j === i ? { ...x, ...value } : x)) });
                        return (
                          <div className="preset-row" key={i}>
                            <Text value={c.name} onChange={(name) => setPreset({ name })} placeholder="Nombre del color" maxLength={30} />
                            <ColorInput label={c.name || `Color ${i + 1}`} value={c.hex} onChange={(hex) => setPreset({ hex })} />
                            <button
                              className="icon-btn"
                              onClick={() => patch("shop", { colors: site.shop.colors.filter((_, j) => j !== i) })}
                              aria-label={`Eliminar ${c.name || "color"}`}
                            >
                              <Trash2 />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              {colorView === "sitio" && (
                <div className="theme-layout">
                  <div>
                    <div className="panel">
                      <h3>Paletas listas</h3>
                      <div className="presets">
                        {PRESETS.map(([name, theme]) => (
                          <button key={name} onClick={() => setSite((prev) => ({ ...prev, theme }))}>
                            <span>
                              {[theme.primary, theme.accent, theme.soft, theme.silver, theme.bg].map((c, i) => (
                                <i key={i} style={{ background: c }} />
                              ))}
                            </span>
                            {name}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="panel">
                      {THEME_FIELDS.map(([key, label, hint]) => (
                        <div className="color-field" key={key}>
                          <span>
                            <strong>{label}</strong>
                            <small>{hint}</small>
                          </span>
                          <ColorInput label={label} value={site.theme[key]} onChange={(hex) => patch("theme", { [key]: hex })} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <ThemePreview theme={site.theme} />
                </div>
              )}
            </section>
          )}

          {tab !== "productos" && (
            <div className="save-bar">
              {error && <p className="form-error">{error}</p>}
              {!dirty && !error && <span className="saved-note">Sin cambios pendientes</span>}
              {dirty && (
                <button className="a-btn" onClick={() => setSite(saved)} disabled={pending}>
                  Descartar
                </button>
              )}
              <button className="a-btn is-primary" onClick={save} disabled={!dirty || pending}>
                {pending ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function CategoriesTab({ categories, products, onChange }: { categories: string[]; products: Product[]; onChange: (c: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const name = draft.trim();
  const repeated = categories.some((c) => c.toLowerCase() === name.toLowerCase());
  const full = categories.length >= MAX_CATEGORIES;

  const add = () => {
    if (!name || repeated || full) return;
    onChange([...categories, name]);
    setDraft("");
  };

  return (
    <section>
      <div className="tab-head">
        <div>
          <h2>Categorías</h2>
          <p>Son las que se eligen al cargar un producto y las que aparecen como filtros en el catálogo cuando tienen productos.</p>
        </div>
      </div>

      <div className="panel">
        <span className="field-label">Nueva categoría</span>
        <form
          className="line-row"
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
        >
          <Text value={draft} onChange={setDraft} placeholder="Celulares" maxLength={40} />
          <button className="a-btn is-primary" disabled={!name || repeated || full}>
            <Plus aria-hidden /> Agregar
          </button>
        </form>
        {repeated && <span className="field-hint">Esa categoría ya existe.</span>}
        {full && <span className="field-hint">Llegaste al máximo de {MAX_CATEGORIES} categorías.</span>}
      </div>

      {categories.length === 0 ? (
        <div className="empty">
          <p>Todavía no hay categorías. Agregá la primera para poder elegirla en los productos.</p>
        </div>
      ) : (
        <ul className="category-list">
          {categories.map((c) => {
            const count = products.filter((p) => p.category === c).length;
            return (
              <li key={c}>
                <strong>{c}</strong>
                <span>{count === 0 ? "Sin productos" : count === 1 ? "1 producto" : `${count} productos`}</span>
                <button
                  className="icon-btn"
                  disabled={count > 0}
                  onClick={() => onChange(categories.filter((x) => x !== c))}
                  title={count > 0 ? "Tiene productos: cambiales la categoría para poder eliminarla." : undefined}
                  aria-label={`Eliminar ${c}`}
                >
                  <Trash2 />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function SlidesPanel({ slides, onChange }: { slides: HeroSlide[]; onChange: (s: HeroSlide[]) => void }) {
  const setSlide = (index: number, value: Partial<HeroSlide>) => onChange(slides.map((s, i) => (i === index ? { ...s, ...value } : s)));
  const drag = useRef<{ index: number; x: number; y: number; from: HeroSlide } | null>(null);

  // Arrastrar la vista previa mueve la foto: hacia abajo muestra más de la parte de arriba.
  function onDrag(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d) return;
    const box = e.currentTarget.getBoundingClientRect();
    const clamp = (n: number) => Math.round(Math.min(100, Math.max(0, n)));
    setSlide(d.index, {
      x: clamp(d.from.x - ((e.clientX - d.x) / box.width) * 100),
      y: clamp(d.from.y - ((e.clientY - d.y) / box.height) * 100),
    });
  }

  return (
    <div className="panel">
      <span className="field-label">Fotos del carrusel</span>
      <p className="field-hint">
        Van pasando solas después de la portada, en este orden, como fondo de la portada: el logo, los textos y los botones quedan encima. Cada foto se recorta para llenar el espacio, distinto en computadora y en celular: acomodala arrastrando cualquiera de las vistas previas o con los controles. En computadora se estira a todo el ancho, así que convienen fotos horizontales de 2000 px o más. Hasta {MAX_HERO_SLIDES}.
      </p>
      {slides.map((slide, i) => (
        <div className="slide-editor" key={slide.image}>
          <div className="slide-previews">
            <figure>
              <div
                className="slide-frame is-desktop"
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  drag.current = { index: i, x: e.clientX, y: e.clientY, from: slide };
                }}
                onPointerMove={onDrag}
                onPointerUp={() => (drag.current = null)}
                onPointerCancel={() => (drag.current = null)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={slide.image} alt="" style={slideStyle(slide)} draggable={false} />
              </div>
              <figcaption>Computadora</figcaption>
            </figure>
            <figure>
              <div
                className="slide-frame is-mobile"
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  drag.current = { index: i, x: e.clientX, y: e.clientY, from: slide };
                }}
                onPointerMove={onDrag}
                onPointerUp={() => (drag.current = null)}
                onPointerCancel={() => (drag.current = null)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={slide.image} alt="" style={slideStyle(slide)} draggable={false} />
              </div>
              <figcaption>Celular</figcaption>
            </figure>
          </div>
          <div className="slide-controls">
            <div className="panel-head">
              <h3>Foto {i + 1}</h3>
              <div className="row-actions">
                <button className="icon-btn" disabled={i === 0} onClick={() => onChange(moveItem(slides, i, -1))} aria-label="Mover antes">
                  <ArrowUp />
                </button>
                <button className="icon-btn" disabled={i === slides.length - 1} onClick={() => onChange(moveItem(slides, i, 1))} aria-label="Mover después">
                  <ArrowDown />
                </button>
                <button className="icon-btn" onClick={() => onChange(slides.filter((_, j) => j !== i))} aria-label="Quitar foto">
                  <Trash2 />
                </button>
              </div>
            </div>
            <Field label="Arriba / abajo">
              <input type="range" min={0} max={100} value={slide.y} onChange={(e) => setSlide(i, { y: Number(e.target.value) })} />
            </Field>
            <Field label="Izquierda / derecha">
              <input type="range" min={0} max={100} value={slide.x} onChange={(e) => setSlide(i, { x: Number(e.target.value) })} />
            </Field>
            <Field label={`Zoom: ${slide.zoom}%`} hint="100% es lo más lejos: la foto llena justo el espacio, sin bordes vacíos.">
              <input type="range" min={100} max={MAX_SLIDE_ZOOM} step={5} value={slide.zoom} onChange={(e) => setSlide(i, { zoom: Number(e.target.value) })} />
            </Field>
            {(slide.x !== 50 || slide.y !== 50 || slide.zoom !== 100) && (
              <button className="a-btn" onClick={() => setSlide(i, { x: 50, y: 50, zoom: 100 })}>
                Volver a centrar
              </button>
            )}
          </div>
        </div>
      ))}
      {slides.length < MAX_HERO_SLIDES && (
        <UploadButton
          label="Subir fotos"
          multiple
          maxSide={2560}
          onUploaded={(urls) => onChange([...slides, ...urls.map((image) => ({ image, x: 50, y: 50, zoom: 100 }))].slice(0, MAX_HERO_SLIDES))}
        />
      )}
    </div>
  );
}

function BannersTab({ banners, onChange }: { banners: Banner[]; onChange: (b: Banner[]) => void }) {
  const setBanner = (index: number, value: Partial<Banner>) => onChange(banners.map((b, i) => (i === index ? { ...b, ...value } : b)));
  const add = () =>
    onChange([...banners, { id: crypto.randomUUID(), image: null, icon: "", cards: false, title: "", text: "", buttonLabel: "Ver catálogo", link: "#catalogo", active: true }]);

  return (
    <section>
      <div className="tab-head">
        <div>
          <h2>Banners</h2>
          <p>Aparecen entre la portada y el catálogo. Con uno ocupa todo el ancho; con varios se reparten o se deslizan.</p>
        </div>
        <button className="a-btn is-primary" onClick={add}>
          <Plus aria-hidden /> Agregar banner
        </button>
      </div>

      {banners.length === 0 && (
        <div className="empty">
          <p>No hay banners. Agregá uno para anunciar una promo, una novedad o una oferta.</p>
        </div>
      )}

      {banners.map((b, i) => (
        <div className="panel" key={b.id}>
          <div className="panel-head">
            <h3>{b.title || `Banner ${i + 1}`}</h3>
            <div className="row-actions">
              <label className="switch">
                <input type="checkbox" checked={b.active} onChange={(e) => setBanner(i, { active: e.target.checked })} /> Visible
              </label>
              <button className="icon-btn" disabled={i === 0} onClick={() => onChange(moveItem(banners, i, -1))} aria-label="Mover antes">
                <ArrowUp />
              </button>
              <button className="icon-btn" disabled={i === banners.length - 1} onClick={() => onChange(moveItem(banners, i, 1))} aria-label="Mover después">
                <ArrowDown />
              </button>
              <button className="icon-btn" onClick={() => onChange(banners.filter((_, j) => j !== i))} aria-label="Eliminar banner">
                <Trash2 />
              </button>
            </div>
          </div>
          <span className="field-label">Imagen</span>
          <p className="field-hint">Sin imagen, el banner usa un color de la paleta.</p>
          <ImageInput value={b.image} onChange={(image) => setBanner(i, { image })} />
          <span className="field-label">Ícono al lado del título</span>
          <div className="icon-picker">
            <button className={b.icon ? "" : "active"} onClick={() => setBanner(i, { icon: "" })} aria-pressed={!b.icon} title="Sin ícono" aria-label="Sin ícono">
              –
            </button>
            {Object.entries(STEP_ICONS).map(([name, { label, Icon }]) => (
              <button key={name} className={b.icon === name ? "active" : ""} onClick={() => setBanner(i, { icon: name })} title={label} aria-label={label} aria-pressed={b.icon === name}>
                <Icon strokeWidth={1.5} />
              </button>
            ))}
          </div>
          <div className="checks">
            <label>
              <input type="checkbox" checked={b.cards} onChange={(e) => setBanner(i, { cards: e.target.checked })} /> Mostrar los logos de Visa, Mastercard, Naranja X y American Express
            </label>
          </div>
          <div className="form-grid">
            <Field label="Título">
              <Text value={b.title} onChange={(title) => setBanner(i, { title })} />
            </Field>
            <Field label="Texto">
              <Text value={b.text} onChange={(text) => setBanner(i, { text })} />
            </Field>
            <Field label="Texto del botón">
              <Text value={b.buttonLabel} onChange={(buttonLabel) => setBanner(i, { buttonLabel })} />
            </Field>
            <Field label="Link" hint="#catalogo lleva al catálogo y whatsapp abre la consulta por WhatsApp. También puede ser un link completo (https://…).">
              <Text value={b.link} onChange={(link) => setBanner(i, { link })} placeholder="#catalogo" />
            </Field>
          </div>
        </div>
      ))}
    </section>
  );
}

const PREVIEW_WIDTH = { desktop: 1280, mobile: 390 };

/** La página real dentro de un marco, con la paleta que se está editando aplicada sin guardar. */
function ThemePreview({ theme }: { theme: Theme }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<keyof typeof PREVIEW_WIDTH>("desktop");
  const [size, setSize] = useState({ width: 0, height: 0 });

  // El sitio lee sus colores de variables CSS: un <style> agregado al final del <head> del marco pisa las guardadas.
  const applyTheme = useCallback(() => {
    const doc = frame.current?.contentDocument;
    if (!doc?.head) return;
    let style = doc.getElementById("theme-preview");
    if (!style) {
      style = doc.createElement("style");
      style.id = "theme-preview";
      doc.head.appendChild(style);
    }
    style.textContent = themeCss(theme);
  }, [theme]);

  useEffect(() => {
    applyTheme();
  }, [applyTheme]);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setSize({ width: el.clientWidth, height: el.clientHeight }));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const width = PREVIEW_WIDTH[mode];
  const scale = size.width ? Math.min(1, size.width / width) : 0;

  return (
    <div className="theme-preview">
      <div className="preview-bar">
        <span className="preview-dots" aria-hidden>
          <i />
          <i />
          <i />
        </span>
        <span className="preview-note">Vista previa, todavía sin guardar</span>
        <div className="preview-modes" role="group" aria-label="Tamaño de la vista previa">
          <button className={mode === "desktop" ? "active" : ""} aria-pressed={mode === "desktop"} onClick={() => setMode("desktop")}>
            <Monitor aria-hidden /> Escritorio
          </button>
          <button className={mode === "mobile" ? "active" : ""} aria-pressed={mode === "mobile"} onClick={() => setMode("mobile")}>
            <Smartphone aria-hidden /> Celular
          </button>
        </div>
      </div>
      <div className="preview-stage" ref={stage}>
        {scale > 0 && (
          <iframe
            ref={frame}
            src="/"
            title="Vista previa del sitio"
            onLoad={applyTheme}
            style={{
              width,
              height: size.height / scale,
              transform: `scale(${scale})`,
              // Achicado desde arriba a la izquierda; en celular se centra en el espacio que sobra.
              marginLeft: Math.max(0, (size.width - width * scale) / 2),
            }}
          />
        )}
      </div>
    </div>
  );
}
