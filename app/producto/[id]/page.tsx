import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductView } from "@/components/site/ProductView";
import { Footer, Header, WhatsAppFloat } from "@/components/site/Sections";
import { getDollar } from "@/lib/dollar";
import { getProduct, getSite } from "@/lib/store";

// El contenido se edita desde el panel, así que la página se arma en cada visita.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/producto/[id]">): Promise<Metadata> {
  const { id } = await params;
  const [{ brand }, product] = await Promise.all([getSite(), getProduct(id)]);
  if (!product) return {};
  const title = `${product.name} · ${brand.name}`;
  const description = product.description || brand.description;
  const image = product.colors.flatMap((c) => c.images)[0];
  return { title, description, openGraph: { title, description, type: "website", ...(image ? { images: [image] } : {}) } };
}

export default async function ProductPage({ params }: PageProps<"/producto/[id]">) {
  const { id } = await params;
  const [site, product, dollar] = await Promise.all([getSite(), getProduct(id), getDollar()]);
  if (!product || !product.colors.length || !product.variants.length) notFound();
  return (
    <>
      <Header site={site} />
      <main className="product-section">
        <div className="wrap">
          <Link href="/catalogo" className="back-link">
            <ChevronLeft aria-hidden />
            Volver al catálogo
          </Link>
          <ProductView product={product} contact={site.contact} usdRate={site.shop.usdRate || dollar?.sell || 0} />
        </div>
      </main>
      <Footer site={site} />
      <WhatsAppFloat site={site} />
    </>
  );
}
