import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Car,
  Shield,
  Palette,
  Sparkles,
  Droplets,
  Crown,
  Settings,
  Wrench,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

type ServiceId = "basicWash" | "fullDetail" | "paintCorrection";

type ServiceDef = {
  id: ServiceId;
  icon: any;
  priceFrom?: number;
  durationLabelKey?: string; // e.g. "1-2"
};

const serviceDefs: ServiceDef[] = [
  { id: "basicWash", icon: Droplets, priceFrom: 20, durationLabelKey: "1-2" },
  { id: "fullDetail", icon: Car, priceFrom: 40, durationLabelKey: "3-6" },
  {
    id: "paintCorrection",
    icon: Palette,
    priceFrom: 100,
    durationLabelKey: "6-8",
  },
];

// Fallback copy if i18n keys are missing
const serviceCopyFallback: Record<
  ServiceId,
  { title: string; description: string; features: string[] }
> = {
  basicWash: {
    title: "Basic Exterior & Interior Wash",
    description:
      "Maintenance wash for a clean look without decontamination or deep interior extraction.",
    features: [
      "Contactless pre-wash & safe contact hand wash",
      "Wheels & tires cleaned and dressed",
      "Streak-free exterior glass cleaning",
      "Quick interior surface wipe-down",
      "Floors vacuumed",
      "No clay bar / no tar or sap removal",
      "No deep carpet/seat extraction",
    ],
  },
  fullDetail: {
    title: "Full Exterior & Interior Detail",
    description:
      "Deep clean and decontamination inside & out, resetting the car’s look and feel.",
    features: [
      "Contactless pre-wash & safe contact hand wash",
      "Clay bar decontamination + tar/sap removal",
      "Wheels & tires deep cleaned and dressed",
      "Crystal-clear glass (inside & out)",
      "Full interior vacuum (including carpets)",
      "Specialized carpet cleaning for stubborn dirt",
      "Air vents, plastics & trims cleaned with UV protection",
      "Leather surfaces cleaned & conditioned",
      "Fabric seats deep cleaned with extraction machine (wet-vac) where needed",
    ],
  },
  paintCorrection: {
    title: "Paint Correction",
    description:
      "Machine polishing to remove swirls/light scratches and restore depth and clarity. Ideal prep before long-term coatings.",
    features: [
      "Contactless pre-wash & safe contact hand wash",
      "Full decontamination: clay bar + tar/sap removal",
      "Multi-stage machine polishing tailored to paint condition",
      "Improves gloss, clarity and color depth",
      "Panel wipe to prepare for protection",
      "Recommended: add a sealant or ceramic for long-term lock-in",
    ],
  },
};

// ---- Add-ons driven by i18n ----
type AddonId =
  | "sprayWax"
  | "premiumWax"
  | "ceramicSpray"
  | "nanoSealant"
  | "proCeramic"
  | "engineBay";

type AddonDef = { id: AddonId; icon: any; priceFrom?: number };

// Placeholder prices — adjust anytime
const addonDefs: AddonDef[] = [
  { id: "sprayWax", icon: Droplets, priceFrom: 15 },
  { id: "premiumWax", icon: Palette, priceFrom: 30 },
  { id: "ceramicSpray", icon: Settings, priceFrom: 50 },
  { id: "nanoSealant", icon: Shield, priceFrom: 120 },
  { id: "proCeramic", icon: Crown, priceFrom: 300 },
  { id: "engineBay", icon: Wrench, priceFrom: 40 },
];

