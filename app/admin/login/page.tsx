import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/site/Logo";
import { isAdmin } from "@/lib/auth";
import { getSite } from "@/lib/store";
import { SUPABASE_READY } from "@/lib/supabase";
import { LoginForm } from "./LoginForm";
import "../admin.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ingresar al panel", robots: { index: false } };

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  const { brand } = await getSite();
  return (
    <div className="admin login">
      <aside className="login-brand">
        <Logo name={brand.name} layout="vertical" tone="oscuro" />
        <p>Panel de administración</p>
      </aside>
      <main className="login-side">
        <div className="login-box">
          <h1>Ingresar</h1>
          {SUPABASE_READY ? (
            <>
              <p>Entrá con tu cuenta para editar el catálogo.</p>
              <LoginForm />
            </>
          ) : (
            <p>
              Falta conectar la base de datos. Completá <code>.env.local</code> con la URL y la clave pública de Supabase (ver README) y
              reiniciá el servidor.
            </p>
          )}
          <Link className="back-link" href="/">
            <ArrowLeft aria-hidden /> Volver al sitio
          </Link>
        </div>
      </main>
    </div>
  );
}
