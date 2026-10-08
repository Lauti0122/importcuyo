import type { Metadata } from "next";
import { Catalog } from "@/components/site/Catalog";
import { Footer, Header, WhatsAppFloat } from "@/components/site/Sections";
import { getDollar } from "@/lib/dollar";
import { getProducts, getSite } from "@/lib/store";

// El contenido se edita desde el panel, así que la página se arma en cada visita.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { brand } = await getSite();
  return { title: `Catálogo · ${brand.name}`, description: brand.description };
}

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

export default async function CatalogPage({ searchParams }: PageProps<"/catalogo">) {
  const [site, products, dollar, params] = await Promise.all([getSite(), getProducts(), getDollar(), searchParams]);
  return (
    <>
      <Header site={site} />
      <Catalog
        products={products.filter((p) => p.colors.length && p.variants.length)}
        contact={site.contact}
        usdRate={site.shop.usdRate || dollar?.sell || 0}
        initial={{ category: one(params.categoria), brand: one(params.marca), query: one(params.buscar), sort: one(params.orden) }}
      />
      <Footer site={site} />
      <WhatsAppFloat site={site} />
    </>
  );
}
