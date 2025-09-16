import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useTranslation } from "react-i18next";
// import heroImage from "@/assets/hero-car-detailing.jpg";

const Hero = () => {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Language Switcher (top-right) */}
      <div className="absolute right-4 top-4 md:right-8 md:top-8 z-50">
        <LanguageSwitcher />
      </div>

      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        // style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-hero-gradient opacity-80"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto animate-fade-in">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
          <span className="text-foreground">{t("hero.title.prime")}</span>
          <span className="bg-gold-gradient bg-clip-text text-transparent ml-4">
            {t("hero.title.detailing")}
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed max-w-2xl mx-auto">
          {t("hero.tagline")}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up">
          <Button
            variant="hero"
            size="lg"
            className="text-lg px-8 py-6 h-auto"
            onClick={() =>
              document
                .getElementById("booking")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            {t("hero.btn.book")}
          </Button>
          <Button
            variant="premium"
            size="lg"
            className="text-lg px-8 py-6 h-auto"
            onClick={() =>
              document
                .getElementById("services")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            {t("hero.btn.services")}
          </Button>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 rounded-full flex justify-center border-[#99CCFF]">
          <div className="w-1 h-3 rounded-full mt-2 animate-pulse bg-[#99CCFF]"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
