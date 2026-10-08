import { Clock, Mail, MapPin } from "lucide-react";
import Link from "next/link";
import { getDollar } from "@/lib/dollar";
import { ars, contactUrl, generalMessage, instagramUrl, prettyPhone } from "@/lib/format";
import { logoTone } from "@/lib/theme";
import type { Site } from "@/lib/types";
import { HeroCarousel } from "./HeroCarousel";
import { BannerIcon, InstagramIcon, StepIcon, WhatsAppIcon } from "./icons";
import { Logo } from "./Logo";

const external = { target: "_blank", rel: "noopener" } as const;

const CARDS = [
  { name: "Visa", src: "/pagos/visa.svg" },
  { name: "Mastercard", src: "/pagos/mastercard.svg" },
  { name: "Naranja X", src: "/pagos/naranjax.svg" },
  { name: "American Express", src: "/pagos/amex.svg" },
];

export async function Header({ site }: { site: Site }) {
  const { brand, contact } = site;
  const dollar = await getDollar();
  const hasWhatsApp = Boolean(contact.whatsapp);
  return (
    <header className="site-header">
      <div className="wrap">
        <Link href="/#top" className="brand">
          <Logo name={brand.name} tone={logoTone(site.theme.bg)} />
        </Link>
        {dollar && (
          <p className="dollar-quote" title={dollar.updated ? `Actualizado el ${dollar.updated}` : undefined}>
            Dólar {dollar.name.toLowerCase()} <strong>{ars(dollar.sell)}</strong>
          </p>
        )}
        <nav className="nav-links">
          <Link href="/#catalogo">Catálogo</Link>
          <Link href="/#como-comprar">Cómo comprar</Link>
          <Link href="/#quienes-somos">Quiénes somos</Link>
          <Link href="/#contacto">Contacto</Link>
          {contact.instagram && (
            <a className="nav-ig" href={instagramUrl(contact.instagram)} {...external} aria-label={`Instagram de ${brand.name}`}>
              <InstagramIcon />
            </a>
          )}
          {hasWhatsApp && (
            <a
              className="nav-wa"
              href={contactUrl(contact, generalMessage(site)) ?? undefined}
              {...external}
              aria-label="Escribir por WhatsApp"
            >
              <WhatsAppIcon />
            </a>
          )}
        </nav>
      </div>
    </header>
  );
}

export function Hero({ site }: { site: Site }) {
  const { brand, hero, contact } = site;
  // Sin fotos cargadas en el panel, la portada se arma en dos columnas con la composición de productos.
  const split = !hero.image && hero.slides.length === 0;
  return (
    <section className={`hero ${hero.image ? "has-image" : ""} ${split ? "is-split" : ""}`} id="top">
      {hero.image && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="hero-image" src={hero.image} alt="" fetchPriority="high" />
          <div className="hero-overlay" style={{ opacity: hero.overlay / 100 }} />
        </>
      )}
      <HeroCarousel slides={hero.slides}>
        <div className="hero-inner">
          {!split && <Logo name={brand.name} layout="vertical" tone={hero.image ? "oscuro" : logoTone(site.theme.primary)} />}
          {hero.eyebrow && <p className="hero-eyebrow">{hero.eyebrow}</p>}
          <h1>{hero.tagline || brand.name}</h1>
          {hero.text && <p className="hero-desc">{hero.text}</p>}
          <div className="hero-cta">
            <a href="#catalogo" className="btn btn-primary">
              Ver catálogo
            </a>
            {contact.whatsapp && (
              <a href={contactUrl(contact, generalMessage(site)) ?? undefined} {...external} className="btn btn-outline">
                <WhatsAppIcon />
                Consultar por WhatsApp
              </a>
            )}
            {/* En dos columnas alcanza con dos botones: Instagram ya está en el encabezado. */}
            {contact.instagram && !(split && contact.whatsapp) && (
              <a href={instagramUrl(contact.instagram)} {...external} className="btn btn-outline">
                <InstagramIcon />
                {contact.instagram}
              </a>
            )}
          </div>
        </div>
        {split && <HeroVisual />}
      </HeroCarousel>
    </section>
  );
}

/** Los productos de la portada, parados en una misma línea de piso delante del globo de la marca. */
function HeroVisual() {
  return (
    <div className="hero-visual" aria-hidden>
      {/* eslint-disable @next/next/no-img-element */}
      <img className="hv-globe" src="/brand/isotipo-oscuro.svg" alt="" />
      <span className="hv-floor" />
      <img className="hv hv-racket" src="/landing/paleta.webp" alt="" width={620} height={1021} />
      <img className="hv hv-mac" src="/landing/macbook.webp" alt="" width={900} height={541} />
      <img className="hv hv-phone" src="/landing/iphone-18-pro-max.webp" alt="" width={981} height={1200} fetchPriority="high" />
      <img className="hv hv-ps5" src="/landing/ps5.webp" alt="" width={684} height={900} />
      <img className="hv hv-vacuum" src="/landing/aspiradora.webp" alt="" width={900} height={502} />
      {/* eslint-enable @next/next/no-img-element */}
    </div>
  );
}

