import { redirect } from "next/navigation";
import { AdminApp } from "@/components/admin/AdminApp";
import { isAdmin } from "@/lib/auth";
import { getAllProducts, getSite } from "@/lib/store";
import "./admin.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Panel", robots: { index: false } };

export default async function AdminPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const [site, products] = await Promise.all([getSite(), getAllProducts()]);
  return <AdminApp site={site} products={products} />;
}
