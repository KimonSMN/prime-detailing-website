import React from "react";
import { NavLink } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

type CardBase = {
  slug: string;
  title: string;
  descKey: string;
  price: number | string | null | undefined;
  durationMin?: number | null;
  Icon: LucideIcon;
};

type MinimalServiceCardProps = {
  item: CardBase;
  t: (key: string, opts?: any) => string;
  bookingBasePath?: string; // default: "/booking"
  ctaKey: string; // i18n key for button text
  estimatedTimeKey: string; // kept for compatibility (not used below)
  showFeatures?: boolean; // default true
  features?: string[]; // already translated strings
  className?: string;
};

// 60 -> "~1h", 90 -> "~1.5h", 120 -> "~2h"
function approxHoursFromMinutes(min?: number | null) {
  if (!min || min <= 0) return null;
  const h = min / 60;
  const rounded = Math.round(h * 2) / 2; // halves
  return `~${rounded % 1 === 0 ? rounded.toFixed(0) : rounded}h`;
}

export function MinimalServiceCard({
  item,
  t,
  bookingBasePath = "/booking",
  ctaKey,
  showFeatures = true,
  features = [],
  className = "",
}: MinimalServiceCardProps) {
  const Icon = item.Icon;

  const hasPrice = item.price != null && item.price !== "";
  const priceNum =
    typeof item.price === "string" ? Number(item.price) : item.price;

  const priceValue = Number.isFinite(priceNum) ? priceNum : item.price;

   const priceText = !hasPrice
    ? t("servicesNew.fromPriceEmpty") // e.g. "Από -" (your current behavior)
    : typeof item.price === "string"
      ? item.price // <-- allow a direct label like "Price upon arrangement."
      : t("servicesNew.fromPrice", { price: item.price });

  const durText = approxHoursFromMinutes(item.durationMin);

  return (
    <div
      className={[
        `
      w-full min-w-0 rounded-2xl p-4 sm:p-6
      border border-zinc-800 bg-zinc-900/60
      flex flex-col hover:border-zinc-400 transition

      md:min-h-[250px]
    `,
        className,
      ].join(" ")}
    >
      {/* Title */}
      <div className="flex items-start gap-3 mb-1">
        <div className="mt-0.5 w-9 h-9 rounded-xl bg-zinc-800/60 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-secondary" />
        </div>

        <div className="min-w-0">
          <h3 className="text-base sm:text-xl font-bold leading-tight">
            {item.title}
          </h3>
          <p className="text-sm text-zinc-400 mt-1">{t(item.descKey)}</p>

          {/* Pricing/time line (same vibe as ServiceCard screenshot) */}
          <p className="text-sm sm:text-base text-zinc-300 mt-2">
            {priceText}
            {durText ? `  ${durText}` : ""}
          </p>
        </div>
      </div>

      {/* Features (optional) */}
      {showFeatures && features.length > 0 && (
        <ul className="mt-4 space-y-1 text-sm text-zinc-400">
          {features.map((f, idx) => (
            <li key={idx} className="flex gap-2">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-secondary/70 flex-shrink-0" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Action */}
      <div className="mt-6 md:mt-auto flex flex-col gap-3">
        <NavLink
          to={`${bookingBasePath}?addonSlug=${item.slug}`}
          className="
      w-full text-center rounded-lg bg-white text-black
      py-3 text-sm font-semibold hover:bg-zinc-200 transition
    "
        >
          {t(ctaKey)}
        </NavLink>
      </div>
    </div>
  );
}
