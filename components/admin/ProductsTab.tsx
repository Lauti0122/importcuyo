"use client";

import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowLeft, ArrowUpToLine, Copy, Eye, EyeOff, GripVertical, Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useId, useState, useTransition } from "react";
import { deleteProductAction, reorderProductsAction, saveColorPresetsAction, saveProductAction } from "@/app/admin/actions";
import { MAX_COLOR_PRESETS } from "@/lib/defaults";
import { ars, fromPrice, onSale, toArs, usd } from "@/lib/format";
import type { ColorPreset, Product, ProductColor, ProductVariant } from "@/lib/types";
import { ColorInput, Field, Text, UploadButton } from "./ui";

const newColor = (): ProductColor => ({ name: "", hex: "#1F2022", images: [], extra: 0 });
const newVariant = (): ProductVariant => ({ label: "", price: 0, priceSale: null, priceCard: null, priceCard12: null, inStock: true });

const newProduct = (): Product => ({
  id: crypto.randomUUID(),
  name: "",
  brand: "",
  category: "",
  description: "",
  specs: [],
  badge: "",
  isNew: true,
  visible: true,
  colors: [{ ...newColor(), name: "Black" }],
  variants: [newVariant()],
});

// Los mismos topes que aplica el guardado: lo que se pase de acá se recortaría sin avisar.
const MAX_COLORS = 12;
const MAX_VARIANTS = 12;

/** Lo que tiene que estar completo para guardar, por campo. Incluye lo que el guardado descartaría en silencio. */
function validate(p: Product) {
  const errors: Record<string, string> = {};
  if (!p.name.trim()) errors.name = "Poné el nombre del producto.";
  if (!p.category.trim()) errors.category = "Elegí una categoría.";
  if (!p.variants.length) errors.variants = "Agregá al menos un precio.";
  const labels = p.variants.map((v) => v.label.trim().toLowerCase());
  p.variants.forEach((v, i) => {
    if (p.variants.length > 1 && !labels[i]) errors[`variant-${i}`] = "Con más de una versión, cada una necesita un nombre.";
    else if (labels.indexOf(labels[i]) !== i) errors[`variant-${i}`] = "Ya hay otra versión con este nombre.";
    else if (!v.price) errors[`variant-${i}`] = "Poné el precio en efectivo, en dólares.";
    else if (v.priceCard && v.priceCard < v.price) errors[`variant-${i}`] = "El precio en 3 cuotas no puede ser menor que el de efectivo.";
    else if (v.priceCard12 && v.priceCard12 < (v.priceCard ?? v.price)) errors[`variant-${i}`] = "El precio en 12 cuotas no puede ser menor que el de 3 cuotas o el de efectivo.";
    else if (v.priceSale && v.priceSale >= v.price) errors[`variant-${i}`] = "El precio de oferta tiene que ser menor que el normal.";
  });
  if (!p.colors.length) errors.colors = "Agregá al menos un color.";
  const names = p.colors.map((c) => c.name.trim().toLowerCase());
  p.colors.forEach((c, i) => {
    if (!names[i]) errors[`color-${i}`] = "Poné el nombre del color.";
    else if (names.indexOf(names[i]) !== i) errors[`color-${i}`] = "Ya hay otro color con este nombre.";
  });
  return errors;
}

const cover = (p: Product) => p.colors.find((c) => c.images.length)?.images[0];

