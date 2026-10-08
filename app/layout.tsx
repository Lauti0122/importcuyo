import type { Metadata } from "next";
import { Manrope, Montserrat } from "next/font/google";
import { getSite } from "@/lib/store";
import { themeCss } from "@/lib/theme";
import "./globals.css";

// Las tipografías del manual de marca: Montserrat para títulos, Manrope para el resto.
const display = Montserrat({ variable: "--font-display", subsets: ["latin"] });
const body = Manrope({ variable: "--font-body", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const { brand } = await getSite();
  const title = `${brand.name} · Catálogo`;
  return {
    title,
    description: brand.description,
    openGraph: { title, description: brand.description, type: "website" },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { theme } = await getSite();
  return (
    <html lang="es-AR" className={`${display.variable} ${body.variable}`}>
      <head>
        {/* Los colores salen del panel: themeCss solo emite valores hexadecimales validados. */}
        <style dangerouslySetInnerHTML={{ __html: themeCss(theme) }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
