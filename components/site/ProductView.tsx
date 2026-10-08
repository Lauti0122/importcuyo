"use client";

import { useState } from "react";
import { contactUrl, inColor, inkOn, onSale, productMessage, usd } from "@/lib/format";
import type { Product, Site } from "@/lib/types";
import { Price } from "./Catalog";
import { Lightbox } from "./Lightbox";

export function ProductView({ product: p, contact, usdRate }: { product: Product; contact: Site["contact"]; usdRate: number }) {
  const [colorIndex, setColorIndex] = useState(0);
  const [photo, setPhoto] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [zoomed, setZoomed] = useState(false);

  const color = p.colors[colorIndex];
  // Se respeta lo que eligió la persona; si no eligió, la primera versión disponible.
  const variantIndex = picked ?? Math.max(p.variants.findIndex((v) => v.inStock), 0);
  const variant = p.variants[variantIndex];

  const consult = contactUrl(contact, productMessage(contact.productMessage, { producto: p.name, color: color.name, version: variant.label }));

  return (
    <article className="product">
      <div className="product-media">
        <div className="product-photo">
          {color.images.length ? (
            <button className="product-zoom" onClick={() => setZoomed(true)} aria-label={`Ampliar foto de ${p.name}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={color.images[photo]} alt={`${p.name} color ${color.name}`} fetchPriority="high" />
            </button>
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
        </div>
        {color.images.length > 1 && (
          <div className="product-thumbs">
            {color.images.map((src, i) => (
              <button
                key={src}
                className={`product-thumb ${i === photo ? "active" : ""}`}
                aria-label={`Foto ${i + 1}`}
                aria-pressed={i === photo}
                onClick={() => setPhoto(i)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="product-info">
        <p className="card-eyebrow">{[p.brand, p.category].filter(Boolean).join(" · ")}</p>
        <h1>{p.name}</h1>

        {p.specs.length > 0 && (
          <ul className="spec-chips" aria-label="Características">
            {p.specs.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        )}

        <Price variant={inColor(variant, color)} usdRate={usdRate} detailed />

        <p className="product-label" hidden={p.colors.length === 1 && color.name === "Único"}>
          Color
        </p>
        <div className="color-row" hidden={p.colors.length === 1 && color.name === "Único"}>
          {p.colors.map((c, i) => (
            <button
              key={c.name}
              className={`color-dot ${i === colorIndex ? "active" : ""}`}
              style={{ background: c.hex }}
              title={c.name}
              aria-label={`Color ${c.name}`}
              aria-pressed={i === colorIndex}
              onClick={() => {
                setColorIndex(i);
                setPhoto(0);
              }}
            />
          ))}
          <span className="color-name">
            {color.name}
            {color.extra > 0 && <small> +{usd(color.extra)}</small>}
          </span>
        </div>

        {(p.variants.length > 1 || variant.label) && (
          <>
            <p className="product-label">Versión</p>
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
          </>
        )}
        {!variant.inStock && <p className="product-stock">Por ahora no la estamos trayendo. Consultanos por alternativas.</p>}

        {consult && (
          <a href={consult} target="_blank" rel="noopener" className="btn product-cta">
            {variant.inStock ? "Encargar por WhatsApp" : "Consultar disponibilidad"}
          </a>
        )}

        {p.description && (
          <div className="product-desc">
            <p className="product-label">Descripción</p>
            <p>{p.description}</p>
          </div>
        )}
      </div>

      {zoomed && (
        <Lightbox
          gallery={{ images: color.images, index: photo, title: p.name }}
          onChange={(g) => (g ? setPhoto(g.index) : setZoomed(false))}
        />
      )}
    </article>
  );
}
