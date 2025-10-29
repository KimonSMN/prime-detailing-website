// src/pages/Services.tsx
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
  Wrench,
  Lightbulb,
  Flame,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/* ---------------- Types from DB ---------------- */
type ServiceRow = {
  id: string;
  name: string;
  base_price: number | string | null;
  duration_min: number | null; // shown on Services page
  active: boolean | null;
};

type AddonRow = {
  id: string;
  slug: string | null; // use for icon & mapping
  name: string;
  base_price: number | string | null;
  duration_min: number | null;
  active: boolean | null;
};

/* ---------------- Local service ids used by i18n ---------------- */
type ServiceId = "basicWash" | "fullDetail" | "paintCorrection";

const FULL_DETAIL_SUGGESTED_ADDON_SLUG = "sprayWax";

/* Fallback copy if i18n keys are missing */
const serviceCopyFallback: Record<
  ServiceId,
  { title: string; description: string; features: string[]; defaultIcon: any }
> = {
  basicWash: {
    title: "Maintenance wash",
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
    defaultIcon: Droplets,
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
    defaultIcon: Car,
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
    defaultIcon: Palette,
  },
};

/* Map DB services by fuzzy name → our i18n service ids */
function mapServiceIdByName(name: string): ServiceId | null {
  const n = name.toLowerCase();
  if (/(basic).*(wash)/i.test(name) || n.includes("basic")) return "basicWash";
  if (/(full).*(detail)/i.test(name) || n.includes("interior detail"))
    return "fullDetail";
  if (n.includes("paint correction")) return "paintCorrection";
  return null;
}

/* Add-on icon by slug */
function addonIconBySlug(slug?: string | null) {
  switch (slug) {
    case "sprayWax":
      return Droplets;
    case "premiumWax":
      return Palette;
    case "nanoSealant":
      return Shield;
    case "proCeramic":
      return Crown;
    case "pickupDropoff":
      return Car;
    case "engineBay":
      return Wrench;
    case "headlightRestoration":
      return Lightbulb;
    default:
      return Sparkles;
  }
}

/* Format minutes to hours (compact) */
function minutesToHoursLabel(min?: number | null) {
  if (!min || min <= 0) return "";
  const hours = Math.round((Number(min) / 60) * 10) / 10;
  const pretty = Number.isInteger(hours) ? `${hours}` : `${hours}`;
  return `${pretty}`;
}

/* --- NEW: grouping for add-ons --- */
const PROTECTION_SLUGS = new Set([
  "sprayWax",
  "premiumWax",
  "nanoSealant",
  "proCeramic",
]);

const EXTRA_ADDON_SLUGS = new Set([
  "pickupDropoff",
  "engineBay",
  "headlightRestoration", // headlight polishing/restoration
]);

