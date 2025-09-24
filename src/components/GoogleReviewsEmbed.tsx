import { useTranslation } from "react-i18next";
import { ExternalLink } from "lucide-react";
import { useRef, useState, useEffect } from "react";

type Props = {
  /** Paste the iframe src from Google Maps “Embed a map” (NOT the whole iframe). */
  embedSrc: string;
  /** Optional: direct link to open the reviews panel on Google Maps. */
  reviewsLink?: string; // e.g. https://www.google.com/maps/place/?q=place_id:ChIJ68foRjSZoRQR1gypciz-myk
};

const GoogleReviewsEmbed = ({ embedSrc, reviewsLink }: Props) => {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect(); // load only once
        }
      },
      { rootMargin: "200px" }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  return (
    <section
      id="google-reviews"
      className="px-4 py-14 md:py-20 bg-muted/20"
      aria-label={t("reviews.aria", "Google reviews")}
      ref={ref}
    >
      <div className="max-w-6xl mx-auto">
        {/* Responsive 16:9 wrapper */}
        <div className="relative w-full overflow-hidden rounded-2xl border bg-card">
          <div className="pt-[56.25%]" aria-hidden="true" />
          {visible ? (
            <iframe
              title={t("reviews.iframeTitle", "Prime Detailing on Google Maps")}
              src={embedSrc}
              className="absolute inset-0 h-full w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
              {t("reviews.loading", "Loading map…")}
            </div>
          )}
        </div>

        {/* CTA row */}
        {reviewsLink ? (
          <div className="mt-6 text-center">
            <a
              href={reviewsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border bg-primary px-5 py-3 text-primary-foreground font-medium hover:opacity-95"
            >
              {t("reviews.cta", "Read all reviews on Google")}
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        ) : null}

        {/* Attribution */}
        <p className="mt-3 text-center text-xs text-muted-foreground">
          {t("reviews.attribution", "Ratings & reviews powered by Google")}
        </p>
      </div>
    </section>
  );
};

export default GoogleReviewsEmbed;
