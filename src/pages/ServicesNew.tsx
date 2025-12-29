import ServiceCard from "@/components/ServiceCard";
import { useCallback } from "react";
import Footer from "../components/Footer";
import SeasonalPackage from "@/components/SeasonalPackage";
import ComparisonTable from "@/components/ComparisonTable";
import MobileSwipeComparison from "@/components/MobileSwipeComparison";
import { useTranslation } from "react-i18next";

// ------------------ Component ------------------ //
const ServicesNew = () => {
  const { t } = useTranslation();

  const scrollToComparison = useCallback(() => {
    document
      .getElementById("comparison-table")
      ?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <section id="services" className="min-h-screen flex flex-col">
      <div className="flex-grow py-20 px-4 max-w-6xl mx-auto">
        {/* Header */}
        <div className="max-w-6xl mx-auto mb-14 text-center">
          <h1 className="text-4xl font-bold mb-4">
            {t("servicesNew.heading")}
          </h1>
          <p className="text-zinc-400">{t("servicesNew.subheading")}</p>
        </div>

        {/* Packages Grid */}
        <div
          className="
            grid
            grid-cols-1
            sm:grid-cols-2
            lg:grid-cols-3
            gap-6 sm:gap-8
            max-w-6xl
            mx-auto
          "
        >
          {/* Bronze */}
          <ServiceCard
            title={t("servicesNew.cards.maintenance.title")}
            price={t("servicesNew.cards.maintenance.price")}
            duration={t("servicesNew.cards.maintenance.duration")}
            onMoreDetails={scrollToComparison}
          />

          {/* Silver */}
          <ServiceCard
            title={t("servicesNew.cards.fullDetail.title")}
            price={t("servicesNew.cards.fullDetail.price")}
            duration={t("servicesNew.cards.fullDetail.duration")}
            onMoreDetails={scrollToComparison}
          />

          {/* Gold */}
          <ServiceCard
            title={t("servicesNew.cards.ultimate.title")}
            price={t("servicesNew.cards.ultimate.price")}
            duration={t("servicesNew.cards.ultimate.duration")}
            onMoreDetails={scrollToComparison}
          />
        </div>

        {/* Seasonal Package */}
        <div>
          <SeasonalPackage />
        </div>

        <div id="comparison-table" className="mt-16 scroll-mt-24">
          {/* Mobile */}
          <div className="md:hidden">
            <div className="text-center text-xs text-zinc-200">
              Swipe → to compare packages
            </div>
            <MobileSwipeComparison />
          </div>

          {/* Desktop */}
          <div className="hidden md:block">
            <ComparisonTable />
          </div>
        </div>
      </div>

      <Footer />
    </section>
  );
};

export default ServicesNew;
