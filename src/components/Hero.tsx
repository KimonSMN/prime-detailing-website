import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import hat from "../assets/icons/santa-hat.png";
const Hero = () => {
  const { t } = useTranslation();

  return (
    <section
      className="relative h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden "
      aria-label={t("hero.sectionLabel", "Prime Detailing hero")}
    >
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        {/* Subtle amber-tinted overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-950/90 to-zinc-900"
          aria-hidden="true"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto animate-fade-in">
        {/* ⭐ UPDATED TITLE WITH SANTA HAT ⭐ */}
        <h1 className="text-5xl md:text-7xl font-extrabold mb-4 tracking-tight">
          {/* Prime with Christmas Hat */}
          <span className="text-zinc-100 relative inline-block ">
            {/* P with hat */}
            <span className="relative inline-block christmas:hat-wrapper">
              P
              <img
                src={hat}
                alt=""
                style={{ transform: "scaleX(-1)" }}
                className="
                  hidden
                  christmas:block
                  christmas:absolute
                  pointer-events-none
                  select-none

                  /* Mobile (default) = hat lower */
                  christmas:-top-1
                  christmas:-left-2.5

                  /* Larger screens restore tighter placement */
                  sm:christmas:-top-1.5
                  sm:christmas:-left-3.5

                  christmas:w-20    /* slightly smaller on phones */
                  sm:christmas:w-24 /* full size on desktop */"
              />
            </span>

            {/* "Prime" title */}
            {t("hero.title.prime").slice(1)}
          </span>

          {/*  "Detailing" title  */}
          <span className="text-secondary ml-3">
            {t("hero.title.detailing")}
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-zinc-100 font-semibold mb-6">
          {t("hero.h1", "Car Detailing in Cholargos")}
        </p>

        <p className="text-lg md:text-2xl text-zinc-400 mb-10 leading-relaxed max-w-2xl mx-auto">
          {t(
            "hero.tagline",
            "Transform your vehicle with premium detailing — paint correction, ceramic coating, and deep interior care.",
          )}
        </p>

        {/* CTAs */}

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up">
          <Button
            asChild
            variant="hero"
            size="lg"
            className="text-lg px-8 py-6 h-auto hover:bg-secondary-hover bg-secondary text-black"
          >
            <Link
              to="/booking"
              aria-label={t(
                "hero.cta.contactAria",
                "Contact Prime Detailing to book",
              )}
            >
              {t("hero.btn.book", "Book Appointment")}
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="
              border-zinc-700 text-zinc-200
              hover:bg-zinc-800 
              hover:text-zinc-200
              px-8 py-6 h-auto text-lg
            "
          >
            <Link
              to="/services"
              aria-label={t(
                "hero.cta.servicesAria",
                "View detailing services in Athens",
              )}
            >
              {t("hero.btn.services", "View Services")}
            </Link>
          </Button>
        </div>
      </div>

      {/* Scroll Indicator — optional on landing */}
      <div
        className="
          hidden md:block
          absolute bottom-6 left-1/2 -translate-x-1/2
          animate-bounce
        "
        aria-hidden="true"
      >
        <div className="w-6 h-10 border-2 rounded-full flex justify-center border-secondary">
          <div className="w-1 h-3 rounded-full mt-2 animate-pulse bg-secondary"></div>
        </div>
      </div>

      {/* NoScript fallback for key contact info */}
      <noscript>
        <div className="sr-only">
          Prime Detailing — Kleious 39 &amp; Aetideon 46, Cholargos 15561 —
          (+30) 693 994 9788
        </div>
      </noscript>

      {/* Snowflakes */}
      <div
        className="
          pointer-events-none absolute inset-0 overflow-hidden z-[5]
          christmas:block hidden
        "
      >
        <div className="snowflake"></div>
        <div className="snowflake"></div>
        <div className="snowflake"></div>
        <div className="snowflake"></div>
        <div className="snowflake"></div>
        <div className="snowflake"></div>
        <div className="snowflake"></div>
        <div className="snowflake"></div>
        <div className="snowflake"></div>
        <div className="snowflake"></div>
      </div>
    </section>
  );
};

export default Hero;
