import { Banknote, CircleDollarSign, Clock, CreditCard, MapPin, MessageCircle, Package, Search, ShieldCheck, Truck, Wallet } from "lucide-react";
import type { ComponentType } from "react";

/** Íconos que se pueden elegir para los pasos de "Cómo comprar" y para los banners. */
export const STEP_ICONS: Record<string, { label: string; Icon: ComponentType<{ strokeWidth?: number }> }> = {
  whatsapp: { label: "WhatsApp", Icon: WhatsAppIcon },
  message: { label: "Consulta", Icon: MessageCircle },
  search: { label: "Buscar", Icon: Search },
  dollar: { label: "Pesos", Icon: CircleDollarSign },
  wallet: { label: "Billetera", Icon: Wallet },
  banknote: { label: "Efectivo", Icon: Banknote },
  "credit-card": { label: "Tarjeta", Icon: CreditCard },
  package: { label: "Paquete", Icon: Package },
  truck: { label: "Envío", Icon: Truck },
  "map-pin": { label: "Punto de entrega", Icon: MapPin },
  clock: { label: "Plazo", Icon: Clock },
  shield: { label: "Garantía", Icon: ShieldCheck },
};

/** El ícono de un banner; nada si no tiene uno elegido. */
export function BannerIcon({ name }: { name: string }) {
  const Icon = STEP_ICONS[name]?.Icon;
  return Icon ? <Icon strokeWidth={1.8} /> : null;
}

export function StepIcon({ name }: { name: string }) {
  const { Icon } = STEP_ICONS[name] ?? STEP_ICONS.message;
  return <Icon strokeWidth={1.6} />;
}

export function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.5 14.4c-.3-.1-1.7-.9-2-1-.3-.1-.5-.1-.7.1s-.7 1-.9 1.2c-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.2-.6-.4z" />
      <path d="M12 2C6.5 2 2 6.5 2 12c0 1.9.5 3.7 1.5 5.3L2 22l4.8-1.5c1.5.8 3.3 1.3 5.2 1.3 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18.3c-1.7 0-3.4-.5-4.8-1.3l-.3-.2-3.1.9.9-3-.2-.3C3.6 14.9 3.1 13.5 3.1 12c0-4.900 4-8.900 8.900-8.900s8.900 4 8.900 8.900-4 8.900-8.900 8.900z" />
    </svg>
  );
}
