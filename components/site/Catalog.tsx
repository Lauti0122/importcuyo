"use client";

import { ChevronLeft, ChevronRight, CreditCard, Gamepad2, Headphones, House, Images, Laptop, Package, Search, Smartphone, Tablet, Watch, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ars, contactUrl, finalPrice, fromPrice, inColor, inkOn, installment, onSale, productMessage, toArs, usd } from "@/lib/format";
import type { Product, ProductVariant, Site } from "@/lib/types";

const ALL = "Todo";
const NEW = "Nuevos";
const SALE = "Ofertas";

// Ícono de una categoría sin fotos todavía, según su nombre.
const CATEGORY_ICONS: [RegExp, LucideIcon][] = [
  [/celu|phone|tel[eé]f/i, Smartphone],
  [/note|laptop|mac|comput/i, Laptop],
  [/audio|parlante|auricular|sonido/i, Headphones],
  [/gam|consol|juego|play/i, Gamepad2],
  [/tablet|ipad/i, Tablet],
  [/reloj|watch|smartband/i, Watch],
  [/hogar|casa|aspirad/i, House],
];
const categoryIcon = (name: string) => CATEGORY_ICONS.find(([pattern]) => pattern.test(name))?.[1] ?? Package;

/** Para buscar sin que importen mayúsculas ni acentos. */
const plain = (text: string) => text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export type CatalogFilters = { category: string; brand: string; query: string; sort: string };

const PAGE_SIZE = 24;
const SORTS = ["default", "sale", "asc", "desc"];

/** Los filtros como parámetros de la dirección, para poder compartir el link de una búsqueda. */
function filtersToSearch({ category, brand, query, sort }: CatalogFilters) {
  const params = new URLSearchParams();
  if (category !== ALL) params.set("categoria", category);
  if (brand) params.set("marca", brand);
  if (query.trim()) params.set("buscar", query.trim());
  if (sort !== "default") params.set("orden", sort);
  const text = params.toString();
  return text ? `?${text}` : "";
}

