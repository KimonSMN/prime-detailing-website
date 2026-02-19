import ServiceCard from "@/components/ServiceCard";
import ServiceTileCard from "@/components/ServiceTileCard";

import { useCallback, useEffect, useMemo, useState } from "react";
import Footer from "../components/Footer";
import SeasonalPackage from "@/components/SeasonalPackage";
import ComparisonTable from "@/components/ComparisonTable";
import MobileSwipeComparison from "@/components/MobileSwipeComparison";
import { useTranslation } from "react-i18next";
import { Link, NavLink } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Droplets,
  Shield,
  Crown,
  Lightbulb,
  Wrench,
  Sparkles,
} from "lucide-react";
import { MinimalServiceCard } from "@/components/MinimalServiceCard";
import { CeramicSelectorCard } from "@/components/CeramicSelectorCard";
import SpecialistServiceCard from "@/components/SpecialistServiceCard";

/* ---------------- Types from DB ---------------- */
type AddonRow = {
  id: string;
  slug: string | null;
  name: string;
  base_price: number | string | null;
  duration_min: number | null;
  active: boolean | null;
};

/* ---------------- Helpers ---------------- */
function toNumber(v: number | string | null | undefined) {
  if (v == null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function formatMinutes(
  min?: number | null,
  t?: (k: string, d?: any) => string,
) {
  if (!min || min <= 0) return null;
  // keep it simple + consistent with your current UI
  return t
    ? t("servicesNew.protection.meta.estimatedTime", { min })
    : `~${min} min`;
}

/* ---------------- Slugs in your DB ----------------
  ceramicCoating24
  ceramicCoating36
  ceramicCoating48
  ceramicCoating50
  liquidWax
  spraySealant
  proCeramic
  engineBay
  headlightRestoration
--------------------------------------------------- */

type ProtectionMeta = {
  slug: string;
  fallbackTitle: string;
  Icon: any;
  descKey: string;
  featuresKey: string;
};

type AddonMeta = {
  slug: string;
  fallbackTitle: string;
  Icon: any;
  descKey: string;
  featuresKey: string;
};

const PROTECTION_NON_CERAMIC: ProtectionMeta[] = [
  {
    slug: "liquidWax",
    fallbackTitle: "Liquid Wax Protection",
    Icon: Droplets,
    descKey: "servicesNew.protection.cards.liquidWax.description",
    featuresKey: "servicesNew.protection.cards.liquidWax.features",
  },
  {
    slug: "spraySealant",
    fallbackTitle: "Spray Sealant Protection",
    Icon: Shield,
    descKey: "servicesNew.protection.cards.spraySealant.description",
    featuresKey: "servicesNew.protection.cards.spraySealant.features",
  },
];

const CERAMIC_OPTIONS_META = [
  {
    slug: "ceramicCoating12",
    labelKey: "servicesNew.protection.ceramic.options.m12",
    Icon: Shield,
  },
  {
    slug: "ceramicCoating24",
    labelKey: "servicesNew.protection.ceramic.options.m24",
    Icon: Shield,
  },
  {
    slug: "ceramicCoating36",
    labelKey: "servicesNew.protection.ceramic.options.m36",
    Icon: Crown,
  },
  {
    slug: "ceramicCoating48",
    labelKey: "servicesNew.protection.ceramic.options.m48",
    Icon: Crown,
  },
  {
    slug: "ceramicCoating50",
    labelKey: "servicesNew.protection.ceramic.options.m50",
    Icon: Crown,
  },
] as const;

const ADDON_ORDER: AddonMeta[] = [
  {
    slug: "headlightRestoration",
    fallbackTitle: "Headlight Restoration",
    Icon: Lightbulb,
    descKey: "servicesNew.addons.cards.headlightRestoration.description",
    featuresKey: "servicesNew.addons.cards.headlightRestoration.features",
  },
  {
    slug: "engineBay",
    fallbackTitle: "Engine Bay Cleaning",
    Icon: Wrench,
    descKey: "servicesNew.addons.cards.engineBay.description",
    featuresKey: "servicesNew.addons.cards.engineBay.features",
  },
];

// ------------------ Component ------------------ //
const ServicesNew = () => {
  const { t } = useTranslation();

  const [addons, setAddons] = useState<AddonRow[]>([]);
  const [addonsLoading, setAddonsLoading] = useState(true);

  const [selectedCeramicSlug, setSelectedCeramicSlug] = useState<string | null>(
    null,
  );

  const scrollToComparison = useCallback(() => {
    document
      .getElementById("comparison-table")
      ?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Fetch add-ons/protection from Supabase
  useEffect(() => {
    (async () => {
      setAddonsLoading(true);

      const res = await supabase
        .from("addon")
        .select("id,slug,name,base_price,duration_min,active")
        .eq("active", true);

      if (!res.error) setAddons(res.data ?? []);
      setAddonsLoading(false);
    })();
  }, []);

  const addonBySlug = useMemo(() => {
    const map = new Map<string, AddonRow>();
    for (const a of addons) if (a.slug) map.set(a.slug, a);
    return map;
  }, [addons]);

  const protectionCards = useMemo(() => {
    return PROTECTION_NON_CERAMIC.map((meta) => {
      const row = addonBySlug.get(meta.slug);
      return {
        ...meta,
        title: row?.name || meta.fallbackTitle,
        price: toNumber(row?.base_price),
        durationMin: row?.duration_min ?? undefined,
        existsInDb: Boolean(row),
      };
    }).filter((x) => x.existsInDb);
  }, [addonBySlug]);

  const ceramicOptions = useMemo(() => {
    return CERAMIC_OPTIONS_META.map((m) => {
      const row = addonBySlug.get(m.slug);
      return {
        slug: m.slug,
        labelKey: m.labelKey,
        Icon: m.Icon,
        title: row?.name || `Ceramic Coating`,
        price: toNumber(row?.base_price),
        durationMin: row?.duration_min ?? undefined,
        existsInDb: Boolean(row),
      };
    }).filter((x) => x.existsInDb);
  }, [addonBySlug]);

  // pick a default ceramic option when loaded
  useEffect(() => {
    if (!selectedCeramicSlug && ceramicOptions.length > 0) {
      setSelectedCeramicSlug(ceramicOptions[0].slug);
    }
  }, [ceramicOptions, selectedCeramicSlug]);

  const addonCards = useMemo(() => {
    return ADDON_ORDER.map((meta) => {
      const row = addonBySlug.get(meta.slug);
      return {
        ...meta,
        title: row?.name || meta.fallbackTitle,
        price: toNumber(row?.base_price),
        durationMin: row?.duration_min ?? undefined,
        existsInDb: Boolean(row),
      };
    }).filter((x) => x.existsInDb);
  }, [addonBySlug]);

  const getFeatures = (featuresKey: string) => {
    const arr = t(featuresKey, { returnObjects: true }) as unknown;
    return Array.isArray(arr) ? (arr as string[]) : [];
  };

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
          <ServiceCard
            title={t("servicesNew.cards.maintenance.title")}
            price={t("servicesNew.cards.maintenance.price")}
            duration={t("servicesNew.cards.maintenance.duration")}
            onMoreDetails={scrollToComparison}
          />

          <ServiceCard
            title={t("servicesNew.cards.fullDetail.title")}
            price={t("servicesNew.cards.fullDetail.price")}
            duration={t("servicesNew.cards.fullDetail.duration")}
            onMoreDetails={scrollToComparison}
          />

          <ServiceCard
            title={t("servicesNew.cards.ultimate.title")}
            price={t("servicesNew.cards.ultimate.price")}
            duration={t("servicesNew.cards.ultimate.duration")}
            onMoreDetails={scrollToComparison}
          />
        </div>
        {/* <div className="mt-20 max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold">Special Services</h2>
            <p className="text-zinc-400 mt-2">
              Advanced treatments for vehicles that need correction, not just
              cleaning.
            </p>
          </div>

          <SpecialistServiceCard />
        </div> */}
        {/* Seasonal Package */}
        {/* <div>
          <SeasonalPackage />
        </div> */}

        {/* ---------------- Protection + Add-ons ---------------- */}
        <div className="mt-16">
          {/* Protection title */}
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold">
              {t("servicesNew.protection.heading")}
            </h2>
            <p className="text-zinc-400 mt-2">
              {t("servicesNew.protection.subheading")}
            </p>
          </div>

          {/* Protection grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {protectionCards.map((item) => (
              <MinimalServiceCard
                key={item.slug}
                item={item}
                t={t}
                ctaKey="servicesNew.protection.cta.addToBooking"
                estimatedTimeKey="servicesNew.protection.meta.estimatedTime"
                showFeatures={false}
              />
            ))}

            {ceramicOptions.length > 0 && (
              <CeramicSelectorCard
                t={t}
                titleKey="servicesNew.protection.ceramic.title"
                finalNoteKey="servicesNew.protection.meta.finalNote"
                addSelectedCtaKey="servicesNew.protection.cta.addSelectedCeramic"
                estimatedTimeKey="servicesNew.protection.meta.estimatedTime"
                options={ceramicOptions}
                selectedSlug={selectedCeramicSlug}
                setSelectedSlug={setSelectedCeramicSlug}
                HeaderIcon={Crown}
              />
            )}
          </div>

          {/* Add-ons title */}
          <div className="text-center mb-10 mt-16">
            <h2 className="text-3xl font-bold">
              {t("servicesNew.addons.heading")}
            </h2>
            <p className="text-zinc-400 mt-2">
              {t("servicesNew.addons.subheading")}
            </p>
          </div>

          {/* Add-ons cards */}
          {addonsLoading ? (
            <div className="text-center text-zinc-500">
              {t("servicesNew.addons.meta.loading")}
            </div>
          ) : (
            <div className="flex flex-wrap gap-6 sm:gap-8 justify-center">
              {addonCards.map((item) => (
                <MinimalServiceCard
                  key={item.slug}
                  item={item}
                  t={t}
                  ctaKey="servicesNew.addons.cta.addToBooking"
                  estimatedTimeKey="servicesNew.addons.meta.estimatedTime"
                  showFeatures={false}
                  className="max-w-sm"
                />
              ))}
            </div>
          )}
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
      {/* CTA Section */}
      <section className="py-20 px-6 bg-card border-t border-border">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t("servicesNew.cta.title", "Not Sure What You Need?")}
          </h2>

          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            {t(
              "servicesNew.cta.subtitle",
              "Contact us for a free consultation and we'll recommend the perfect service for your vehicle.",
            )}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-border hover:bg-secondary hover:text-black"
            >
              <a
                href={t("servicesNew.cta.phoneHref", "tel:+306939949788")}
                aria-label={t(
                  "servicesNew.cta.callAria",
                  "Call Prime Detailing",
                )}
              >
                {t("servicesNew.cta.callBtn", "Call (+30) 693 994 9788")}
              </a>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </section>
  );
};

export default ServicesNew;
