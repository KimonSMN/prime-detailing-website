"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

/** Matches your gallery-manifest.json structure */
type Variant = { format: string; width: number; url: string };
type ManifestItem = {
  id: string;
  alt: string;
  original: { width: number; height: number; bytes: number };
  variants: Variant[];
};

type BeforeAfterStripProps = {
  /** How many images to show if no IDs are given */
  maxShown?: number;
  /** Where the CTA points to */
  galleryUrl?: string;
  /** Optional heading override */
  heading?: string;
  /** Specific image IDs to display (in order) */
  imageIds?: string[];
};

/** Build a srcset string for a given format from the manifest's variants */
function buildSrcSet(variants: Variant[], format: string): string | undefined {
  const filtered = variants
    .filter((v) => v.format.toLowerCase() === format.toLowerCase())
    .sort((a, b) => a.width - b.width);
  if (filtered.length === 0) return undefined;
  return filtered.map((v) => `${v.url} ${v.width}w`).join(", ");
}

/** Pick the largest variant as fallback <img src> */
function largestVariantUrl(variants: Variant[], prefFormat = "webp"): string {
  const preferred = variants
    .filter((v) => v.format.toLowerCase() === prefFormat.toLowerCase())
    .sort((a, b) => b.width - a.width);
  if (preferred.length > 0) return preferred[0].url;
  const any = [...variants].sort((a, b) => b.width - a.width);
  return any.length ? any[0].url : "";
}

const SIZES = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 640px";

export default function BeforeAfterStrip({
  maxShown = 4,
  galleryUrl = "/gallery",
  heading,
  imageIds,
}: BeforeAfterStripProps) {
  const { t } = useTranslation();
  const [items, setItems] = useState<ManifestItem[]>([]);

  useEffect(() => {
    fetch("/gallery-manifest.json")
      .then((r) => r.json())
      .then((data: ManifestItem[]) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]));
  }, []);

  const filteredItems = React.useMemo(() => {
    if (!imageIds || imageIds.length === 0) return items.slice(0, maxShown);
    const lookup = new Map(items.map((i) => [i.id, i]));
    return imageIds
      .map((id) => lookup.get(id))
      .filter((v): v is ManifestItem => !!v);
  }, [items, imageIds, maxShown]);

  const remaining = Math.max(0, items.length - filteredItems.length);
  const title = heading ?? t("gallery.heading", "Our Work");

  return (
    <section
      className="px-4 py-14 md:py-20 bg-muted/10"
      aria-label={t("gallery.ariaTeaser", "Gallery teaser")}
    >
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="text-3xl md:text-4xl font-extrabold">{title}</h2>
        </div>

        {/* Grid layout */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
          {filteredItems.map((item, idx) => {
            const webpSet = buildSrcSet(item.variants, "webp");
            const fallback = largestVariantUrl(item.variants, "webp");

            return (
              <figure
                key={item.id}
                className="overflow-hidden rounded-xl border bg-card"
              >
                <div className="relative w-full pt-[75%]">
                  <picture>
                    {webpSet && (
                      <source
                        type="image/webp"
                        srcSet={webpSet}
                        sizes={SIZES}
                      />
                    )}
                    <img
                      src={fallback}
                      alt={item.alt}
                      loading={idx < 2 ? "eager" : "lazy"}
                      decoding="async"
                      width={1280}
                      height={960}
                      className="absolute inset-0 h-full w-full object-cover object-[center_75%]"
                    />
                  </picture>
                </div>
              </figure>
            );
          })}
        </div>

        <div className="mt-6 text-center">
          <a
            href={galleryUrl}
            className="inline-flex items-center gap-2 rounded-xl border bg-primary px-5 py-3 text-primary-foreground font-medium hover:opacity-95 transition"
            aria-label={t("gallery.ariaOpen", "Open full detailing gallery")}
          >
            {remaining > 0
              ? t("gallery.cta.viewMore", { count: remaining })
              : t("gallery.cta.viewAll", "View full gallery")}
          </a>
        </div>
      </div>
    </section>
  );
}
