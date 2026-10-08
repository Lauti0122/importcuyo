"use client";

import { ChevronLeft, ChevronRight, CreditCard, Gamepad2, Headphones, House, Images, Laptop, Package, Search, Smartphone, Tablet, Watch, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ars, contactUrl, finalPrice, fromPrice, inkOn, installment, onSale, productMessage, toArs, usd } from "@/lib/format";
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

export function Catalog({ products, contact, usdRate }: { products: Product[]; contact: Site["contact"]; usdRate: number }) {
  const [category, setCategory] = useState(ALL);
  const [sort, setSort] = useState("default");
  const [brand, setBrand] = useState("");
  const [query, setQuery] = useState("");

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

  // Una tarjeta por categoría, con la foto del primer producto que tenga una.
  const tiles = useMemo(
    () =>
      chips
        .filter((chip) => ![ALL, NEW, SALE].includes(chip.name))
        .map((chip) => ({
          ...chip,
          image: products.filter((p) => p.category === chip.name).flatMap((p) => p.colors.flatMap((c) => c.images))[0] ?? null,
        })),
    [chips, products],
  );

  const openCategory = (name: string) => {
    setCategory(name);
    document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" });
  };

  const brands = useMemo(
    () => [...new Set(products.map((p) => p.brand).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es")),
    [products],
  );

  const items = useMemo(() => {
    let list = products;
    if (category === NEW) list = list.filter((p) => p.isNew);
    else if (category === SALE) list = list.filter(onSale);
    else if (category !== ALL) list = list.filter((p) => p.category === category);
    if (brand) list = list.filter((p) => p.brand === brand);
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
  }, [products, category, brand, query, sort]);

  return (
    // El contenedor limita la barra de categorías fija al tramo del catálogo.
    <div className="catalog-wrap">
      {tiles.length > 1 && (
        <section className="cat-tiles" aria-label="Categorías">
          <div className="wrap">
            <h2>Qué importamos</h2>
            <div className="cat-tiles-grid">
              {tiles.map((tile) => {
                const Icon = categoryIcon(tile.name);
                return (
                  <button key={tile.name} className="cat-tile" onClick={() => openCategory(tile.name)}>
                    <span className="cat-tile-media">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {tile.image ? <img src={tile.image} alt="" loading="lazy" /> : <Icon strokeWidth={1.2} aria-hidden />}
                    </span>
                    <span className="cat-tile-name">{tile.name}</span>
                    <span className="cat-tile-count">
                      {tile.count} {tile.count === 1 ? "producto" : "productos"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}
      <CategoryNav chips={chips} active={category} onSelect={setCategory} />

      <main className="catalog-section" id="catalogo">
        <div className="wrap">
          <div className="catalog-head">
            <h2>{category === ALL ? "Todo el catálogo" : category}</h2>
            <div className="catalog-tools">
              <label className="search">
                <Search aria-hidden />
                <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar un producto" aria-label="Buscar un producto" />
              </label>
              {brands.length > 1 && (
                <select value={brand} onChange={(e) => setBrand(e.target.value)} aria-label="Filtrar por marca">
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
            {items.length ? (
              items.map((p) => <Card key={p.id} product={p} contact={contact} usdRate={usdRate} />)
            ) : (
              <div className="empty-state">
                <h3>No hay productos con ese filtro</h3>
                <p>Probá con otra categoría, otra marca u otra búsqueda.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
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

        {/* La fila de color va siempre, aunque haya uno solo: así los precios quedan a la misma altura en todas las tarjetas. */}
        <div className="color-row">
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
          <span className="color-name">{color.name}</span>
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

        <Price variant={variant} usdRate={usdRate} />

        {consult && (
          <a href={consult} target="_blank" rel="noopener" className="consulta-btn">
            {variant.inStock ? "Encargar" : "Consultar disponibilidad"}
          </a>
        )}
      </div>
    </article>
  );
}
