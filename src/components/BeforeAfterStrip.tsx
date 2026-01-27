"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

/** Manifest types */
type Variant = { format: string; width: number; url: string };
type ManifestItem = {
  id: string;
  alt: string;
  original: { width: number; height: number; bytes: number | null };
  variants: Variant[];
};

type BeforeAfterStripProps = {
  maxShown?: number;
  galleryUrl?: string;
  heading?: string;
  imageIds?: string[];
  /** If the strip sits above-the-fold, you can eagerly load the first N images (default 0). */
  eagerCount?: number;
};

/** Build a srcset string for a given format from the manifest's variants */
function buildSrcSet(variants: Variant[], format: string): string | undefined {
  const filtered = variants
    .filter((v) => v.format.toLowerCase() === format.toLowerCase())
    .sort((a, b) => a.width - b.width);
  if (!filtered.length) return;
  return filtered.map((v) => `${v.url} ${v.width}w`).join(", ");
}

/** Smallest (best for fallback src) */
function smallestVariantUrl(variants: Variant[], prefFormat = "webp"): string {
  const sameFmt = variants
    .filter((v) => v.format.toLowerCase() === prefFormat.toLowerCase())
    .sort((a, b) => a.width - b.width);
  if (sameFmt.length) return sameFmt[0].url;
  const any = [...variants].sort((a, b) => a.width - b.width);
  return any.length ? any[0].url : "";
}

const SIZES = "(max-width: 480px) 100vw, (max-width: 1024px) 45vw, 480px";

export default function BeforeAfterStrip({
  maxShown = 4,
  galleryUrl = "/gallery",
  heading,
  imageIds,
  eagerCount = 0,
}: BeforeAfterStripProps) {
  const { t } = useTranslation();
  const [items, setItems] = useState<ManifestItem[]>([]);

  useEffect(() => {
    fetch("/gallery-manifest.json")
      .then((r) => r.json())
      .then((data: ManifestItem[]) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]));
  }, []);

  const shown = useMemo(() => {
    if (!imageIds?.length) return items.slice(0, maxShown);
    const map = new Map(items.map((i) => [i.id, i]));
    return imageIds.map((id) => map.get(id)).filter(Boolean) as ManifestItem[];
  }, [items, imageIds, maxShown]);

  const remaining = Math.max(0, items.length - shown.length);
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

        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
          {shown.map((item, idx) => {
            const avifSet = buildSrcSet(item.variants, "avif");
            const webpSet = buildSrcSet(item.variants, "webp");
            const fallback = smallestVariantUrl(item.variants, "webp");

            const eager = idx < eagerCount; // usually 0 for below-the-fold sections

            return (
              <figure
                key={item.id}
                className="overflow-hidden rounded-xl border bg-card"
              >
                {/* 4:3 aspect guard to prevent CLS */}
                <div className="relative w-full pt-[75%]">
                  <picture>
                    {avifSet && (
                      <source
                        type="image/avif"
                        srcSet={avifSet}
                        sizes={SIZES}
                      />
                    )}
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
                      loading={eager ? "eager" : "lazy"}
                      fetchPriority={eager ? "high" : "low"}
                      decoding="async"
                      width={960}
                      height={720}
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
            className="inline-flex items-center gap-2 rounded-xl border bg-secondary px-5 py-3 text-black font-medium hover:opacity-95 transition"
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
