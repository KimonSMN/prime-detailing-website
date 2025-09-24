import { useTranslation } from "react-i18next";

type Pair = { link: string; alt: string };

const PAIRS: Pair[] = [
  {
    link: "/gallery/detailing-opel-mokka-cholargos-1.webp",
    alt: "Opel Mokka Exterior Detailing",
  },
  {
    link: "/gallery/detailing-ford-kuga-cholargos-2.webp",
    alt: "Ford Kuga Exterior Detailing",
  },
  {
    link: "/gallery/detailing-toyota-auris-cholargos-2.webp",
    alt: "Toyota Auris Exterior Detailing",
  },
  {
    link: "/gallery/detailing-toyota-yaris-cholargos-1.webp",
    alt: "Toyota Yaris Exterior Detailing",
  },
];

type BeforeAfterStripProps = {
  /** How many images to show on landing */
  maxShown?: number;
  /** Where the CTA points to */
  galleryUrl?: string;
  /** Optional heading override */
  heading?: string;
};

/** Build srcset variants from a base .webp path (expects -480/-768/-1000 files to exist). */
function buildVariants(link: string) {
  const base = link.replace(/\.webp$/i, "");
  return {
    avif: `${base}-480.avif 480w, ${base}-768.avif 768w, ${base}-1000.avif 1000w`,
    webp: `${base}-480.webp 480w, ${base}-768.webp 768w, ${base}-1000.webp 1000w`,
    fallback: `${base}-1000.webp`,
  };
}

// Match your grid: 1 col on mobile (100vw), 2 cols on md (≈50vw), cap around 640px per item
const SIZES = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 640px";

export default function BeforeAfterStrip({
  maxShown = 4,
  galleryUrl = "/gallery",
  heading,
}: BeforeAfterStripProps) {
  const { t } = useTranslation();
  const shown = PAIRS.slice(0, Math.max(0, maxShown));
  const remaining = Math.max(0, PAIRS.length - shown.length);
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

        {/* Tight 2×2 grid on desktop, 1×N on mobile */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
          {shown.map((p, i) => {
            const v = buildVariants(p.link);
            return (
              <figure
                key={i}
                className="overflow-hidden rounded-xl border bg-card"
              >
                {/* Maintain aspect ratio (4:3 here) to prevent CLS */}
                <div className="relative w-full pt-[75%]">
                  <picture>
                    <source type="image/avif" srcSet={v.avif} sizes={SIZES} />
                    <source type="image/webp" srcSet={v.webp} sizes={SIZES} />
                    <img
                      src={v.fallback}
                      alt={p.alt}
                      loading="lazy"
                      decoding="async"
                      width={1000}
                      height={750}
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
