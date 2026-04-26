import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import ComparisonTable from "@/components/ComparisonTable";
import MobileSwipeComparison from "@/components/MobileSwipeComparison";
import { Droplets, Sparkles, ShieldCheck } from "lucide-react";

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
  const serviceOrder = ["maintenance", "exterior", "full detail", "ultimate"];

  const otherServices = services
    .filter(s => !heroServiceIds.has(s.id))
    .sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      const aIndex = serviceOrder.findIndex(keyword => nameA.includes(keyword));
      const bIndex = serviceOrder.findIndex(keyword => nameB.includes(keyword));
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return nameA.localeCompare(nameB);
    });

  const getHeroTitle = (type: "enhancement" | "correction") => {
    if (type === "enhancement") return "Paint Enhancement & Protection";
    return "Full Paint Correction & Ceramic Coating";
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
    return descriptions[type]?.[i18n.language as "en" | "el"] || descriptions[type]?.en;
  };

  const formatDuration = (minutes: number, lang: string) => {
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
    <section className="min-h-screen text-white flex flex-col">
      <div className="flex-grow py-20 px-4">
        <div className="max-w-6xl mx-auto w-full">

          {/* ================= SECTION: PAINT CORRECTION ================= */}
          <div className="mb-12 text-center">
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4">
              Paint Correction
            </h2>
            <p className="text-zinc-500 uppercase tracking-widest text-sm font-bold">
              Restoration & Surface Protection
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
            {[
              { data: paintEnhancement, type: "enhancement" as const },
              { data: fullCorrection, type: "correction" as const, popular: true }
            ].map((item) => (
              item.data && (
                <div key={item.data.id} className="relative bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 transition-all hover:border-zinc-500">
                  {item.popular && (
                    <div className="absolute -top-3 right-8 bg-white text-black text-[10px] font-black uppercase tracking-tighter px-3 py-1 rounded-sm">
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-2xl font-black uppercase tracking-tight mb-4 leading-none">
                    {getHeroTitle(item.type)}
                  </h3>
                  <p className="text-zinc-400 mb-8 min-h-[60px] leading-relaxed">
                    {getServiceDescription(item.type)}
                  </p>
                  <Button asChild className="w-full bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-tighter h-14">
                    <Link to="/paint-correction-booking">
                      {i18n.language === "el" ? "Ζητήστε Προσφορά" : "Request a Quote"}
                    </Link>
                  </Button>
                </div>
              )
            ))}
          </div>

          {/* ================= SECTION: DETAILING ================= */}
          <div className="mb-12 text-center">
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4">
              Detailing Services
            </h2>
            <p className="text-zinc-500 uppercase tracking-widest text-sm font-bold">
              Professional Cabin & Exterior Care
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
            {otherServices.map((service) => (
              <div key={service.id} className="bg-zinc-900/40 border border-zinc-800 rounded-3xl overflow-hidden flex flex-col">
                <div className="p-8 flex-grow">
                  <h3 className="text-2xl font-black uppercase tracking-tight mb-2">
                    {service.name}
                  </h3>
                  <div className="flex items-center gap-2 text-zinc-400 font-bold uppercase text-xs tracking-widest">
                    <span className="text-white">
                      {i18n.language === "el" ? "Από" : "From"} {service.base_price}€
                    </span>
                    <span className="text-zinc-800">|</span>
                    <span>{formatDuration(service.duration_min, i18n.language)}</span>
                  </div>
                </div>
                <div className="flex border-t border-zinc-800 p-6 gap-3 bg-zinc-900/20">
                  <Button asChild className="flex-1 bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-tighter">
                    <Link to={`/booking?service=${service.id}`}>{t("servicesNew.book")}</Link>
                  </Button>
                  <Button asChild variant="outline" className="flex-1 border-zinc-700 font-black uppercase tracking-tighter hover:bg-zinc-800">
                    <a href="#comparison-table">{t("servicesNew.details")}</a>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* ================= COMPARISON ================= */}
          <div id="comparison-table" className="mt-16 scroll-mt-24">
            <div className="md:hidden mb-4">
              <div className="text-center text-[10px] uppercase font-black tracking-widest text-zinc-500 mb-2">
                Swipe to compare
              </div>
              <MobileSwipeComparison />
            </div>
            <div className="hidden md:block">
              <ComparisonTable />
            </div>
          </div>

          {/* ================= CTA ================= */}
          <div className="mt-24 p-12 rounded-3xl bg-zinc-900/40 border border-zinc-800 text-center">
            <ShieldCheck className="mx-auto mb-6 text-white" size={48} />
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-4">
              {i18n.language === "el" ? "Δεν είσαι σίγουρος;" : "Not Sure What To Pick?"}
            </h2>
            <p className="text-zinc-400 mb-8 max-w-xl mx-auto font-medium">
              {i18n.language === "el" 
                ? "Επικοινώνησε μαζί μας και θα σου προτείνουμε την ιδανική υπηρεσία για το όχημα σου."
                : "Contact us for a free consultation and we'll recommend the perfect service for your vehicle."}
            </p>
            <Button asChild variant="outline" className="border-zinc-800 h-14 px-10 font-black uppercase tracking-tighter hover:bg-zinc-900">
              <a href="tel:+306939949788">
                {i18n.language === "el" ? "Καλέστε στο (+30) 693 994 9788" : "Call (+30) 693 994 9788"}
              </a>
            </Button>
          </div>

        </div>
      </div>
      <Footer />
    </section>
  );
};

export default Services;