const Services = () => {
  const { t } = useTranslation();

  const [dbServices, setDbServices] = useState<ServiceRow[]>([]);
  const [dbAddons, setDbAddons] = useState<AddonRow[]>([]);
  const [loading, setLoading] = useState(true);

  /* Load dynamic prices/durations from Supabase */
  useEffect(() => {
    (async () => {
      setLoading(true);
      const [srv, add] = await Promise.all([
        supabase
          .from("service")
          .select("id,name,base_price,duration_min,active")
          .eq("active", true)
          .order("name"),
        supabase
          .from("addon")
          .select("id,slug,name,base_price,duration_min,active")
          .eq("active", true)
          .order("name"),
      ]);
      if (!srv.error) setDbServices(srv.data ?? []);
      if (!add.error) setDbAddons(add.data ?? []);
      setLoading(false);
    })();
  }, []);

  /* Build a map of dynamic price/duration for our three services */
  const dynamicServices = useMemo(() => {
    const base: Record<
      ServiceId,
      { id: ServiceId; priceFrom?: number; durationMin?: number; icon: any }
    > = {
      basicWash: {
        id: "basicWash",
        icon: serviceCopyFallback.basicWash.defaultIcon,
      },
      fullDetail: {
        id: "fullDetail",
        icon: serviceCopyFallback.fullDetail.defaultIcon,
      },
      paintCorrection: {
        id: "paintCorrection",
        icon: serviceCopyFallback.paintCorrection.defaultIcon,
      },
    };

    for (const s of dbServices) {
      const mapped = mapServiceIdByName(s.name);
      if (mapped) {
        base[mapped].priceFrom =
          s.base_price == null ? undefined : Number(s.base_price);
        base[mapped].durationMin =
          s.duration_min == null ? undefined : Number(s.duration_min);
      }
    }
    return base;
  }, [dbServices]);

  /* Add-ons from DB → with icon, i18n title/features — SORTED BY PRICE ASC */
  const addonCards = useMemo(() => {
    const arr = dbAddons.map((a) => {
      const Icon = addonIconBySlug(a.slug ?? undefined);
      const keyFromSlug =
        a.slug && `services.items.addons.items.${a.slug}.title`;
      const title =
        (keyFromSlug && t(keyFromSlug)) ||
        a.name ||
        t("services.items.addons.title", "Protection Options");

      const features =
        (a.slug &&
          (t(`services.items.addons.items.${a.slug}.features`, {
            returnObjects: true,
          }) as unknown as string[])) ||
        [];

      const priceFrom =
        a.base_price == null
          ? undefined
          : Number.parseFloat(String(a.base_price));

      return {
        id: a.id,
        slug: a.slug,
        title,
        features,
        priceFrom,
        durationMin:
          a.duration_min == null ? undefined : Number(a.duration_min),
        Icon,
      };
    });

    // sort by price ascending (null/undefined -> last), name tiebreaker
    arr.sort((a, b) => {
      const ap = a.priceFrom ?? Number.POSITIVE_INFINITY;
      const bp = b.priceFrom ?? Number.POSITIVE_INFINITY;
      if (ap !== bp) return ap - bp;
      return (a.title || "").localeCompare(b.title || "");
    });

    return arr;
  }, [dbAddons, t]);

  /* --- split into two groups --- */
  const protectionAddons = useMemo(
    () => addonCards.filter((a) => PROTECTION_SLUGS.has(a.slug ?? "")),
    [addonCards]
  );
  const extraAddons = useMemo(
    () => addonCards.filter((a) => EXTRA_ADDON_SLUGS.has(a.slug ?? "")),
    [addonCards]
  );

  if (loading) {
    return (
      <section id="services" className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center opacity-70">
          {t("common.loading", "Loading...")}
        </div>
      </section>
    );
  }

  return (
    <section id="services" className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* ---------- 1) SERVICES (kept first) ---------- */}
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
          {(Object.keys(serviceCopyFallback) as ServiceId[]).map(
            (svcId, index) => {
              const copy = serviceCopyFallback[svcId];
              const dyn = dynamicServices[svcId];
              const IconComponent = dyn.icon || Sparkles;

              const title = t(`services.items.${svcId}.title`) || copy.title;
              const description =
                t(`services.items.${svcId}.description`) || copy.description;

              let features =
                (t(`services.items.${svcId}.features`, {
                  returnObjects: true,
                }) as unknown as string[]) || copy.features;
              if (!Array.isArray(features) || features.length === 0) {
                features = copy.features;
              }

              const priceFrom = dyn.priceFrom;
              const durationH = dyn.durationMin
                ? minutesToHoursLabel(dyn.durationMin)
                : undefined;

              return (
                <Card
                  key={svcId}
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
                    {(priceFrom != null || durationH) && (
                      <div className="flex justify-between items-center text-center">
                        <div>
                          {priceFrom != null && (
                            <>
                              <p className="text-3xl font-bold bg-gold-gradient bg-clip-text text-transparent">
                                {t("services.fromPrice", {
                                  price: `${priceFrom}€`,
                                })}
                              </p>
                              <p className="text-sm text-white">
                                {t(
                                  "services.labels.startingPrice",
                                  "Starting price"
                                )}
                              </p>
                            </>
                          )}
                        </div>
                        <div>
                          {durationH && (
                            <>
                              <p className="text-lg font-semibold text-foreground">
                                {t("services.durationHours", {
                                  hours: durationH,
                                })}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {t(
                                  "services.labels.duration",
                                  "Estimated hours"
                                )}
                              </p>
                            </>
                          )}
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
                      <NavLink to={`/booking?serviceId=${svcId}`}>
                        <Button variant="hero" className="w-full">
                          {t("services.bookThis", "Book this")}
                        </Button>
                      </NavLink>
                    </div>
                  </CardContent>
                </Card>
              );
            }
          )}
        </div>

        {/* ---------- 2) PROTECTION OPTIONS ---------- */}
        {protectionAddons.length > 0 && (
          <>
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
              {protectionAddons.map((addon, index) => {
                const TitleIcon = addon.Icon;
                const durationH = addon.durationMin
                  ? minutesToHoursLabel(addon.durationMin)
                  : undefined;

                const features =
                  addon.features && addon.features.length > 0
                    ? addon.features
                    : [
                        t("services.addon.quickApply", "Quick application"),
                        t(
                          "services.addon.hydrophobic",
                          "Improves hydrophobic performance"
                        ),
                      ];

                return (
                  <Card
                    key={addon.id}
                    className={`relative overflow-hidden w-full md:w-[45%] lg:w-[30%] bg-card border-border hover:bg-card-hover transition-all duration-300 hover:shadow-elegant group animate-slide-up flex flex-col
                    ${
                      addon.slug === FULL_DETAIL_SUGGESTED_ADDON_SLUG
                        ? "animate-flameBurst"
                        : ""
                    }`}
                    style={{ animationDelay: `${index * 0.15}s` }}
                  >
                    <CardHeader className="text-center pb-4">
                      <div className="w-16 h-16 bg-gold-gradient rounded-full flex items-center justify-center mx-auto mb-4 group-hover:animate-glow-pulse">
                        <TitleIcon className="w-8 h-8 text-primary-foreground" />
                      </div>

                      <CardTitle className="text-xl font-bold text-foreground">
                        {addon.title}
                      </CardTitle>

                      {addon.slug === FULL_DETAIL_SUGGESTED_ADDON_SLUG && (
                        <div className="absolute top-3 right-3 z-20 pointer-events-none">
                          <div
                            className="flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-semibold px-3 py-1 shadow-md
                            transform rotate-6"
                          >
                            <Flame className="w-3.5 h-3.5" />
                            <span>
                              {t(
                                "services.socialProof.popular",
                                "Popular among clients"
                              )}
                            </span>
                          </div>
                        </div>
                      )}

                      {(addon.priceFrom != null || durationH) && (
                        <div className="mt-3 flex items-center justify-center gap-4">
                          {addon.priceFrom != null && (
                            <p className="text-3xl font-bold bg-gold-gradient bg-clip-text text-transparent">
                              {t("services.fromPrice", {
                                price: `${addon.priceFrom}€`,
                              })}
                            </p>
                          )}
                          {durationH && (
                            <p className="text-sm text-muted-foreground">
                              {t("services.durationHours", {
                                hours: durationH,
                              })}
                            </p>
                          )}
                        </div>
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
                        <NavLink
                          to={`/booking?${
                            addon.slug
                              ? `addonSlug=${addon.slug}`
                              : `addonId=${addon.id}`
                          }`}
                        >
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
          </>
        )}

        {/* ---------- 3) ADD-ONS  ---------- */}
        {extraAddons.length > 0 && (
          <>
            <div className="text-center mt-20 mb-12">
              <h3 className="text-3xl font-bold">
                {t("services.extras.title")}
              </h3>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t("services.extras.subtitle")}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-8">
              {extraAddons.map((addon, index) => {
                const TitleIcon = addon.Icon;
                const durationH = addon.durationMin
                  ? minutesToHoursLabel(addon.durationMin)
                  : undefined;

                const fallbackFeatures =
                  addon.slug === "engineBay"
                    ? [
                        t("services.addon.degrease", "Degrease & rinse"),
                        t(
                          "services.addon.dressPlastics",
                          "Dress engine plastics"
                        ),
                      ]
                    : [
                        t(
                          "services.addon.restoreClarity",
                          "Restore lens clarity"
                        ),
                        t(
                          "services.addon.uvProtection",
                          "UV protection applied"
                        ),
                      ];

                const features =
                  addon.features && addon.features.length > 0
                    ? addon.features
                    : fallbackFeatures;

                return (
                  <Card
                    key={addon.id}
                    className="relative overflow-hidden w-full md:w-[45%] lg:w-[30%] bg-card border-border hover:bg-card-hover transition-all duration-300 hover:shadow-elegant group animate-slide-up flex flex-col"
                    style={{ animationDelay: `${index * 0.15}s` }}
                  >
                    <CardHeader className="text-center pb-4">
                      <div className="w-16 h-16 bg-gold-gradient rounded-full flex items-center justify-center mx-auto mb-4 group-hover:animate-glow-pulse">
                        <TitleIcon className="w-8 h-8 text-primary-foreground" />
                      </div>

                      <CardTitle className="text-xl font-bold text-foreground">
                        {addon.title}
                      </CardTitle>

                      {(addon.priceFrom != null || durationH) && (
                        <div className="mt-3 flex items-center justify-center gap-4">
                          {addon.priceFrom != null && (
                            <p className="text-3xl font-bold bg-gold-gradient bg-clip-text text-transparent">
                              {t("services.fromPrice", {
                                price: `${addon.priceFrom}€`,
                              })}
                            </p>
                          )}
                          {durationH && (
                            <p className="text-sm text-muted-foreground">
                              {t("services.durationHours", {
                                hours: durationH,
                              })}
                            </p>
                          )}
                        </div>
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
                        <NavLink
                          to={`/booking?${
                            addon.slug
                              ? `addonSlug=${addon.slug}`
                              : `addonId=${addon.id}`
                          }`}
                        >
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
          </>
        )}
      </div>
    </section>
  );
};

export default Services;
