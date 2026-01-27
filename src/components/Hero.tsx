import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import hat from "../assets/icons/santa-hat.png";
import hero from "../assets/icons/hero.png";

const Hero = () => {
  const { t } = useTranslation();

  return (
    <section
      className="
        relative
        min-h-[calc(100svh-4rem)] md:min-h-[calc(100vh-4rem)]
        flex items-center justify-center
        overflow-hidden
      "
      aria-label={t("hero.sectionLabel", "Prime Detailing hero")}
    >
      {/* Background */}
      <div className="absolute inset-0 h-full w-full overflow-hidden">
        <img
          src={hero}
          alt=""
          className="
            absolute inset-0 h-full w-full object-cover
            opacity-20 -scale-x-100
            object-center sm:object-right
            translate-x-0 sm:translate-x-24
          "
        />

        {/* Left-to-right fade to pure black on the left (stronger on mobile) */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-black via-black/90 sm:via-black/80 to-transparent"
          aria-hidden="true"
        />

        {/* Vertical mood overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-zinc-950/70 via-zinc-950/40 to-zinc-900/60"
          aria-hidden="true"
        />
      </div>

      {/* Content */}
      <div
        className="
          relative z-10 w-full max-w-6xl mx-auto
          px-5 sm:px-6 lg:px-8
          flex items-center justify-center md:justify-start
          animate-fade-in
        "
      >
        <div className="text-center md:text-left max-w-xl sm:max-w-2xl">
          {/* Small text (top) */}
          <p className="text-sm sm:text-base md:text-lg text-zinc-200/90 font-light tracking-wide mb-3 ml-1">
            Detailing in Cholargos
          </p>

          {/* Headline */}
          <h1
            className="
              text-5xl sm:text-6xl md:text-7xl lg:text-8xl
              font-extrabold tracking-tight text-zinc-100
              leading-[1.02] sm:leading-[0.98]
              mb-8 sm:mb-10
            "
          >
            Perfection in
            <br />
            <span className="text-secondary">Every Detail</span>
            {/* Optional santa hat */}
            <span className="relative inline-block align-top ml-2">
              <img
                src={hat}
                alt=""
                style={{ transform: "scaleX(-1)" }}
                className="
                  hidden christmas:block
                  absolute
                  -top-5 -left-5 sm:-top-6 sm:-left-6
                  pointer-events-none select-none
                  w-12 sm:w-16 md:w-20
                "
              />
            </span>
          </h1>

          {/* CTAs */}
          <div
            className="
              flex flex-col sm:flex-row gap-3 sm:gap-4
              justify-center md:justify-start
              items-stretch sm:items-center md:items-start
              animate-slide-up
            "
          >
            <Button
              asChild
              variant="hero"
              size="lg"
              className="
                rounded-3xl text-base sm:text-lg
                px-12 py-3 h-auto
                hover:bg-secondary-hover bg-secondary text-black
                w-full sm:w-auto
              "
            >
              <Link
                to="/booking"
                aria-label={t(
                  "hero.cta.contactAria",
                  "Contact Prime Detailing to book",
                )}
                className="w-full"
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
                hover:bg-zinc-800 hover:text-zinc-200
                rounded-3xl
                px-12 py-3 h-auto text-base sm:text-lg
                w-full sm:w-auto
              "
            >
              <Link
                to="/services"
                aria-label={t(
                  "hero.cta.servicesAria",
                  "View detailing services in Athens",
                )}
                className="w-full"
              >
                {t("hero.btn.services", "View Services")}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator — hide on small screens */}
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

      {/* NoScript fallback */}
      <noscript>
        <div className="sr-only">
          Prime Detailing — Kleious 39 &amp; Aetideon 46, Cholargos 15561 —
          (+30) 693 994 9788
        </div>
      </noscript>

      {/* Snowflakes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-[5] christmas:block hidden">
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
