const SIZE = { horizontal: [517, 181], vertical: [366, 364] } as const;

/** El logo de la marca. `tone` elige la versión del kit: "color" para fondos claros, "oscuro" para fondos oscuros. */
export function Logo({
  name,
  layout = "horizontal",
  tone = "color",
  className = "",
}: {
  name: string;
  layout?: keyof typeof SIZE;
  tone?: "color" | "oscuro";
  className?: string;
}) {
  const [width, height] = SIZE[layout];
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={`logo logo-${layout} ${className}`} src={`/brand/logo-${layout}-${tone}.svg`} alt={name} width={width} height={height} />;
}
