# Import Cuyo · Catálogo

Catálogo online con panel de administración. Next.js (App Router) + TypeScript.

## Uso

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

- Sitio público: `/`
- Panel: `/admin` (se entra con un usuario de Supabase que esté en la tabla `admins`)

Copiá `.env.example` a `.env.local` y completá la URL y la clave pública del proyecto de
Supabase (Settings → API Keys). No hace falta la clave secreta: el panel escribe con la sesión
de quien inició sesión y los permisos los deciden las políticas de la base.

Sin `.env.local` el sitio igual levanta, con los textos y los productos de muestra de
`lib/defaults.ts`, pero el panel no abre.

### Crear la base

1. Crear un proyecto en Supabase.
2. En el SQL Editor, correr `supabase/schema.sql` (tablas, permisos y bucket de imágenes).
3. Opcional: correr `supabase/seed.sql` para arrancar con los productos de muestra.
4. Dar acceso al panel (más abajo).

## Qué se edita desde el panel

- **Productos**: alta, edición, duplicado, orden, ocultar, eliminar. Cada producto tiene marca,
  categoría, características, una o más versiones (256 GB, 512 GB) con su precio en dólares,
  oferta y disponibilidad, y colores con sus fotos. No hay stock: se trabaja por encargue.
- **Categorías**: la lista que se elige al cargar un producto y que filtra el catálogo.
- **Portada**: imagen de fondo, oscurecido, carrusel de fotos y textos.
- **Banners**: agregar, ordenar, ocultar; con o sin imagen.
- **Marquesina y cómo comprar**: frases de la cinta y bloques con ícono.
- **Datos y contacto**: marca, WhatsApp, Instagram, dirección, horarios, pie de página y
  cotización del dólar (con una cotización cargada, el catálogo muestra también el precio en pesos).
- **Colores**: paleta completa con vista previa, y colores de producto guardados.

## Dónde se guardan los datos

En Supabase (esquema en `supabase/schema.sql`):

- Tabla `site`: una fila con textos, banners, contacto y colores
- Tabla `products`: un producto por fila, con su orden
- Bucket público `media`: imágenes subidas
- Tabla `admins`: qué usuarios pueden entrar al panel

Cualquiera puede leer el sitio y los productos visibles; solo los usuarios de `admins` pueden
escribir o subir imágenes. Mientras no se guarde nada desde el panel, los textos salen de
`lib/defaults.ts`.

### Dar acceso al panel

1. En Supabase: Authentication → Users → Add user (email y contraseña).
2. En el SQL Editor:

```sql
insert into public.admins (user_id) select id from auth.users where email = 'EMAIL';
```

Para quitar el acceso se borra esa fila de `admins`.

## Estructura

- `app/page.tsx`: página pública
- `components/site/`: secciones del sitio y catálogo
- `app/admin/`, `components/admin/`: panel
- `lib/store.ts`: lectura y escritura de datos en Supabase
- `lib/auth.ts`, `proxy.ts`: sesión del panel
- `supabase/`: esquema y productos de muestra
- `public/brand/`: logos del kit de marca (versión color para fondos claros, oscura para fondos oscuros)
- `lib/theme.ts`: paleta y colores de texto calculados
