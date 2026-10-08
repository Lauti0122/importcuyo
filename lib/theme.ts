import type { Theme } from "./types";

export const HEX = /^#[0-9a-fA-F]{6}$/;

function luminance(hex: string) {
  const ch = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

export function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** El primer color de la lista que se lee bien sobre `bg`; si ninguno alcanza, el de mayor contraste. */
function readableOn(bg: string, preferred: string[]) {
  const ok = preferred.find((c) => contrast(bg, c) >= 3.5);
  if (ok) return ok;
  return [...preferred, "#FFFFFF", "#111111"].reduce((best, c) =>
    contrast(bg, c) > contrast(bg, best) ? c : best,
  );
}

// Los colores "on-*" se calculan para que el texto siga siendo legible con cualquier paleta.
export function themeVars(t: Theme): Record<string, string> {
  return {
    "--bg": t.bg,
    "--paper": t.paper,
    "--primary": t.primary,
    "--ink": t.ink,
    "--accent": t.accent,
    "--soft": t.soft,
    "--silver": t.silver,
    "--text": readableOn(t.bg, [t.primary, t.ink]),
    "--on-primary": readableOn(t.primary, [t.paper, t.ink]),
    "--on-ink": readableOn(t.ink, [t.paper, t.primary]),
    "--on-accent": readableOn(t.accent, [t.paper, t.ink]),
    "--on-soft": readableOn(t.soft, [t.primary, t.paper]),
  };
}

export function themeCss(t: Theme) {
  return `:root{${Object.entries(themeVars(t))
    .map(([k, v]) => `${k}:${v}`)
    .join(";")}}`;
}

/** Qué versión del logo se lee sobre un fondo: la de color en fondos claros, la plateada en oscuros. */
export const logoTone = (bg: string) => (luminance(bg) < 0.4 ? "oscuro" : "color");