const Services = () => {
  const { t } = useTranslation();

  return (
    <section id="services" className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Services */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            {t("services.title.prefix", "Our")}{" "}
            <span className="bg-gold-gradient bg-clip-text text-transparent">
              {t("services.title.accent", "Services")}
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t(
              "services.subtitle",
              "Choose your core detailing package, then add the protection that suits your goals."
            )}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-8">
          {serviceDefs.map((svc, index) => {
            const IconComponent = svc.icon;

            const title =
              t(`services.items.${svc.id}.title`) ||
              serviceCopyFallback[svc.id].title;
            const description =
              t(`services.items.${svc.id}.description`) ||
              serviceCopyFallback[svc.id].description;

            let features =
              (t(`services.items.${svc.id}.features`, {
                returnObjects: true,
              }) as unknown as string[]) ||
              serviceCopyFallback[svc.id].features;

            if (!Array.isArray(features)) {
              features = serviceCopyFallback[svc.id].features;
            }

            return (
              <Card
                key={svc.id}
                className="w-full md:w-[45%] lg:w-[30%] bg-card border-border hover:bg-card-hover transition-all duration-300 hover:shadow-elegant group animate-slide-up flex flex-col"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-gold-gradient rounded-full flex items-center justify-center mx-auto mb-4 group-hover:animate-glow-pulse">
                    <IconComponent className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-foreground">
                    {title}
                  </CardTitle>
                  <CardDescription className="text-lg text-muted-foreground">
                    {description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6 flex flex-col flex-grow">
                  {svc.priceFrom && svc.durationLabelKey && (
                    <div className="flex justify-between items-center text-center">
                      <div>
                        <p className="text-3xl font-bold bg-gold-gradient bg-clip-text text-transparent">
                          {t("services.fromPrice", {
                            price: `${svc.priceFrom}€`,
                          })}
                        </p>
                        <p className="text-sm text-white">
                          {t("services.labels.startingPrice", "Starting price")}
                        </p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-foreground">
                          {t("services.durationHours", {
                            hours: svc.durationLabelKey,
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t("services.labels.duration", "Estimated hours")}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 flex-grow">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      {t("services.whatsIncluded", "What’s included")}
                    </h4>
                    <ul className="space-y-1">
                      {features.map((feature, idx) => (
                        <li
                          key={idx}
                          className="text-muted-foreground flex gap-2"
                        >
                          <span className="relative mt-1.5 flex-shrink-0 w-1.5 h-1.5 bg-primary rounded-full" />
                          <span className="flex-1">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-auto">
                    <NavLink to={`/booking?serviceId=${svc.id}`}>
                      <Button variant="hero" className="w-full">
                        {t("services.bookThis", "Book this")}
                      </Button>
                    </NavLink>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Protection Options (Add-ons) from i18n */}
        <div className="text-center mt-20 mb-12">
          <h3 className="text-3xl font-bold">
            {t("services.items.addons.title", "Protection Options")}
          </h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t(
              "services.items.addons.subtitle",
              "Enhance longevity and gloss with waxes, nano-sealant, or ceramic coating."
            )}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-8">
          {addonDefs.map((addon, index) => {
            const IconComponent = addon.icon;

            const title =
              t(`services.items.addons.items.${addon.id}.title`) ||
              (
                {
                  sprayWax: "Spray Wax Protection",
                  premiumWax: "Premium Wax Protection",
                  ceramicSpray: "Ceramic Spray Protection (SiO₂)",
                  nanoSealant: "Nano Sealant Protection",
                  proCeramic: "Professional Ceramic Coating (SiO₂)",
                  engineBay: "Engine Bay Cleaning",
                } as Record<AddonId, string>
              )[addon.id];

            let features =
              (t(`services.items.addons.items.${addon.id}.features`, {
                returnObjects: true,
              }) as unknown as string[]) || [];

            if (!Array.isArray(features) || features.length === 0) {
              const fallback: Record<AddonId, string[]> = {
                sprayWax: [
                  "Fast polymer wax application for instant gloss",
                  "Hydrophobic layer: water beads and rolls off",
                  "Durability: ~4–6 weeks • Reapply monthly",
                ],
                premiumWax: [
                  "Carnauba + polymer blend for warm, deep shine",
                  "Strong hydrophobics; easier washing",
                  "Durability: ~2–3 months • Reapply every 2–3 months",
                ],
                ceramicSpray: [
                  "SiO₂ ceramic spray for paint & plastics",
                  "Slick finish; strong sheeting",
                  "Durability: ~3–4 months • Reapply quarterly",
                ],
                nanoSealant: [
                  "Polymer nano sealant bonds to paint",
                  "Deep gloss, UV/chemical resistance",
                  "Durability: up to ~12 months • Reapply annually",
                ],
                proCeramic: [
                  "High-end SiO₂ ceramic, semi-permanent layer",
                  "Extreme hydrophobics; maximum gloss",
                  "Durability: 2+ years • Reapply 24–30 months",
                ],
                engineBay: [
                  "Degrease & clean engine bay surfaces",
                  "Safe rinse and careful drying",
                  "Plastic trims dressed for a fresh look",
                  "Helps spot fluid leaks and keep the bay tidy",
                ],
              };
              features = fallback[addon.id];
            }

            return (
              <Card
                key={addon.id}
                className="w-full md:w-[45%] lg:w-[30%] bg-card border-border hover:bg-card-hover transition-all duration-300 hover:shadow-elegant group animate-slide-up flex flex-col"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-gold-gradient rounded-full flex items-center justify-center mx-auto mb-4 group-hover:animate-glow-pulse">
                    <IconComponent className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-xl font-bold text-foreground">
                    {title}
                  </CardTitle>
                  {typeof addon.priceFrom === "number" && (
                    <p className="mt-2 text-2xl font-bold bg-gold-gradient bg-clip-text text-transparent">
                      {t("services.fromPrice", {
                        price: `${addon.priceFrom}€`,
                      })}
                    </p>
                  )}
                </CardHeader>

                <CardContent className="space-y-6 flex flex-col flex-grow">
                  <div className="space-y-2 flex-grow">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      {t("services.whatsIncluded", "What’s included")}
                    </h4>
                    <ul className="space-y-1">
                      {features.map((feature, idx) => (
                        <li
                          key={idx}
                          className="text-muted-foreground flex gap-2"
                        >
                          <span className="relative mt-1.5 flex-shrink-0 w-1.5 h-1.5 bg-primary rounded-full" />
                          <span className="flex-1">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-auto">
                    <NavLink to={`/booking?addonId=${addon.id}`}>
                      <Button variant="secondary" className="w-full">
                        {t("services.bookThis", "Add to booking")}
                      </Button>
                    </NavLink>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Services;
