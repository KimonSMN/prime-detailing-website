// src/pages/Index.tsx
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Seo } from "@/components/SEO";
import { Hreflang } from "@/components/Hreflang";
import { buildCanonical, localeFor, BASE_URL } from "@/lib/seo";

import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import BeforeAfterStrip from "@/components/BeforeAfterStrip";
import { X, Calendar, Sun } from "lucide-react"; // Make sure to install lucide-react if you haven't
import SummerClosurePopup from "@/components/SummerClosurePopup";

type Importer<T> = () => Promise<{ default: React.ComponentType<T> }>;

/**
 * Imports a component ONLY when it becomes visible.
 */
function ImportWhenVisible<TProps extends object>({
  importer,
  props,
  rootMargin = "0px 0px -15% 0px",
  minHeight = 320,
}: {
  importer: Importer<TProps>;
  props: TProps;
  rootMargin?: string;
  minHeight?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [Comp, setComp] = useState<React.ComponentType<TProps> | null>(null);

  useEffect(() => {
    if (!ref.current || Comp) return;

    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        if (!hit) return;

        io.disconnect();

        importer()
          .then((m) => setComp(() => m.default))
          .catch(() => {});
      },
      { root: null, rootMargin, threshold: 0.01 },
    );

    io.observe(ref.current);
    return () => io.disconnect();
  }, [Comp, importer, rootMargin]);

  return (
    <div ref={ref} style={{ minHeight }}>
      {Comp ? <Comp {...props} /> : null}
    </div>
  );
}

const Index = () => {
  const { t, i18n } = useTranslation();
  const canonical = buildCanonical();
  const locale = localeFor(i18n.resolvedLanguage);
  
  // State to handle the summer closure popup visibility
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    // Check if the user has already dismissed the popup recently
    const isDismissed = localStorage.getItem("summer_closure_dismissed_2026");
    if (!isDismissed) {
      // Small timeout to give a nice entry feel after the page loads
      const timer = setTimeout(() => setShowPopup(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClosePopup = () => {
    setShowPopup(false);
    // Remember preference so it doesn't spam them on every refresh
    localStorage.setItem("summer_closure_dismissed_2026", "true");
  };

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
    <div className="min-h-screen bg-background relative">
      <Seo
        title={t("seo.home.title")}
        description={t("seo.home.description")}
        siteName={t("seo.siteName")}
        canonical={canonical}
        locale={locale}
        image={`${BASE_URL}/og-default.webp`}
        jsonLd={businessJsonLd}
        links={[
          {
            rel: "preload",
            as: "image",
            href: "/hero/hero-720.avif",
            imagesrcset:
              "/hero/hero-720.avif 720w, /hero/hero-1080.avif 1080w, /hero/hero-1600.avif 1600w",
            imagesizes: "100vw",
          },
        ]}
      />

      <Hreflang />

      <SummerClosurePopup/>


      <Hero />

      {/* Reviews carousel */}
      <ImportWhenVisible
        importer={() => import("@/components/ReviewsCarousel")}
        props={{} as Record<string, never>}
        minHeight={360}
        rootMargin="0px 0px -20% 0px"
      />

      {/* Google reviews embed */}
      <ImportWhenVisible
        importer={() => import("@/components/GoogleReviewsEmbed")}
        props={{
          embedSrc:
            "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3144.049742905001!2d23.794233977768958!3d37.99930019919164!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14a1993446e8c7eb%3A0x299bfe2c72a90cd6!2zUHJpbWUgRGV0YWlsaW5nIC0gz4DOu8-Fzr3PhM6uz4HOuc6_IM6xz4XPhM6_zrrOuc69zq7PhM-Jzr0gzqfOv867zrHPgc6zz4zPgg!5e0!3m2!1sen!2sgr!4v1758733703425!5m2!1sen!2sgr",
          reviewsLink:
            "https://www.google.com/maps/place/?q=place_id:ChIJ68foRjSZoRQR1gypciz-myk",
        }}
        minHeight={520}
        rootMargin="0px 0px -20% 0px"
      />

      {/* Projects strip */}
      <ImportWhenVisible
        importer={async () => ({ default: BeforeAfterStrip })}
        props={{
          heading: "Projects",
          galleryUrl: "/gallery",
          imageIds: [
            "glc-220d/mercedes-glc220d-1",
            "bmw-ix1/bmw-ix1-1",
            "kia-sportage/kia-sportage-1",
            "bmw-x5/bmw-x5-1",
          ],
        }}
        minHeight={420}
        rootMargin="0px 0px -25% 0px"
      />

      <Footer />

      {/* --- SUMMER CLOSURE POPUP --- */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl transform transition-all animate-scale-up">
            
            {/* Close Button */}
            <button
              onClick={handleClosePopup}
              className="absolute top-3 right-3 z-10 p-2 bg-black/40 hover:bg-black/70 text-white rounded-full transition-colors group"
              aria-label="Close popup"
            >
              <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>

            {/* Summer Banner Image with Text Overlay */}
            <div className="relative h-48 bg-cover bg-center flex items-end justify-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80')" }}>
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-black/20" />
              <div className="relative z-10 text-center pb-4 px-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  <Sun className="w-3.5 h-3.5 animate-spin-slow" /> Summer Notice
                </div>
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  Summer Holidays Schedule
                </h3>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 text-center text-zinc-300">
              <p className="text-sm leading-relaxed text-zinc-400 mb-6">
                Our team is taking a short break to recharge our batteries and gear up for a shiny rest of the year! Please note our seasonal closing dates below:
              </p>

              {/* Dates Cards */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between p-3.5 bg-zinc-800/50 border border-zinc-800 rounded-xl hover:border-amber-500/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-white text-sm sm:text-base">July Break</span>
                  </div>
                  <span className="text-amber-400 font-semibold tracking-wide bg-amber-500/5 px-3 py-1 rounded-md border border-amber-500/10 text-sm sm:text-base">
                    12/07 – 18/07
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-zinc-800/50 border border-zinc-800 rounded-xl hover:border-amber-500/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-white text-sm sm:text-base">August Break</span>
                  </div>
                  <span className="text-amber-400 font-semibold tracking-wide bg-amber-500/5 px-3 py-1 rounded-md border border-amber-500/10 text-sm sm:text-base">
                    28/07 – 10/08
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleClosePopup}
                className="w-full py-3 bg-white text-black hover:bg-zinc-200 font-semibold rounded-xl transition-all shadow-md active:scale-[0.98]"
              >
                Got it, thanks!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;