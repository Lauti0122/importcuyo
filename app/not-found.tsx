import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found">
      <h1>No encontramos esa página</h1>
      <p>Puede que el producto ya no esté disponible.</p>
      <Link href="/catalogo" className="btn">
        Ver el catálogo
      </Link>
    </main>
  );
}
