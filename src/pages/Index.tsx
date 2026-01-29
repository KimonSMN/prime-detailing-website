// src/pages/Index.tsx
import React, { Suspense, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Seo } from "@/components/SEO";
import { Hreflang } from "@/components/Hreflang";
import { buildCanonical, localeFor, BASE_URL } from "@/lib/seo";

import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import FeaturedProjectsStrip from "@/components/FeaturedProjectsStrip";

const ReviewsCarousel = React.lazy(() => import("@/components/ReviewsCarousel"));
const GoogleReviewsEmbed = React.lazy(
  () => import("@/components/GoogleReviewsEmbed"),
);

/* Mount children only when actually near viewport (keep margin small on mobile) */
function LazyWhenVisible({
  children,
  rootMargin = "80px",
}: {
  children: React.ReactNode;
  rootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current || visible) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            io.disconnect();
            break;
          }
        }
      },
      { root: null, rootMargin, threshold: 0.01 },
    );

    io.observe(ref.current);
    return () => io.disconnect();
  }, [visible, rootMargin]);

  return <div ref={ref}>{visible ? children : null}</div>;
}

const Index = () => {
  const { t, i18n } = useTranslation();
  const canonical = buildCanonical();
  const locale = localeFor(i18n.resolvedLanguage);

  // NOTE:
  // You already have JSON-LD + preload in index.html.
  // Keep Seo for SPA meta consistency, but don't duplicate heavy stuff here.

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title={t("seo.home.title")}
        description={t("seo.home.description")}
        siteName={t("seo.siteName")}
        canonical={canonical}
        locale={locale}
        image={`${BASE_URL}/og-default.webp`}
      />

      <Hreflang />

      <Hero />

      {/* Keep reviews lazy but don't mount too early */}
      <LazyWhenVisible rootMargin="120px">
        <Suspense fallback={null}>
          <ReviewsCarousel />
        </Suspense>
      </LazyWhenVisible>

      {/* Maps embed can be heavy; mount later */}
      <LazyWhenVisible rootMargin="0px">
        <Suspense fallback={null}>
          <GoogleReviewsEmbed
            embedSrc="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3144.049742905001!2d23.794233977768958!3d37.99930019919164!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14a1993446e8c7eb%3A0x299bfe2c72a90cd6!2zUHJpbWUgRGV0YWlsaW5nIC0gz4DOu8-Fzr3PhM6uz4HOuc6_IM6xz4XPhM6_zrrOuc69zq7PhM-Jzr0gzqfOv867zrHPgc6zz4zPgg!5e0!3m2!1sen!2sgr!4v1758733703425!5m2!1sen!2sgr"
            reviewsLink="https://www.google.com/maps/place/?q=place_id:ChIJ68foRjSZoRQR1gypciz-myk"
          />
        </Suspense>
      </LazyWhenVisible>

      {/* ✅ Replace BeforeAfterStrip: no manifest fetch + responsive images */}
      <LazyWhenVisible rootMargin="0px">
        <FeaturedProjectsStrip
          heading="Projects"
          galleryUrl="/gallery"
          totalPhotos={44}
          images={[
            {
              alt: "Mercedes GLC 220d after detailing",
              base: "/gallery/glc-220d/mercedes-glc220d-1",
            },
            {
              alt: "BMW iX1 after detailing",
              base: "/gallery/bmw-ix1/bmw-ix1-1",
            },
            {
              alt: "Kia Sportage after detailing",
              base: "/gallery/kia-sportage/kia-sportage-1",
            },
            {
              alt: "BMW X5 after detailing",
              base: "/gallery/bmw-x5/bmw-x5-1",
            },
          ]}
        />
      </LazyWhenVisible>

      <Footer />
    </div>
  );
};

export default Index;
