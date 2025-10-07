import React from "react";

type Variant = { format: "avif" | "webp"; width: number; url: string };
export type ManifestItem = {
  id: string;
  alt: string;
  original: { width: number; height: number };
  variants: Variant[];
};

export function ResponsivePicture({
  item,
  sizes = "(max-width: 768px) 100vw, 50vw",
  eager = false,
  className,
}: {
  item: ManifestItem;
  sizes?: string;
  eager?: boolean;
  className?: string;
}) {
  const avif = item.variants.filter((v) => v.format === "avif");
  const webp = item.variants.filter((v) => v.format === "webp");
  const fallback =
    webp[webp.length - 1]?.url ?? avif[avif.length - 1]?.url ?? "";

  return (
    <picture>
      {avif.length > 0 && (
        <source
          type="image/avif"
          srcSet={avif.map((v) => `${v.url} ${v.width}w`).join(", ")}
          sizes={sizes}
        />
      )}
      {webp.length > 0 && (
        <source
          type="image/webp"
          srcSet={webp.map((v) => `${v.url} ${v.width}w`).join(", ")}
          sizes={sizes}
        />
      )}
      <img
        src={fallback}
        alt={item.alt}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : "auto"}
        decoding="async"
        sizes={sizes}
        width={item.original.width}
        height={item.original.height}
        className={className}
        style={{
          aspectRatio: `${item.original.width} / ${item.original.height}`,
        }}
      />
    </picture>
  );
}
