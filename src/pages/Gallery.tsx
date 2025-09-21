import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

// --- Simple data (replace/extend with your real files in /public/gallery) ---
type GalleryImage = { src: string; alt: string };

const IMAGES: GalleryImage[] = [
  {
    src: "/gallery/detailing-opel-mokka-cholargos-1.webp",
    alt: "Opel Mokka Exterior Detailing",
  },
  {
    src: "/gallery/detailing-opel-mokka-cholargos-2.webp",
    alt: "Opel Mokka Exterior Detailing",
  },
  {
    src: "/gallery/detailing-opel-mokka-cholargos-3.webp",
    alt: "Opel Mokka Exterior Detailing",
  },
  {
    src: "/gallery/detailing-opel-mokka-cholargos-4.webp",
    alt: "Opel Mokka Exterior Detailing",
  },
  {
    src: "/gallery/detailing-citroen-c4-cholargos-1.webp",
    alt: "Opel Mokka Exterior Detailing",
  },
  {
    src: "/gallery/detailing-citroen-c4-cholargos-3.webp",
    alt: "Opel Mokka Exterior Detailing",
  },
  {
    src: "/gallery/detailing-citroen-c4-cholargos-4.webp",
    alt: "Opel Mokka Exterior Detailing",
  },
  {
    src: "/gallery/detailing-citroen-c4-cholargos-5.webp",
    alt: "Opel Mokka Exterior Detailing",
  },
  {
    src: "/gallery/detailing-toyota-yaris-cholargos-1.webp",
    alt: "Opel Mokka Exterior Detailing",
  },
  {
    src: "/gallery/detailing-toyota-yaris-cholargos-2.webp",
    alt: "Opel Mokka Exterior Detailing",
  },
  {
    src: "/gallery/detailing-toyota-auris-cholargos-1.webp",
    alt: "Opel Mokka Exterior Detailing",
  },
  {
    src: "/gallery/detailing-toyota-auris-cholargos-2.webp",
    alt: "Opel Mokka Exterior Detailing",
  },
  {
    src: "/gallery/detailing-toyota-auris-cholargos-3.webp",
    alt: "Opel Mokka Exterior Detailing",
  },
  {
    src: "/gallery/detailing-toyota-auris-cholargos-4.webp",
    alt: "Opel Mokka Exterior Detailing",
  },
  {
    src: "/gallery/detailing-toyota-auris-cholargos-5.webp",
    alt: "Opel Mokka Exterior Detailing",
  },
  {
    src: "/gallery/detailing-toyota-auris-cholargos-6.webp",
    alt: "Opel Mokka Exterior Detailing",
  },
  {
    src: "/gallery/detailing-seat-ibiza-cholargos-1.webp",
    alt: "Opel Mokka Exterior Detailing",
  },
  {
    src: "/gallery/detailing-seat-ibiza-cholargos-2.webp",
    alt: "Opel Mokka Exterior Detailing",
  },
  {
    src: "/gallery/detailing-seat-ibiza-cholargos-3.webp",
    alt: "Opel Mokka Exterior Detailing",
  },
];

export default function GalleryPage() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(8); // render a few first for speed

  const shown = IMAGES.slice(0, visible);

  return (
    <section className="px-4 py-14 md:py-20 bg-background">
      <Helmet>
        <title>
          {t("gallery.pageTitle", "Gallery | Prime Detailing Cholargos")}
        </title>
        <meta
          name="description"
          content={
            t(
              "gallery.pageDescription",
              "Explore our car detailing results: paint correction, ceramic coating, interior restoration and more."
            ) as string
          }
        />
      </Helmet>

      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-10 md:mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
            {t("gallery.heading", "Our Work")}{" "}
            <span className="bg-gold-gradient bg-clip-text text-transparent">
              {t("gallery.headingAccent", "Gallery")}
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t(
              "gallery.subtitle",
              "Real results from our detailing studio in Cholargos."
            )}
          </p>
        </div>

        {/* Big image grid (no filters) */}
        <div className="grid gap-5 sm:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-2">
          {shown.map((img, idx) => (
            <figure
              key={`${img.src}-${idx}`}
              className="relative overflow-hidden rounded-2xl border bg-card "
            >
              {/* 3:2 aspect for large tiles */}
              <div className="relative w-full pt-[100%]">
                <img
                  src={img.src}
                  alt={img.alt}
                  loading={idx < 2 ? "eager" : "lazy"}
                  fetchPriority={idx < 2 ? "high" : "auto"}
                  decoding="async"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  width={1600}
                  height={1066}
                  className="absolute inset-0 h-full w-full object-cover object-[center_75%]"
                />
              </div>
            </figure>
          ))}
        </div>

        {/* Show more */}
        {shown.length < IMAGES.length && (
          <div className="text-center mt-8">
            <button
              onClick={() => setVisible((v) => v + 8)}
              className="inline-flex items-center gap-2 rounded-xl border bg-card px-6 py-3 text-sm md:text-base font-semibold hover:bg-card/80"
              aria-label={
                t("gallery.showMoreAria", "Show more photos") as string
              }
            >
              {t("gallery.showMore", "Show more photos")}
            </button>
          </div>
        )}

        {/* Lightbox */}
      </div>
    </section>
  );
}