/** Catálogo completo: categorías, buscador, marca, orden y carga de a tandas. */
export function Catalog({
  products,
  contact,
  usdRate,
  initial,
}: {
  products: Product[];
  contact: Site["contact"];
  usdRate: number;
  initial?: Partial<CatalogFilters>;
}) {
  const [category, setCategory] = useState(initial?.category || ALL);
  const [sort, setSort] = useState(initial?.sort && SORTS.includes(initial.sort) ? initial.sort : "default");
  const [brand, setBrand] = useState(initial?.brand ?? "");
  const [query, setQuery] = useState(initial?.query ?? "");
  // Las tandas extra valen solo para los filtros con los que se pidieron: al cambiar un filtro se vuelve a la primera.
  const [more, setMore] = useState({ key: "", pages: 0 });
  const search = filtersToSearch({ category, brand, query, sort });
  const shown = PAGE_SIZE * (1 + (more.key === search ? more.pages : 0));

  // La búsqueda queda en la dirección para poder compartirla.
  useEffect(() => {
    window.history.replaceState(null, "", `${window.location.pathname}${search}`);
  }, [search]);

  const chips = useMemo(() => {
    const categories = [...new Set(products.map((p) => p.category))].sort((a, b) => a.localeCompare(b, "es"));
    const newCount = products.filter((p) => p.isNew).length;
    const saleCount = products.filter(onSale).length;
    return [
      { name: ALL, count: products.length, highlight: false },
      ...(newCount ? [{ name: NEW, count: newCount, highlight: true }] : []),
      ...(saleCount ? [{ name: SALE, count: saleCount, highlight: true }] : []),
      ...categories.map((name) => ({
        name,
        count: products.filter((p) => p.category === name).length,
        highlight: false,
      })),
    ];
  }, [products]);

  const inCategory = useMemo(() => {
    if (category === NEW) return products.filter((p) => p.isNew);
    if (category === SALE) return products.filter(onSale);
    if (category !== ALL) return products.filter((p) => p.category === category);
    return products;
  }, [products, category]);

  // Solo las marcas que hay dentro de la categoría elegida.
  const brands = useMemo(
    () => [...new Set(inCategory.map((p) => p.brand).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es")),
    [inCategory],
  );
  const activeBrand = brands.includes(brand) ? brand : "";

  const items = useMemo(() => {
    let list = inCategory;
    if (activeBrand) list = list.filter((p) => p.brand === activeBrand);
    const words = plain(query).split(/\s+/).filter(Boolean);
    if (words.length) {
      list = list.filter((p) => {
        const text = plain(`${p.name} ${p.brand} ${p.category} ${p.specs.join(" ")}`);
        return words.every((w) => text.includes(w));
      });
    }
    list = [...list];
    if (sort === "sale") list.sort((a, b) => Number(onSale(b)) - Number(onSale(a)));
    if (sort === "asc") list.sort((a, b) => fromPrice(a) - fromPrice(b));
    if (sort === "desc") list.sort((a, b) => fromPrice(b) - fromPrice(a));
    return list;
  }, [inCategory, activeBrand, query, sort]);

  const page = items.slice(0, shown);
  const filtered = category !== ALL || Boolean(activeBrand) || Boolean(query.trim());

  return (
    // El contenedor limita la barra de categorías fija al tramo del catálogo.
    <div className="catalog-wrap">
      <CategoryNav chips={chips} active={category} onSelect={setCategory} />

      <main className="catalog-section" id="catalogo">
        <div className="wrap">
          <div className="catalog-head">
            <h1>{category === ALL ? "Catálogo" : category}</h1>
            <div className="catalog-tools">
              <label className="search">
                <Search aria-hidden />
                <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar un producto" aria-label="Buscar un producto" />
              </label>
              {brands.length > 1 && (
                <select value={activeBrand} onChange={(e) => setBrand(e.target.value)} aria-label="Filtrar por marca">
                  <option value="">Marca: todas</option>
                  {brands.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              )}
              <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Ordenar">
                <option value="default">Orden: destacados</option>
                <option value="sale">Ofertas primero</option>
                <option value="asc">Precio: menor a mayor</option>
                <option value="desc">Precio: mayor a menor</option>
              </select>
              <span className="result-count">
                {items.length} {items.length === 1 ? "producto" : "productos"}
              </span>
            </div>
          </div>

          <div className="grid">
            {page.length ? (
              page.map((p) => <Card key={p.id} product={p} contact={contact} usdRate={usdRate} />)
            ) : (
              <div className="empty-state">
                <h3>No hay productos con ese filtro</h3>
                <p>Probá con otra categoría, otra marca u otra búsqueda.</p>
                {filtered && (
                  <button className="btn btn-dark" onClick={() => (setCategory(ALL), setBrand(""), setQuery(""))}>
                    Ver todo el catálogo
                  </button>
                )}
              </div>
            )}
          </div>

          {items.length > shown && (
            <div className="load-more">
              <p>
                Viendo {page.length} de {items.length} productos
              </p>
              <button className="btn btn-dark" onClick={() => setMore((prev) => ({ key: search, pages: (prev.key === search ? prev.pages : 0) + 1 }))}>
                Ver más productos
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/** Accesos por categoría de la portada: una tarjeta por cada una, con la foto de su primer producto. */
export function CategoryTiles({ products }: { products: Product[] }) {
  const tiles = [...new Set(products.map((p) => p.category))]
    .sort((a, b) => a.localeCompare(b, "es"))
    .map((name) => {
      const list = products.filter((p) => p.category === name);
      return { name, count: list.length, image: list.flatMap((p) => p.colors.flatMap((c) => c.images))[0] ?? null };
    });
  if (tiles.length < 2) return null;
  return (
    <section className="cat-tiles" aria-label="Categorías">
      <div className="wrap">
        <h2>Qué importamos</h2>
        <div className="cat-tiles-grid">
          {tiles.map((tile) => {
            const Icon = categoryIcon(tile.name);
            return (
              <Link key={tile.name} className="cat-tile" href={`/catalogo${filtersToSearch({ category: tile.name, brand: "", query: "", sort: "default" })}`}>
                <span className="cat-tile-media">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {tile.image ? <img src={tile.image} alt="" loading="lazy" /> : <Icon strokeWidth={1.2} aria-hidden />}
                </span>
                <span className="cat-tile-name">{tile.name}</span>
                <span className="cat-tile-count">
                  {tile.count} {tile.count === 1 ? "producto" : "productos"}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/** Los primeros productos del catálogo en la portada, con el acceso al catálogo completo. */
export function Featured({ products, contact, usdRate, limit = 8 }: { products: Product[]; contact: Site["contact"]; usdRate: number; limit?: number }) {
  if (!products.length) return null;
  return (
    <section className="featured" id="catalogo">
      <div className="wrap">
        <div className="catalog-head">
          <h2>Destacados</h2>
          <Link className="btn btn-dark" href="/catalogo">
            Ver los {products.length} productos
          </Link>
        </div>
        <div className="grid">
          {products.slice(0, limit).map((p) => (
            <Card key={p.id} product={p} contact={contact} usdRate={usdRate} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryNav({
  chips,
  active,
  onSelect,
}: {
  chips: { name: string; count: number; highlight: boolean }[];
  active: string;
  onSelect: (name: string) => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [arrows, setArrows] = useState({ left: false, right: false });

  const update = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setArrows({ left: el.scrollLeft > 4, right: el.scrollLeft < max - 4 });
  }, []);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update, chips]);

  const scrollBy = (left: number) => scroller.current?.scrollBy({ left, behavior: "smooth" });

  return (
    <nav className="cat-nav" aria-label="Categorías">
      <div className="wrap">
        <button className={`cat-arrow cat-arrow-left ${arrows.left ? "" : "is-hidden"}`} onClick={() => scrollBy(-200)} aria-label="Ver categorías anteriores">
          <ChevronLeft />
        </button>
        <div className="cat-scroll" ref={scroller} onScroll={update}>
          {chips.map((chip) => (
            <button
              key={chip.name}
              className={`chip ${chip.name === active ? "active" : ""} ${chip.highlight ? "chip-highlight" : ""}`}
              aria-pressed={chip.name === active}
              onClick={(e) => {
                onSelect(chip.name);
                e.currentTarget.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
              }}
            >
              {chip.name} <span className="count">{chip.count}</span>
            </button>
          ))}
        </div>
        <button className={`cat-arrow cat-arrow-right ${arrows.right ? "" : "is-hidden"}`} onClick={() => scrollBy(200)} aria-label="Ver más categorías">
          <ChevronRight />
        </button>
      </div>
    </nav>
  );
}

/**
 * Precios de una versión: efectivo y, si están cargados, tarjeta en 3 cuotas sin interés y en 12 cuotas fijas.
 * Con cotización, cada uno lleva su equivalente en pesos. `detailed` suma el valor de cada cuota (página del producto).
 */
export function Price({ variant, usdRate, detailed = false }: { variant: ProductVariant; usdRate: number; detailed?: boolean }) {
  const cash = finalPrice(variant);
  const pesos = (price: number) => (usdRate > 0 ? ars(toArs(price, usdRate)) : null);
  const plans = [
    { price: variant.priceCard, count: 3, label: "3 cuotas sin interés", note: "Miércoles y sábados" },
    { price: variant.priceCard12, count: 12, label: "12 cuotas fijas", note: "Todos los días" },
  ].filter((plan): plan is typeof plan & { price: number } => Boolean(plan.price));

  return (
    <div className={`price-block ${detailed ? "is-detailed" : ""}`}>
      <span className="price-kind">Efectivo o transferencia</span>
      {variant.priceSale && <span className="price-secondary is-struck">{usd(variant.price)}</span>}
      <div className="price-row">
        <span className="price-main">{usd(cash)}</span>
        {variant.priceSale && <span className="price-label">Oferta</span>}
        {pesos(cash) && <span className="price-secondary">{pesos(cash)}</span>}
      </div>

      {plans.length > 0 && (
        <ul className="price-plans">
          {plans.map((plan) => (
            <li key={plan.count}>
              <span className="price-kind">
                <CreditCard aria-hidden />
                {plan.label}
                {detailed && <small>{plan.note}</small>}
              </span>
              <span className="price-plan-value">
                <strong>{usd(plan.price)}</strong>
                {pesos(plan.price) && <span className="price-secondary">{pesos(plan.price)}</span>}
              </span>
              {detailed && usdRate > 0 && (
                <span className="price-plan-fee">
                  {plan.count} cuotas de {ars(installment(plan.price, usdRate, plan.count))}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Card({ product: p, contact, usdRate }: { product: Product; contact: Site["contact"]; usdRate: number }) {
  const [colorIndex, setColorIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);

  const color = p.colors[colorIndex] ?? p.colors[0];
  // Se respeta lo que eligió la persona; si no eligió, la primera versión disponible.
  const variantIndex = picked ?? Math.max(p.variants.findIndex((v) => v.inStock), 0);
  const variant = p.variants[variantIndex];
  const soldOut = p.variants.every((v) => !v.inStock);

  const consult = contactUrl(contact, productMessage(contact.productMessage, { producto: p.name, color: color.name, version: variant.label }));

  return (
    <article className="card">
      <div className="card-media">
        {color.images.length ? (
          <div className="card-photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={color.images[0]} alt={`${p.name} color ${color.name}`} loading="lazy" />
            {color.images.length > 1 && (
              <span className="pic-count">
                <Images aria-hidden />
                {color.images.length}
              </span>
            )}
          </div>
        ) : (
          <div className="swatch" style={{ background: color.hex, color: inkOn(color.hex) }}>
            <span className="swatch-tag">Sin foto</span>
            <span className="swatch-mono">{p.name.trim()[0]?.toUpperCase()}</span>
          </div>
        )}
        <div className="tags">
          {p.isNew && <span className="tag tag-new">Nuevo</span>}
          {onSale(p) && <span className="tag tag-sale">Oferta</span>}
          {p.badge && <span className="tag tag-badge">{p.badge}</span>}
        </div>
        {soldOut && <span className="tag tag-stock">No disponible</span>}
      </div>

      <div className="card-body">
        <p className="card-eyebrow">{[p.brand, p.category].filter(Boolean).join(" · ")}</p>
        <h3 className="card-title">
          {/* El enlace cubre toda la tarjeta; colores, versiones y "Consultar" quedan por encima. */}
          <Link href={`/producto/${p.id}`} className="card-link">
            {p.name}
          </Link>
        </h3>
        {p.specs.length > 0 && <p className="card-specs">{p.specs.slice(0, 3).join(" · ")}</p>}

        {/* Los productos sin variantes de color se cargan con un único color "Único": ahí la fila no aporta nada. */}
        <div className="color-row" hidden={p.colors.length === 1 && color.name === "Único"}>
          {p.colors.map((c, i) => (
            <button
              key={c.name}
              className={`color-dot ${i === colorIndex ? "active" : ""}`}
              style={{ background: c.hex }}
              title={c.name}
              aria-label={`Color ${c.name}`}
              aria-pressed={i === colorIndex}
              onClick={() => setColorIndex(i)}
            />
          ))}
          <span className="color-name">
            {color.name}
            {color.extra > 0 && <small> +{usd(color.extra)}</small>}
          </span>
        </div>

        {(p.variants.length > 1 || variant.label) && (
          <div className="size-row">
            {p.variants.map((v, i) => (
              <button
                key={v.label}
                className={`size-chip ${i === variantIndex ? "active" : ""} ${v.inStock ? "" : "is-out"}`}
                aria-pressed={i === variantIndex}
                title={v.inStock ? undefined : "No disponible"}
                onClick={() => setPicked(i)}
              >
                {v.label}
              </button>
            ))}
          </div>
        )}

        <Price variant={inColor(variant, color)} usdRate={usdRate} />

        {consult && (
          <a href={consult} target="_blank" rel="noopener" className="consulta-btn">
            {variant.inStock ? "Encargar" : "Consultar disponibilidad"}
          </a>
        )}
      </div>
    </article>
  );
}
