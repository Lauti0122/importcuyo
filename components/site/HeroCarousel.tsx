"use client";

import { useEffect, useRef, useState } from "react";
import { slideStyle } from "@/lib/format";
import type { HeroSlide } from "@/lib/types";

const INTERVAL_MS = 3000;
const SWIPE_PX = 40;

/**
 * Portada que rota: detrás de la marca, los textos y los botones (children) el fondo va pasando
 * de la portada a cada foto, con fundido.
 */
export function HeroCarousel({ slides, children }: { slides: HeroSlide[]; children: React.ReactNode }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const total = slides.length + 1;

  useEffect(() => {
    if (total < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Depende de `index` para que el reloj arranque de cero al cambiar de foto a mano.
    const timer = setInterval(() => {
      if (!document.hidden) setIndex((i) => (i + 1) % total);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [index, paused, total]);

  if (total < 2) return <>{children}</>;

  const go = (step: number) => setIndex((i) => (i + step + total) % total);

  return (
    <div
      className={`hero-carousel ${index > 0 ? "on-photo" : ""}`}
      role="group"
      aria-roledescription="carrusel"
      aria-label="Portada"
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > SWIPE_PX) go(dx < 0 ? 1 : -1);
      }}
    >
      {slides.map((slide, i) => (
        <div key={slide.image} className={`hero-slide ${index === i + 1 ? "is-active" : ""}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={slide.image} alt="" style={slideStyle(slide)} loading="lazy" />
        </div>
      ))}
      {children}
      <div className="hero-dots">
        {Array.from({ length: total }, (_, i) => (
          <button
            key={i}
            type="button"
            className={i === index ? "active" : ""}
            aria-current={i === index}
            aria-label={i === 0 ? "Ver portada" : `Ver foto ${i} de ${slides.length}`}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </div>
  );
}
