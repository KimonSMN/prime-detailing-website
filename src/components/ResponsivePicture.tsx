type Variant = { format: "avif" | "webp"; width: number; url: string };

export type ManifestItem = {
  id: string;
  src: string;
  alt: string;
  project?: { id: string; title: string };
};

export function ResponsivePicture({
  item,
  eager = false,
  className,
}: {
  item: ManifestItem;
  eager?: boolean;
  className?: string;
}) {
  return (
    <img
      src={item.src}
      alt={item.alt}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      decoding="async"
      className={className}
      style={{
        width: "100%",
        height: "auto",
        display: "block",
      }}
    />
  );
}