export function Steps({ site }: { site: Site }) {
  const { steps } = site;
  if (!steps.length) return null;
  return (
    <section className="steps" id="como-comprar">
      <div className="wrap">
        <h2>Cómo comprar</h2>
        <ol className="steps-list">
          {steps.map((step, i) => (
            <li key={step.id}>
              <span className="step-icon">
                <StepIcon name={step.icon} />
                <span className="step-number">{i + 1}</span>
              </span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function About({ site }: { site: Site }) {
  const { about, brand } = site;
  if (!about.text) return null;
  return (
    <section className="about" id="quienes-somos">
      <div className="wrap">
        <figure className="about-photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={about.image ?? "/landing/equipo.jpg"} alt={`El equipo de ${brand.name}`} loading="lazy" />
          {about.caption && <figcaption>{about.caption}</figcaption>}
        </figure>
        <div className="about-text">
          {about.title && <h2>{about.title}</h2>}
          <p>{about.text}</p>
          {about.people.length > 0 && (
            <ul className="about-people">
              {about.people.map((person) => (
                <li key={person.id}>
                  <strong>{person.name}</strong>
                  {person.instagram && (
                    <a href={instagramUrl(person.instagram)} {...external}>
                      <InstagramIcon />@{person.instagram}
                    </a>
                  )}
                  {person.whatsapp && (
                    <a href={`https://wa.me/${person.whatsapp}`} {...external}>
                      <WhatsAppIcon />
                      {prettyPhone(person.whatsapp)}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

export function Strip({ items }: { items: string[] }) {
  if (!items.length) return null;
  // La lista va dos veces para que la animación haga un loop sin corte.
  const loop = [...items, ...items];
  return (
    <div className="strip">
      <div className="strip-track">
        {loop.map((text, i) => (
          <span key={i} className={`strip-item ${i % 2 === 0 ? "is-strong" : ""}`} aria-hidden={i >= items.length}>
            <span className="dot" />
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Banners({ site }: { site: Site }) {
  const banners = site.banners.filter((b) => b.active && (b.title || b.image));
  if (!banners.length) return null;
  return (
    <section className="banners" aria-label="Promociones">
      <div className="wrap">
        <div className="banner-row" data-count={Math.min(banners.length, 3)}>
          {banners.map((b, i) => {
            // "whatsapp" abre la consulta con el número cargado en el panel.
            const href = b.link === "whatsapp" ? contactUrl(site.contact, generalMessage(site)) : b.link;
            const body = (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {b.image && <img src={b.image} alt="" loading="lazy" />}
                <div className="banner-text">
                  {b.title && (
                    <h2>
                      <BannerIcon name={b.icon} />
                      {b.title}
                    </h2>
                  )}
                  {b.text && <p>{b.text}</p>}
                  {href && b.buttonLabel && <span className="banner-cta">{b.buttonLabel}</span>}
                </div>
                {b.cards && (
                  <ul className="banner-cards" aria-label="Tarjetas aceptadas">
                    {CARDS.map((card) => (
                      <li key={card.name}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={card.src} alt={card.name} loading="lazy" />
                      </li>
                    ))}
                  </ul>
                )}
              </>
            );
            const className = `banner ${b.image ? "has-image" : `tone-${i % 3}`}`;
            return href ? (
              <a key={b.id} className={className} href={href} {...(href.startsWith("http") ? external : {})}>
                {body}
              </a>
            ) : (
              <div key={b.id} className={className}>
                {body}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function Footer({ site }: { site: Site }) {
  const { brand, contact, footer } = site;
  const consult = contactUrl(contact, generalMessage(site));
  const people = site.about.people.filter((person) => person.whatsapp);
  return (
    <footer id="contacto">
      <div className="wrap">
        <div className="footer-top">
          <Logo name={brand.name} tone={logoTone(site.theme.ink)} />
          {consult && (
            <a className="btn btn-footer" href={consult} {...external}>
              {contact.whatsapp ? <WhatsAppIcon /> : <InstagramIcon />}
              Hacé tu consulta
            </a>
          )}
        </div>

        <div className="footer-grid">
          <div className="footer-about">
            <p>{footer.about}</p>
            {footer.payments.length > 0 && (
              <ul className="pay-list" aria-label="Medios de pago">
                {footer.payments.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="footer-col">
            <h4>Contacto</h4>
            {/* Con los números de cada uno cargados en "Quiénes somos" se listan esos; si no, el WhatsApp general. */}
            {people.length > 0
              ? people.map((person) => (
                  <a key={person.id} href={`https://wa.me/${person.whatsapp}`} {...external}>
                    <WhatsAppIcon />
                    {person.name} · {prettyPhone(person.whatsapp)}
                  </a>
                ))
              : contact.whatsapp &&
                consult && (
                  <a href={consult} {...external}>
                    <WhatsAppIcon />
                    {prettyPhone(contact.whatsapp)}
                  </a>
                )}
            {contact.instagram && (
              <a href={instagramUrl(contact.instagram)} {...external}>
                <InstagramIcon />@{contact.instagram}
              </a>
            )}
            {contact.email && (
              <a href={`mailto:${contact.email}`}>
                <Mail strokeWidth={1.5} aria-hidden />
                {contact.email}
              </a>
            )}
            {contact.address && (
              <p>
                <MapPin strokeWidth={1.5} aria-hidden />
                {contact.address}
              </p>
            )}
            {contact.hours && (
              <p>
                <Clock strokeWidth={1.5} aria-hidden />
                {contact.hours}
              </p>
            )}
            {footer.note && !contact.address && (
              <p>
                <MapPin strokeWidth={1.5} aria-hidden />
                {footer.note}
              </p>
            )}
          </div>

          <div className="footer-col">
            <h4>Catálogo</h4>
            <Link href="/#catalogo">Ver todos los productos</Link>
            <Link href="/#como-comprar">Cómo comprar</Link>
            <Link href="/#top">Volver arriba</Link>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {brand.name}. Todos los derechos reservados.
          </span>
        </div>
      </div>
    </footer>
  );
}

export function WhatsAppFloat({ site }: { site: Site }) {
  if (!site.contact.whatsapp) return null;
  return (
    <a
      className="wa-float"
      href={contactUrl(site.contact, generalMessage(site)) ?? undefined}
      {...external}
      aria-label="Escribir por WhatsApp"
    >
      <WhatsAppIcon />
    </a>
  );
}
