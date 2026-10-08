"use client";

import { ImagePlus, Loader2, X } from "lucide-react";
import { useId, useState } from "react";

const KEEP_BYTES = 1.5 * 1024 * 1024;

/** Achica la foto en el navegador antes de subirla: las del celular pesan varios MB. */
async function shrink(file: File, maxSide: number): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    // Si ya entra y es liviana se sube tal cual: volver a comprimirla solo le saca calidad.
    if (scale === 1 && file.type === "image/jpeg" && file.size <= KEEP_BYTES) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d")!;
    // Los renders de producto suelen venir con fondo transparente: esos se guardan como WebP para no pintarles un fondo.
    const keepAlpha = file.type === "image/png" || file.type === "image/webp";
    if (keepAlpha && scale === 1 && file.size <= KEEP_BYTES) return file;
    if (!keepAlpha) {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, keepAlpha ? "image/webp" : "image/jpeg", 0.86));
    return blob ?? file;
  } catch {
    return file;
  }
}

export async function uploadImage(file: File, maxSide = 1600): Promise<string> {
  const body = new FormData();
  body.append("file", await shrink(file, maxSide), "foto");
  const res = await fetch("/api/upload", { method: "POST", body });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "No se pudo subir la imagen");
  return json.url;
}

export function Field({
  label,
  hint,
  error,
  children,
  wide,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={`field ${wide ? "is-wide" : ""} ${error ? "has-error" : ""}`}>
      <span className="field-label">{label}</span>
      {children}
      {error && <span className="field-error">{error}</span>}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export function Text({
  value,
  onChange,
  multiline,
  ...rest
}: {
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
  list?: string;
  inputMode?: "numeric" | "tel" | "email";
  maxLength?: number;
}) {
  return multiline ? (
    <textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} placeholder={rest.placeholder} maxLength={rest.maxLength} />
  ) : (
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)} {...rest} />
  );
}

/** Botón que abre el selector de archivos y sube lo elegido. */
export function UploadButton({
  onUploaded,
  multiple,
  maxSide,
  label,
  className = "upload-tile",
}: {
  onUploaded: (urls: string[]) => void;
  multiple?: boolean;
  maxSide?: number;
  label: string;
  className?: string;
}) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = [...(e.target.files ?? [])];
    e.target.value = "";
    if (!files.length) return;
    setBusy(true);
    setError("");
    try {
      const urls: string[] = [];
      for (const file of files) urls.push(await uploadImage(file, maxSide));
      onUploaded(urls);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir la imagen");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <label className={className} htmlFor={id} aria-busy={busy}>
        {busy ? <Loader2 className="spin" aria-hidden /> : <ImagePlus aria-hidden />}
        <span>{busy ? "Subiendo…" : label}</span>
        <input id={id} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple={multiple} onChange={onPick} hidden />
      </label>
      {error && <p className="form-error">{error}</p>}
    </>
  );
}

/** Una sola imagen (portada, banner): vista previa con cambiar y quitar. */
export function ImageInput({
  value,
  onChange,
  maxSide = 2000,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  maxSide?: number;
}) {
  return (
    <div className="image-input">
      {value ? (
        <div className="image-preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" />
          <button type="button" className="icon-btn" onClick={() => onChange(null)} aria-label="Quitar imagen">
            <X />
          </button>
        </div>
      ) : null}
      <UploadButton label={value ? "Cambiar imagen" : "Subir imagen"} maxSide={maxSide} onUploaded={([url]) => onChange(url)} />
    </div>
  );
}

/** "#abc", "abc" o "0f2f24" -> "#AABBCC"; null si no es un color hexadecimal. */
function parseHex(text: string) {
  const raw = text.trim().replace(/^#/, "");
  if (!/^([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(raw)) return null;
  const full = raw.length === 3 ? [...raw].map((c) => c + c).join("") : raw;
  return `#${full.toUpperCase()}`;
}

/** Color con selector visual y campo para escribir o pegar el código hexadecimal. */
export function ColorInput({ value, onChange, label }: { value: string; onChange: (hex: string) => void; label: string }) {
  // Mientras se escribe se guarda el texto tal cual; el color cambia recién cuando el código es válido.
  const [draft, setDraft] = useState<string | null>(null);
  const invalid = draft !== null && parseHex(draft) === null;
  return (
    <span className="color-input">
      <input type="color" value={value} onChange={(e) => (setDraft(null), onChange(e.target.value.toUpperCase()))} aria-label={`${label}: elegir color`} />
      <input
        type="text"
        className={invalid ? "is-invalid" : ""}
        value={draft ?? value.toUpperCase()}
        onChange={(e) => {
          setDraft(e.target.value);
          const hex = parseHex(e.target.value);
          if (hex) onChange(hex);
        }}
        onFocus={(e) => e.target.select()}
        onBlur={() => setDraft(null)}
        maxLength={7}
        spellCheck={false}
        autoCapitalize="characters"
        aria-label={`${label}: código hexadecimal`}
        aria-invalid={invalid}
        placeholder="#16233D"
      />
    </span>
  );
}
