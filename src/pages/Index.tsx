// src/pages/Index.tsx (landing page)
import { useTranslation } from "react-i18next";
import { Seo } from "@/components/SEO";
import { Hreflang } from "@/components/Hreflang";
import { buildCanonical, localeFor, BASE_URL } from "@/lib/seo";

import Hero from "@/components/Hero";
import USPIntro from "@/components/USPIntro";
import GoogleReviewsEmbed from "@/components/GoogleReviewsEmbed";
import Footer from "@/components/Footer";
import ReviewsCarousel from "@/components/ReviewsCarousel";
import ContactBand from "@/components/ContactBand";
import FAQ from "@/components/FAQ";
import BeforeAfterStrip from "@/components/BeforeAfterStrip";
import TopNavbar from "@/components/TopNavbar";

const Index = () => {
  const { t, i18n } = useTranslation();
  const canonical = buildCanonical();
  const locale = localeFor(i18n.resolvedLanguage);

  // Localized Business JSON-LD (kept constant data, EL-first address)
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
      />
      <Hreflang />

      {/* <TopNavbar /> */}
      <Hero />
      {/* <USPIntro /> */}
      <ReviewsCarousel />

      <GoogleReviewsEmbed
        embedSrc="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3144.049742905001!2d23.794233977768958!3d37.99930019919164!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14a1993446e8c7eb%3A0x299bfe2c72a90cd6!2zUHJpbWUgRGV0YWlsaW5nIC0gz4DOu8-Fzr3PhM6uz4HOuc6_IM6xz4XPhM6_zrrOuc69zq7PhM-Jzr0gzqfOv867zrHPgc6zz4zPgg!5e0!3m2!1sen!2sgr!4v1758733703425!5m2!1sen!2sgr"
        reviewsLink="https://www.google.com/maps/place/?q=place_id:ChIJ68foRjSZoRQR1gypciz-myk"
      />

      {/* <FAQ /> */}
      {/* <ContactBand /> */}
      <BeforeAfterStrip
        heading="Featured Projects"
        galleryUrl="/gallery"
        imageIds={[
          "detailing-bmw-ix1-cholargos-2",
          "detailing-ford-kuga-cholargos-3",
          "detailing-renault-clio-cholargos-2",
          "detailing-opel-mokka-cholargos-3",
        ]}
      />
      <Footer />
    </div>
  );
};

export default Index;
