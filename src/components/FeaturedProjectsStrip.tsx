// src/components/FeaturedProjectsStrip.tsx
import { Link } from "react-router-dom";

type FeaturedImage = {
  alt: string;
  /** Base path without -wXXX.webp suffix, e.g. "/gallery/bmw-x5/bmw-x5-1" */
  base: string;
};

export default function FeaturedProjectsStrip({
  heading,
  galleryUrl,
  images,
  totalPhotos,
}: {
  heading: string;
  galleryUrl: string;
  images: FeaturedImage[];
  /** Total photos in gallery (optional). If omitted, we’ll show “See more photos”. */
  totalPhotos?: number;
}) {
  const shown = images.length;
  const moreCount =
    typeof totalPhotos === "number" && totalPhotos > shown
      ? totalPhotos - shown
      : null;

  return (
    <section className="px-4 py-14 md:py-20 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between gap-4 mb-6">
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">
            {heading}
          </h2>
        </div>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          {images.map((img) => {
            const src640 = `${img.base}-w640.webp`;
            const src1280 = `${img.base}-w1280.webp`;
            const src1920 = `${img.base}-w1920.webp`;

            return (
              <div
                key={img.base}
                className="group relative overflow-hidden rounded-2xl border bg-card"
              >
                {/* Maintain aspect ratio to avoid layout shift */}
                <div className="relative w-full aspect-[3/4]">
                  <picture>
                    <source
                      type="image/webp"
                      srcSet={`${src640} 640w, ${src1280} 1280w, ${src1920} 1920w`}
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <img
                      src={src640}
                      alt={img.alt}
                      className="absolute inset-0 h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                      fetchPriority="low"
                      width={960}
                      height={1280}
                    />
                  </picture>

                  <div className="absolute inset-0 bg-black/25" />

                </div>
              </div>
            );
          })}
        </div>

        {/* See more */}
        <div className="mt-12 flex justify-center">
          <Link
            to={galleryUrl}
            className="
              rounded-xl
              border
              border-secondary
              px-6
              py-3
              text-secondary
              font-semibold
              hover:bg-secondary
              hover:text-black
              transition
            "
            aria-label={
              moreCount !== null
                ? `See ${moreCount} more photos`
                : "See more photos"
            }
          >
            {moreCount !== null ? `See ${moreCount} more photos` : "See more photos"}
          </Link>
        </div>
      </div>
    </section>
  );
}
