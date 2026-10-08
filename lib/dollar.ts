import "server-only";

/** `updated` ya viene escrito ("8 de octubre, 12:55"): se arma en el servidor para que no cambie según el navegador. */
export type DollarQuote = { name: string; sell: number; updated: string };

function quoteTime(iso: unknown) {
  const date = new Date(String(iso ?? ""));
  if (Number.isNaN(date.getTime())) return "";
  const zone = { timeZone: "America/Argentina/Buenos_Aires" } as const;
  const day = date.toLocaleDateString("es-AR", { ...zone, day: "numeric", month: "long" });
  const time = date.toLocaleTimeString("es-AR", { ...zone, hour: "2-digit", minute: "2-digit", hour12: false });
  return `${day}, ${time}`;
}

// Cotización de referencia que se muestra en el encabezado: dólar oficial, punta vendedora.
const SOURCE = "https://dolarapi.com/v1/dolares/oficial";

/** La cotización del día según dolarapi.com; `null` si el servicio no responde, y la página se muestra sin ella. */
export async function getDollar(): Promise<DollarQuote | null> {
  try {
    // Se consulta como mucho cada 10 minutos, no en cada visita.
    const res = await fetch(SOURCE, { next: { revalidate: 600 }, signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const data = await res.json();
    const sell = Number(data.venta);
    if (!Number.isFinite(sell) || sell <= 0) return null;
    return { name: String(data.nombre ?? "Oficial"), sell, updated: quoteTime(data.fechaActualizacion) };
  } catch {
    return null;
  }
}
