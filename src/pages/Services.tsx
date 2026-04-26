import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import ComparisonTable from "@/components/ComparisonTable";
import MobileSwipeComparison from "@/components/MobileSwipeComparison";

interface Service {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  duration_min: number;
  active: boolean;
}

const Services = () => {
  const { t, i18n } = useTranslation();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data, error } = await supabase
          .from("service")
          .select("*")
          .eq("active", true);

        if (error) throw error;
        setServices(data || []);
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  // ================= HERO SERVICES =================
  const paintEnhancement = services.find(s =>
    s.name.toLowerCase().includes("βελτίωση") ||
    s.name.toLowerCase().includes("enhancement")
  );

  const fullCorrection = services.find(s =>
    s.name.toLowerCase().includes("ολική") ||
    s.name.toLowerCase().includes("correction")
  );

  const heroServiceIds = new Set([
    paintEnhancement?.id,
    fullCorrection?.id,
  ]);

  // ================= CUSTOM ORDERING =================
  const serviceOrder = [
    "maintenance wash",
    "exterior",
    "full",
    "ultimate",
  ];

  const otherServices = services
    .filter(s => !heroServiceIds.has(s.id))
    .sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();

      const aIndex = serviceOrder.findIndex(keyword => nameA.includes(keyword));
      const bIndex = serviceOrder.findIndex(keyword => nameB.includes(keyword));

      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }

      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;

      return nameA.localeCompare(nameB);
    });

  // ================= HELPERS =================
  const getDetailsLink = (service: Service) => {
    const name = service.name.toLowerCase();

    if (name.includes("maintenance")) return "/maintenance-wash";
    if (name.includes("full")) return "/full-detail";
    if (name.includes("ultimate")) return "/ultimate-detail";

    return "/services";
  };

  const getHeroTitle = (type: "enhancement" | "correction") => {
    if (type === "enhancement") {
      return i18n.language === "el"
        ? "Paint Enhancement & Protection"
        : "Paint Enhancement & Protection";
    }
    return i18n.language === "el"
      ? "Full Paint Correction & Ceramic Coating"
      : "Full Paint Correction & Ceramic Coating";
  };

  const getServiceDescription = (type: "enhancement" | "correction") => {
    const descriptions = {
      enhancement: {
        en: "A light polishing process that removes minor imperfections and restores gloss, leaving your paint looking fresh and well-protected.",
        el: "Ήπια διαδικασία γυαλίσματος που αφαιρεί μικρές ατέλειες και επαναφέρει τη γυαλάδα, αφήνοντας το χρώμα φρέσκο και προστατευμένο."
      },
      correction: {
        en: "Multi-stage machine polishing that removes swirl marks, scratches for a deep, flawless finish, followed by long-lasting professional ceramic coating.",
        el: "Πολυσταδιακό γυάλισμα που αφαιρεί γρατζουνιές, θαμπάδες και ολογράμματα, προσφέροντας άψογο φινίρισμα και προστασία με επαγγελματική κεραμική επίστρωση."
      }
    };

    return descriptions[type]?.[i18n.language] || descriptions[type]?.en;
  };

  const formatDuration = (minutes: number, lang: "en" | "el" = "en") => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (lang === "el") {
      if (hrs === 0) return `${mins} λεπ`;
      if (mins === 0) return `${hrs} ώρες`;
      return `${hrs}ώ ${mins}λ`;
    }

    if (hrs === 0) return `${mins} min`;
    if (mins === 0) return `${hrs} hours`;

    return `${hrs}h ${mins}m`;
  };

  return (
    <section className="min-h-screen flex flex-col">
      <div className="flex-grow py-20 px-4">
        <div className="max-w-6xl mx-auto w-full">

          <div className="mb-12 text-center px-2">
            <h2 className="text-3xl font-bold mb-3">Paint Correction Services</h2>
            <p className="text-zinc-400 max-w-xl mx-auto">
              Professional paint restoration & protection services
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">

            {paintEnhancement && (
              <div className="relative bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 transition-all hover:border-zinc-600">
                <h3 className="text-2xl font-bold mb-3">
                  {getHeroTitle("enhancement")}
                </h3>

                <p className="text-zinc-400 mb-6 min-h-[80px]">
                  {getServiceDescription("enhancement")}
                </p>

                <Link
                  to={`/paint-correction-booking`}
                  className="block w-full text-center rounded-lg bg-white text-black py-4 px-6 text-sm font-bold hover:bg-zinc-200 transition"
                >
                  {i18n.language === "el" ? "Ζητήστε Προσφορά" : "Request a Quote"}
                </Link>
              </div>
            )}

            {fullCorrection && (
              <div className="relative bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 transition-all hover:border-zinc-600">

                <div className="absolute -top-3 right-8 bg-blue-500 text-black text-[10px] uppercase tracking-wider font-black px-4 py-1.5 rounded-full shadow-xl z-10">
                  Most Popular
                </div>

                <h3 className="text-2xl font-bold mb-3">
                  {getHeroTitle("correction")}
                </h3>

                <p className="text-zinc-400 mb-6 min-h-[80px]">
                  {getServiceDescription("correction")}
                </p>

                <Link
                  to={`/booking?service=${fullCorrection.id}`}
                  className="block w-full text-center rounded-lg bg-white text-black py-4 px-6 text-sm font-bold hover:bg-zinc-200 transition"
                >
                  {i18n.language === "el" ? "Ζητήστε Προσφορά" : "Request a Quote"}
                </Link>
              </div>
            )}
          </div>

          <div className="mb-12 text-center px-2">
            <h2 className="text-3xl font-bold mb-3">Detailing Services</h2>
            <p className="text-zinc-400 max-w-xl mx-auto">
              Professional cleaning and restoration services
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 mb-14">
            {otherServices.map((service) => (
              <div
                key={service.id}
                className="bg-card border bg-zinc-900/50 border-border rounded-xl w-full max-col md:max-w-[480px] flex flex-col overflow-hidden"
              >
                <div className="p-6 pb-4 text-center md:text-left flex-grow">
                  <h3 className="text-xl font-bold mb-1 break-words">
                    {service.name}
                  </h3>

                  <p className="text-md text-zinc-400 mb-0 mt-4">
                    <span className="font-semibold text-white">
                      {i18n.language === "el" ? "Από" : "From"} {service.base_price}€
                    </span>
                    <span className="mx-2">•</span>
                    {formatDuration(service.duration_min, (i18n.language === "el" ? "el" : "en") as "en" | "el")}
                  </p>
                </div>

                <div className="flex flex-row w-full border-t border-zinc-800 p-6 gap-3">
                  <Link
                    to={`/booking?service=${service.id}`}
                    className="flex-1 flex items-center justify-center rounded-lg bg-white text-black py-3 px-2 text-sm font-semibold hover:bg-zinc-200 transition"
                  >
                    {t("servicesNew.book", "Book Now")}
                  </Link>

                  <Link
                    to={getDetailsLink(service)}
                    className="flex-1 flex items-center justify-center rounded-lg border border-zinc-700 py-3 text-sm text-zinc-300 hover:bg-zinc-800 transition"
                  >
                    {t("servicesNew.details", "More details")}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* <div id="comparison-table" className="mt-16 scroll-mt-24">
            <div className="md:hidden">
              <div className="text-center text-xs text-zinc-200">
                Swipe → to compare packages
              </div>
              <MobileSwipeComparison />
            </div>

            <div className="hidden md:block">
              <ComparisonTable />
            </div>
          </div> */}

          <div className="border-1 border-t border-zinc-750 rounded-xl "/>
          <div className="text-center pt-14 pb-4 px-4">
            <h2 className="text-4xl font-bold mb-4">
              {i18n.language === "el" ? "Δεν είσαι σίγουρος τι να επιλέξεις;" : "Not Sure What You Need?"}
            </h2>

            <p className="text-zinc-400 mb-8 max-w-xl mx-auto leading-relaxed">
              {i18n.language === "el" 
                ? "Επικοινώνησε μαζί μας και θα σου προτείνουμε την ιδανική υπηρεσία για το όχημα σου."
                : "Contact us for a free consultation and we'll recommend the perfect service for your vehicle."}
            </p>

            <div className="flex justify-center">
              <a
                href="tel:+306939949788"
                className="inline-flex items-center justify-center rounded-lg border border-zinc-800 bg-transparent py-3 px-8 text-sm font-medium text-white hover:bg-zinc-900 transition-all gap-2"
              >
                {/* If you have Lucide icons installed, you can use <Phone className="h-4 w-4" /> here */}
                <span>{i18n.language === "el" ? "Καλέστε στο (+30) 693 994 9788" : "Call (+30) 693 994 9788"}</span>
              </a>
            </div>
          </div>

        
        </div>
      </div>

      <Footer />
    </section>
  );
};

export default Services;
