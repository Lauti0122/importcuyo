import { Catalog } from "@/components/site/Catalog";
import { About, Banners, Footer, Header, Hero, Steps, Strip, WhatsAppFloat } from "@/components/site/Sections";
import { getDollar } from "@/lib/dollar";
import { getProducts, getSite } from "@/lib/store";

// El contenido se edita desde el panel, así que la página se arma en cada visita.
export const dynamic = "force-dynamic";

export default async function Home() {
  const [site, products, dollar] = await Promise.all([getSite(), getProducts(), getDollar()]);
  return (
    <>
      <Header site={site} />
      <Hero site={site} />
      <Strip items={site.strip} />
      <Banners site={site} />
      <Catalog
        products={products.filter((p) => p.colors.length && p.variants.length)}
        contact={site.contact}
        usdRate={site.shop.usdRate || dollar?.sell || 0}
      />
      <Steps site={site} />
      <About site={site} />
      <Footer site={site} />
      <WhatsAppFloat site={site} />
    </>
  );
}