export function ProductsTab({
  products,
  onChange,
  categories,
  usdRate,
  colorPresets,
  onColorPresets,
}: {
  products: Product[];
  categories: string[];
  onChange: (products: Product[]) => void;
  usdRate: number;
  colorPresets: ColorPreset[];
  onColorPresets: (colors: ColorPreset[]) => void;
}) {
  const [editing, setEditing] = useState<Product | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const run = (task: () => Promise<Product[]>) =>
    startTransition(async () => {
      try {
        setError("");
        onChange(await task());
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo guardar");
      }
    });

  const sensors = useSensors(
    // Hace falta mover unos píxeles para empezar a arrastrar: así un toque no dispara el arrastre.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  /** Mueve un producto y guarda el orden. La lista cambia al instante y se revierte si el guardado falla. */
  const reorder = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0) return;
    const previous = products;
    const next = arrayMove(products, from, to);
    onChange(next);
    startTransition(async () => {
      try {
        setError("");
        onChange(await reorderProductsAction(next.map((p) => p.id)));
      } catch (err) {
        onChange(previous);
        setError(err instanceof Error ? err.message : "No se pudo guardar el orden");
      }
    });
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return;
    reorder(
      products.findIndex((p) => p.id === active.id),
      products.findIndex((p) => p.id === over.id),
    );
  };

  if (editing) {
    return (
      <ProductEditor
        initial={editing}
        categories={categories}
        brands={[...new Set(products.map((x) => x.brand).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es"))}
        usdRate={usdRate}
        colorPresets={colorPresets}
        onColorPresets={onColorPresets}
        onCancel={() => setEditing(null)}
        onSaved={(list) => {
          onChange(list);
          setEditing(null);
        }}
      />
    );
  }

  const onlySamples = products.length > 0 && products.every((p) => p.id.startsWith("m-"));

  return (
    <section>
      <div className="tab-head">
        <div>
          <h2>Productos</h2>
          <p>Arrastrá un producto desde los puntitos para cambiar su lugar: el orden de esta lista es el del catálogo.</p>
        </div>
        <button className="a-btn is-primary" onClick={() => setEditing(newProduct())}>
          <Plus aria-hidden /> Agregar producto
        </button>
      </div>

      {onlySamples && (
        <p className="notice">
          Estos son productos de muestra para que veas el catálogo armado. Editalos con tus productos o eliminalos y cargá los tuyos.
        </p>
      )}
      {error && <p className="form-error">{error}</p>}

      {products.length === 0 ? (
        <div className="empty">
          <p>Todavía no hay productos. Agregá el primero para que aparezca en el catálogo.</p>
        </div>
      ) : (
        <DndContext id="productos" sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={products.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            <ul className="product-list" aria-busy={pending}>
              {products.map((p, i) => (
                <ProductRow key={p.id} product={p}>
                  {confirmDelete === p.id ? (
                    <div className="row-actions">
                      <span>¿Eliminar?</span>
                      <button className="a-btn is-danger" onClick={() => (setConfirmDelete(null), run(() => deleteProductAction(p.id)))}>
                        Eliminar
                      </button>
                      <button className="a-btn" onClick={() => setConfirmDelete(null)}>
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div className="row-actions">
                      <button className="icon-btn" disabled={i === 0} onClick={() => reorder(i, 0)} aria-label={`Mover ${p.name} al principio`} title="Mover al principio">
                        <ArrowUpToLine />
                      </button>
                      <button
                        className="icon-btn"
                        onClick={() => run(() => saveProductAction({ ...p, visible: !p.visible }))}
                        aria-label={p.visible ? `Ocultar ${p.name}` : `Mostrar ${p.name}`}
                        title={p.visible ? "Ocultar del catálogo" : "Mostrar en el catálogo"}
                      >
                        {p.visible ? <Eye /> : <EyeOff />}
                      </button>
                      <button
                        className="icon-btn"
                        onClick={() => setEditing({ ...structuredClone(p), id: crypto.randomUUID(), name: `${p.name} (copia)` })}
                        aria-label={`Duplicar ${p.name}`}
                        title="Duplicar"
                      >
                        <Copy />
                      </button>
                      <button className="icon-btn" onClick={() => setConfirmDelete(p.id)} aria-label={`Eliminar ${p.name}`} title="Eliminar">
                        <Trash2 />
                      </button>
                      <button className="a-btn" onClick={() => setEditing(structuredClone(p))}>
                        <Pencil aria-hidden /> Editar
                      </button>
                    </div>
                  )}
                </ProductRow>
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </section>
  );
}

/** Una fila de la lista que se puede arrastrar desde el agarre de la izquierda. */
function ProductRow({ product: p, children }: { product: Product; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: p.id });
  return (
    <li
      ref={setNodeRef}
      className={`${p.visible ? "" : "is-hidden"} ${isDragging ? "is-dragging" : ""}`}
      style={{ transform: CSS.Translate.toString(transform), transition }}
    >
      <button ref={setActivatorNodeRef} className="drag-handle" aria-label={`Mover ${p.name}`} title="Arrastrá para cambiar el orden" {...attributes} {...listeners}>
        <GripVertical />
      </button>
      <div className="product-thumb" style={{ background: p.colors[0]?.hex }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {cover(p) && <img src={cover(p)} alt="" />}
      </div>
      <div className="product-main">
        <strong>{p.name}</strong>
        <span>
          {[p.brand, p.category].filter(Boolean).join(" · ")} · {p.colors.length} {p.colors.length === 1 ? "color" : "colores"}
          {p.variants.length > 1 && ` · ${p.variants.length} versiones`}
          {p.variants.length > 0 && p.variants.every((v) => !v.inStock) && " · No disponible"}
          {p.isNew && " · Nuevo"}
          {!p.visible && " · Oculto"}
        </span>
      </div>
      {p.variants.length > 0 && (
        <div className="product-price">
          <strong>{usd(fromPrice(p))}</strong>
          <span>{onSale(p) ? "Oferta" : p.variants.length > 1 ? "desde" : "dólares"}</span>
        </div>
      )}
      {children}
    </li>
  );
}

function ProductEditor({
  initial,
  categories,
  brands,
  usdRate,
  colorPresets,
  onColorPresets,
  onCancel,
  onSaved,
}: {
  initial: Product;
  categories: string[];
  brands: string[];
  usdRate: number;
  colorPresets: ColorPreset[];
  onColorPresets: (colors: ColorPreset[]) => void;
  onCancel: () => void;
  onSaved: (products: Product[]) => void;
}) {
  const [p, setP] = useState(initial);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [pending, startTransition] = useTransition();
  const brandList = useId();
  // Los errores aparecen recién al intentar guardar y después se van corrigiendo mientras se escribe.
  const errors = attempts ? validate(p) : {};
  const invalid = Object.keys(errors).length;

  // En el celular el campo que falta suele quedar fuera de la pantalla: se lo trae a la vista.
  useEffect(() => {
    if (attempts) document.querySelector(".editor .has-error")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [attempts]);

  // Con llaves: scrollTo puede devolver una promesa y un efecto solo puede devolver su limpieza.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const set = (patch: Partial<Product>) => setP((prev) => ({ ...prev, ...patch }));
  const setColor = (index: number, patch: Partial<ProductColor>) =>
    setP((prev) => ({ ...prev, colors: prev.colors.map((c, i) => (i === index ? { ...c, ...patch } : c)) }));
  const setVariant = (index: number, patch: Partial<ProductVariant>) =>
    setP((prev) => ({ ...prev, variants: prev.variants.map((v, i) => (i === index ? { ...v, ...patch } : v)) }));
  const price = (v: string) => Number(v.replace(/\D/g, "")) || 0;

  const samePreset = (preset: ColorPreset, color: ProductColor) =>
    preset.name.toLowerCase() === color.name.trim().toLowerCase() && preset.hex.toUpperCase() === color.hex.toUpperCase();

  /** Suma el color a los guardados; si ya había uno con ese nombre, le actualiza el tono. */
  function savePreset(color: ProductColor) {
    const preset = { name: color.name.trim(), hex: color.hex.toUpperCase() };
    const exists = colorPresets.some((c) => c.name.toLowerCase() === preset.name.toLowerCase());
    const next = exists
      ? colorPresets.map((c) => (c.name.toLowerCase() === preset.name.toLowerCase() ? preset : c))
      : [...colorPresets, preset];
    setError("");
    startTransition(async () => {
      try {
        onColorPresets(await saveColorPresetsAction(next));
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo guardar el color");
      }
    });
  }

  function save() {
    setError("");
    setAttempts((n) => n + 1);
    if (Object.keys(validate(p)).length) return;
    startTransition(async () => {
      try {
        onSaved(await saveProductAction(p));
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo guardar el producto");
      }
    });
  }

  return (
    <section className="editor">
      <button className="back-link" onClick={onCancel}>
        <ArrowLeft aria-hidden /> Volver a productos
      </button>
      <h2>{initial.name ? `Editar ${initial.name}` : "Nuevo producto"}</h2>

      <div className="panel">
        <div className="form-grid">
          <Field label="Nombre" wide error={errors.name}>
            <Text value={p.name} onChange={(name) => set({ name })} placeholder="iPhone 17 Pro Max" maxLength={80} />
          </Field>
          <Field label="Marca" hint="Sirve para filtrar el catálogo por marca.">
            <Text value={p.brand} onChange={(brand) => set({ brand })} placeholder="Apple" maxLength={40} list={brandList} />
            <datalist id={brandList}>
              {brands.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </Field>
          <Field
            label="Categoría"
            hint={categories.length ? "Las categorías se crean en la pestaña Categorías." : "Todavía no hay categorías: creá la primera en la pestaña Categorías."}
            error={errors.category}
          >
            <select className={p.category ? "" : "is-empty"} value={p.category} onChange={(e) => set({ category: e.target.value })}>
              <option value="">Elegí una categoría</option>
              {/* Si el producto tiene una categoría que ya no está en la lista, se conserva hasta que se elija otra. */}
              {(p.category && !categories.includes(p.category) ? [p.category, ...categories] : categories).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Características (opcional)" hint="Una por renglón. Las tres primeras se ven en la tarjeta del catálogo.">
            <Text value={p.specs.join("\n")} onChange={(v) => set({ specs: v.split("\n") })} multiline placeholder={'6,9"\nCámara 48 MP\nChip A19 Pro'} />
          </Field>
          <Field label="Descripción (opcional)">
            <Text value={p.description} onChange={(description) => set({ description })} multiline placeholder="Sellado en caja, con garantía oficial de un año." maxLength={1200} />
          </Field>
          <Field label="Etiqueta (opcional)" hint="Se ve sobre la foto. Por ejemplo: Open Box, Digital, A pedido.">
            <Text value={p.badge} onChange={(badge) => set({ badge })} placeholder="Open Box" maxLength={24} />
          </Field>
        </div>
        <div className="checks">
          <label>
            <input type="checkbox" checked={p.isNew} onChange={(e) => set({ isNew: e.target.checked })} /> Marcar como nuevo
          </label>
          <label>
            <input type="checkbox" checked={p.visible} onChange={(e) => set({ visible: e.target.checked })} /> Visible en el catálogo
          </label>
        </div>
      </div>

      <div className="panel">
        <h3>Precios</h3>
        <p className="field-hint">
          Todos en dólares. Efectivo es el precio principal. Los dos de tarjeta son opcionales: 3 cuotas sin interés (miércoles y sábados) y 12 cuotas
          fijas; si los dejás vacíos, el producto muestra solo el precio en efectivo. Si viene en varias versiones (256 GB, 512 GB), cargá una fila por
          cada una; si es una sola, el nombre puede quedar vacío. El equivalente en pesos lo calcula el sitio{" "}
          {usdRate > 0 ? `a $ ${usdRate.toLocaleString("es-AR")} por dólar, la cotización cargada en Datos y contacto.` : "con el dólar oficial del día."}
        </p>
        {errors.variants && <p className="field-error has-error">{errors.variants}</p>}
        <div className="variant-list">
          {p.variants.map((v, vi) => (
            <div className={`variant-row ${errors[`variant-${vi}`] ? "has-error" : ""}`} key={vi}>
              <label className="field">
                <span className="field-label">Versión</span>
                <input type="text" value={v.label} maxLength={40} placeholder="256 GB" onChange={(e) => setVariant(vi, { label: e.target.value })} />
              </label>
              <label className="field">
                <span className="field-label">Efectivo US$</span>
                <input type="text" inputMode="numeric" value={v.price ? String(v.price) : ""} placeholder="1020" onChange={(e) => setVariant(vi, { price: price(e.target.value) })} />
              </label>
              <label className="field">
                <span className="field-label">Oferta US$ (opcional)</span>
                <input type="text" inputMode="numeric" value={v.priceSale ? String(v.priceSale) : ""} onChange={(e) => setVariant(vi, { priceSale: price(e.target.value) || null })} />
              </label>
              <label className="field">
                <span className="field-label">Tarjeta 3 cuotas US$</span>
                <input type="text" inputMode="numeric" value={v.priceCard ? String(v.priceCard) : ""} onChange={(e) => setVariant(vi, { priceCard: price(e.target.value) || null })} />
              </label>
              <label className="field">
                <span className="field-label">Tarjeta 12 cuotas US$</span>
                <input type="text" inputMode="numeric" value={v.priceCard12 ? String(v.priceCard12) : ""} onChange={(e) => setVariant(vi, { priceCard12: price(e.target.value) || null })} />
              </label>
              <label className="switch">
                <input type="checkbox" checked={v.inStock} onChange={(e) => setVariant(vi, { inStock: e.target.checked })} /> Disponible
              </label>
              <button
                className="icon-btn"
                disabled={p.variants.length === 1}
                onClick={() => set({ variants: p.variants.filter((_, i) => i !== vi) })}
                aria-label={`Quitar la versión ${v.label || vi + 1}`}
              >
                <X />
              </button>
              {errors[`variant-${vi}`] ? (
                <span className="field-error">{errors[`variant-${vi}`]}</span>
              ) : (
                usdRate > 0 && v.price > 0 && <span className="field-hint">{ars(toArs(v.priceSale ?? v.price, usdRate))} en pesos</span>
              )}
            </div>
          ))}
        </div>
        {p.variants.length < MAX_VARIANTS && (
          <button className="a-btn" onClick={() => set({ variants: [...p.variants, newVariant()] })}>
            <Plus aria-hidden /> Agregar versión
          </button>
        )}
      </div>

      {p.colors.map((color, ci) => (
        <div className="panel" key={ci}>
          <div className="panel-head">
            <h3>Color {ci + 1}</h3>
            {p.colors.length > 1 && (
              <button className="link-btn is-danger" onClick={() => set({ colors: p.colors.filter((_, i) => i !== ci) })}>
                Quitar color
              </button>
            )}
          </div>
          <div className="form-grid">
            <Field label="Nombre del color" error={errors[`color-${ci}`]}>
              <Text value={color.name} onChange={(name) => setColor(ci, { name })} placeholder="Black" maxLength={30} />
            </Field>
            <div className="field">
              <span className="field-label">Tono</span>
              <ColorInput label="Tono" value={color.hex} onChange={(hex) => setColor(ci, { hex })} />
              <span className="field-hint">Es el circulito que se ve en la tarjeta del producto. Podés elegirlo o escribir el código.</span>
            </div>
            <Field
              label="Recargo de este color US$ (opcional)"
              hint="Si este color sale más caro, poné cuántos dólares más. Se suma a todos los precios del producto: efectivo, oferta y tarjeta."
            >
              <Text value={color.extra ? String(color.extra) : ""} onChange={(v) => setColor(ci, { extra: price(v) })} inputMode="numeric" placeholder="0" />
            </Field>
            {color.extra > 0 && p.variants[0]?.price > 0 && (
              <p className="field-hint">
                En {color.name.trim() || "este color"}, {p.variants[0].label || "el producto"} queda en {usd(p.variants[0].price + color.extra)} en efectivo.
              </p>
            )}
          </div>
          <div className="swatches" role="group" aria-label="Colores guardados">
            {colorPresets.map((preset, i) => {
              const active = samePreset(preset, color);
              return (
                <button key={i} type="button" className={active ? "active" : ""} aria-pressed={active} onClick={() => setColor(ci, { name: preset.name, hex: preset.hex })}>
                  <i style={{ background: preset.hex }} />
                  {preset.name}
                </button>
              );
            })}
            {color.name.trim() && !colorPresets.some((preset) => samePreset(preset, color)) && colorPresets.length < MAX_COLOR_PRESETS && (
              <button type="button" className="is-add" disabled={pending} onClick={() => savePreset(color)}>
                <Plus aria-hidden /> Guardar “{color.name.trim()}” para usarlo después
              </button>
            )}
          </div>

          <span className="field-label">Fotos</span>
          <p className="field-hint">La primera es la que se ve en el catálogo. Quedan mejor cuadradas, con fondo blanco o transparente.</p>
          <div className="photo-grid">
            {color.images.map((src, ii) => (
              <div className="photo" key={src}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" />
                <button className="icon-btn" onClick={() => setColor(ci, { images: color.images.filter((x) => x !== src) })} aria-label="Quitar foto">
                  <X />
                </button>
                {ii > 0 ? (
                  <button className="photo-first" onClick={() => setColor(ci, { images: [src, ...color.images.filter((x) => x !== src)] })}>
                    Usar de portada
                  </button>
                ) : (
                  <span className="photo-first is-current">Portada</span>
                )}
              </div>
            ))}
            <UploadButton label="Subir fotos" multiple onUploaded={(urls) => setColor(ci, { images: [...color.images, ...urls] })} />
          </div>

        </div>
      ))}

      {errors.colors && <p className="field-error has-error">{errors.colors}</p>}
      {p.colors.length < MAX_COLORS && (
        <button className="a-btn" onClick={() => set({ colors: [...p.colors, newColor()] })}>
          <Plus aria-hidden /> Agregar otro color
        </button>
      )}

      <div className="save-bar">
        {invalid > 0 ? (
          <p className="form-error">{invalid === 1 ? "Falta corregir 1 campo marcado en rojo." : `Falta corregir ${invalid} campos marcados en rojo.`}</p>
        ) : (
          error && <p className="form-error">{error}</p>
        )}
        <button className="a-btn" onClick={onCancel}>
          Cancelar
        </button>
        <button className="a-btn is-primary" onClick={save} disabled={pending}>
          {pending ? "Guardando…" : "Guardar producto"}
        </button>
      </div>
    </section>
  );
}
