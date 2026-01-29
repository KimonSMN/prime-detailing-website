// src/pages/Index.tsx
import React, { Suspense, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Seo } from "@/components/SEO";
import { Hreflang } from "@/components/Hreflang";
import { buildCanonical, localeFor, BASE_URL } from "@/lib/seo";

import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import BeforeAfterStrip from "@/components/BeforeAfterStrip";

// ✅ Lazy import heavy components so they don't hurt LCP
const ReviewsCarousel = React.lazy(() => import("@/components/ReviewsCarousel"));
const GoogleReviewsEmbed = React.lazy(
  () => import("@/components/GoogleReviewsEmbed"),
);

/* Mount children only when near viewport */
function LazyWhenVisible({
  children,
  rootMargin = "300px",
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
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            io.disconnect();
          }
        });
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

  const businessJsonLd = {
    "@context": "https://schema.org",
    "@type": "AutomotiveBusiness",
    "@id": `${BASE_URL}#business`,
    name: "Prime Detailing Cholargos",
    url: BASE_URL,
    image: `${BASE_URL}/og-default.webp`,
    logo: `${BASE_URL}/favicon.ico`,
    email: "kimonsmirlianos@gmail.com",
    telephone: "+30 693 994 9788",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Κλειούς 39 & Αετιδέων 46",
      addressLocality: "Χολαργός",
      addressRegion: "Αττική",
      postalCode: "15561",
      addressCountry: "GR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 37.999296,
      longitude: 23.7968089,
    },
    areaServed: ["Χολαργός", "Αθήνα"],
    priceRange: "€€",
    sameAs: ["https://www.instagram.com/primedetailing.ath/"],
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ],
        opens: "08:00",
        closes: "16:00",
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title={t("seo.home.title")}
        description={t("seo.home.description")}
        siteName={t("seo.siteName")}
        canonical={canonical}
        locale={locale}
        image={`${BASE_URL}/og-default.webp`}
        jsonLd={businessJsonLd}
        links={[
          // ✅ Preload the ACTUAL LCP hero image (mobile-first)
          {
            rel: "preload",
            as: "image",
            href: "/hero/hero-720.avif",
            imagesrcset: "/hero/hero-720.avif 720w, /hero/hero-1600.avif 1600w",
            imagesizes: "100vw",
          },
        ]}
      />

      <Hreflang />

      <Hero />

      {/* Below-the-fold content is lazy to protect LCP */}
      <LazyWhenVisible>
        <Suspense fallback={null}>
          <ReviewsCarousel />
        </Suspense>
      </LazyWhenVisible>

      <LazyWhenVisible>
        <Suspense fallback={null}>
          <GoogleReviewsEmbed
            embedSrc="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3144.049742905001!2d23.794233977768958!3d37.99930019919164!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14a1993446e8c7eb%3A0x299bfe2c72a90cd6!2zUHJpbWUgRGV0YWlsaW5nIC0gz4DOu8-Fzr3PhM6uz4HOuc6_IM6xz4XPhM6_zrrOuc69zq7PhM-Jzr0gzqfOv867zrHPgc6zz4zPgg!5e0!3m2!1sen!2sgr!4v1758733703425!5m2!1sen!2sgr"
            reviewsLink="https://www.google.com/maps/place/?q=place_id:ChIJ68foRjSZoRQR1gypciz-myk"
          />
        </Suspense>
      </LazyWhenVisible>

      <BeforeAfterStrip
        heading="Projects"
        galleryUrl="/gallery"
        imageIds={[
          "glc-220d/mercedes-glc220d-1",
          "bmw-ix1/bmw-ix1-1",
          "kia-sportage/kia-sportage-1",
          "bmw-x5/bmw-x5-1",
        ]}
      />

      <Footer />
    </div>
  );
};

export default Index;
