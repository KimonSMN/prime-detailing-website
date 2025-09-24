import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const Hero = () => {
  const { t } = useTranslation();

  return (
    <section
      className="relative h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden"
      aria-label={t("hero.sectionLabel", "Prime Detailing hero")}
    >
      {/* LCP Image as real <img> for SEO/perf */}
      <div className="absolute inset-0 -z-10">
        {/* Brand gradient overlay */}
        <div
          className="absolute inset-0 bg-hero-gradient opacity-80"
          aria-hidden="true"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto animate-fade-in">
        <h1 className="text-5xl md:text-7xl font-extrabold mb-4 tracking-tight">
          <span className="text-foreground">{t("hero.title.prime")}</span>
          <span className="bg-gold-gradient bg-clip-text text-transparent ml-3">
            {t("hero.title.detailing")}
          </span>
        </h1>
        <p className="text-xl md:text-2xl font-semibold mb-6">
          {t("hero.h1", "Car Detailing in Cholargos")}
        </p>

        <p className="text-lg md:text-2xl text-muted-foreground mb-8 leading-relaxed max-w-2xl mx-auto">
          {t(
            "hero.tagline",
            "Transform your vehicle with premium detailing — paint correction, ceramic coating, and deep interior care."
          )}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up">
          <Button
            asChild
            variant="hero"
            size="lg"
            className="text-lg px-8 py-6 h-auto"
          >
            <Link
              to="/services"
              aria-label={t(
                "hero.cta.servicesAria",
                "View detailing services in Athens"
              )}
            >
              {t("hero.btn.services", "View Services")}
            </Link>
          </Button>

          <Button
            asChild
            variant="premium"
            size="lg"
            className="text-lg px-8 py-6 h-auto"
          >
            <Link
              to="/booking"
              aria-label={t(
                "hero.cta.contactAria",
                "Contact Prime Detailing to book"
              )}
            >
              {t("hero.btn.book", "Book Appointment")}
            </Link>
          </Button>
        </div>
      </div>

      {/* Scroll Indicator — optional on landing */}
      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce"
        aria-hidden="true"
      >
        <div className="w-6 h-10 border-2 rounded-full flex justify-center border-[#99CCFF]">
          <div className="w-1 h-3 rounded-full mt-2 animate-pulse bg-[#99CCFF]"></div>
        </div>
      </div>

      {/* NoScript fallback for key contact info */}
      <noscript>
        <div className="sr-only">
          Prime Detailing — Kleious 39 &amp; Aetideon 46, Cholargos 15561 —
          (+30) 693 994 9788
        </div>
      </noscript>
    </section>
  );
};

export default Hero;
