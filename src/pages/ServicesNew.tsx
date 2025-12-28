import ServiceCard from "@/components/ServiceCard";
import { useEffect, useMemo, useState } from "react";
import Footer from "../components/Footer";
import SeasonalPackage from "@/components/SeasonalPackage";
import ComparisonTable from "@/components/ComparisonTable";
import MobileSwipeComparison from "@/components/MobileSwipeComparison";

// ------------------ Component ------------------ //
const ServicesNew = () => {
  const scrollToComparison = () => {
    document
      .getElementById("comparison-table")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="services" className="min-h-screen flex flex-col">
      <div className="flex-grow py-20 px-4 max-w-6xl mx-auto">
        {/* Header */}
        <div className="max-w-6xl mx-auto mb-14 text-center">
          <h1 className="text-4xl font-bold mb-4">Detailing Packages</h1>
          <p className="text-zinc-400">Clear pricing. Honest work.</p>
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
          {" "}
          {/* Bronze */}
          <ServiceCard
            title="Maintenance Wash"
            price="From 30$"
            duration="~2h"
            onMoreDetails={scrollToComparison}
            // features={[
            //   "Contactless pre-wash & hand wash",
            //   "Wheel faces & tires cleaned and dressed",
            //   "Glass cleaning",
            //   "Quick interior wipe-down & floor vacuum",
            // ]}
            // exclusions={[
            //   "No tar / sap removal",
            //   "No fabric extraction",
            //   "No specialized carpet cleaning",
            // ]}
          />
          {/* Silver */}
          <ServiceCard
            title="Full Exterior & Interior Detail"
            price="From 50$"
            duration="~4h"
            onMoreDetails={scrollToComparison}
            // features={[
            //   "Everything in Bronze",
            //   "Deep wheel & barrel cleaning",
            //   "Tar / sap removal",
            //   "Full vacuum & carpet deep cleaning",
            //   "Interior shampoo & surface cleaning",
            //   "Door jambs & trunk crevices cleaning",
            //   "Leather cleaning",
            // ]}
          />
          {/* Gold */}
          <ServiceCard
            title="Ultimate Detail"
            price="From 60$"
            duration="~5h"
            onMoreDetails={scrollToComparison}
            // features={[
            //   "Everything in Silver",
            //   "Leather Conditioning (Koch Leather-Star)",
            //   "Exterior plastics protection (Koch PSS)",
            //   "Interior plastics protection (Koch Top-Star)",
            //   "Protection wax for the Exterior (Koch PW)",
            // ]}
          />
        </div>
        {/* Seasonal Package */}
        <div>
          <SeasonalPackage />
        </div>

        <div id="comparison-table" className="mt-16">
          {/* Mobile */}
          <div className="md:hidden">
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
