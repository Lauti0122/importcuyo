"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

export type Gallery = { images: string[]; index: number; title: string };

export function Lightbox({ gallery, onChange }: { gallery: Gallery; onChange: (g: Gallery | null) => void }) {
  const { images, index, title } = gallery;
  const closeButton = useRef<HTMLButtonElement>(null);

  const step = useCallback(
    (delta: number) => onChange({ ...gallery, index: (index + delta + images.length) % images.length }),
    [gallery, index, images.length, onChange],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onChange(null);
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onChange, step]);

  // Se bajan por adelantado las fotos vecinas, así al pasar ya están listas.
  useEffect(() => {
    const near = [1, -1, 2].map((d) => images[(index + d + images.length) % images.length]);
    for (const src of new Set(near)) {
      if (src === images[index]) continue;
      const img = new Image();
      img.src = src;
      img.decode().catch(() => {});
    }
  }, [images, index]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={`Fotos de ${title}`} onClick={() => onChange(null)}>
      <button className="lb-close" ref={closeButton} onClick={() => onChange(null)} aria-label="Cerrar">
        <X />
      </button>
      {images.length > 1 && (
        <button className="lb-nav lb-prev" onClick={(e) => (e.stopPropagation(), step(-1))} aria-label="Foto anterior">
          <ChevronLeft />
        </button>
      )}
      <div className="lb-stage" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[index]} alt={`${title}, foto ${index + 1}`} />
        <div className="lb-caption">
          {title} · {index + 1} / {images.length}
        </div>
      </div>
      {images.length > 1 && (
        <button className="lb-nav lb-next" onClick={(e) => (e.stopPropagation(), step(1))} aria-label="Foto siguiente">
          <ChevronRight />
        </button>
      )}
    </div>
  );
}
