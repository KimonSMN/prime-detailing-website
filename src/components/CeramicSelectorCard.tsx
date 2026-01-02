import React, { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

export type CeramicOption = {
  slug: string;
  labelKey: string;
  price: number | string | null | undefined;
  durationMin?: number | null;
  Icon: LucideIcon;
};

type CeramicSelectorCardProps = {
  titleKey: string;
  finalNoteKey: string;
  addSelectedCtaKey: string;
  estimatedTimeKey: string;
  t: (key: string, opts?: any) => string;
  options: CeramicOption[];

  // keep your external state API
  selectedSlug: string | null;
  setSelectedSlug: (slug: string) => void;

  HeaderIcon: LucideIcon;
  bookingBasePath?: string;
  className?: string;
};

export function CeramicSelectorCard({
  titleKey,
  finalNoteKey,
  addSelectedCtaKey,
  estimatedTimeKey,
  t,
  options,
  selectedSlug,
  setSelectedSlug,
  HeaderIcon,
  bookingBasePath = "/booking",
  className = "",
}: CeramicSelectorCardProps) {
  const CrownIcon = HeaderIcon;

  // index derived from selectedSlug (fallback 0)
  const selectedIndex = useMemo(() => {
    if (!options.length) return 0;
    const idx = selectedSlug
      ? options.findIndex((o) => o.slug === selectedSlug)
      : -1;
    return idx >= 0 ? idx : 0;
  }, [options, selectedSlug]);

  // local index for UI navigation (stays in sync with selectedSlug)
  const [idx, setIdx] = useState(selectedIndex);

  useEffect(() => {
    setIdx(selectedIndex);
  }, [selectedIndex]);

  const current = options[idx];
  const canNavigate = options.length > 1;

  function goTo(nextIdx: number) {
    if (!options.length) return;
    const wrapped = (nextIdx + options.length) % options.length;
    setIdx(wrapped);
    setSelectedSlug(options[wrapped].slug);
  }

  const priceText =
    current?.price != null && current.price !== "" ? `${current.price} €` : "—";
  const OptIcon = current?.Icon;

  return (
    <div
      className={[
        `
        w-full min-w-0 rounded-2xl p-4 sm:p-6
        border border-zinc-800 bg-zinc-900/60
        flex flex-col hover:border-zinc-400 transition
      `,
        className,
      ].join(" ")}
    >
      {/* Top */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-zinc-800/60 flex items-center justify-center flex-shrink-0">
          <CrownIcon className="w-5 h-5 text-amber-400" />
        </div>

        <h3 className="text-base sm:text-xl font-bold leading-tight text-zinc-100">
          {t(titleKey)}
        </h3>
      </div>

      {/* Single option (one at a time) */}
      {current && (
        <div
          className="
            w-full rounded-xl border border-zinc-800 bg-zinc-950/20
            px-4 py-4
          "
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              {OptIcon ? (
                <OptIcon className="w-4 h-4 text-amber-400 flex-shrink-0" />
              ) : null}
              <div className="font-semibold text-zinc-100 truncate">
                {t(current.labelKey)}
              </div>
            </div>

            <div className="text-lg font-extrabold tracking-tight text-amber-400">
              {priceText}
            </div>
          </div>

          {current.durationMin != null && current.durationMin > 0 && (
            <div className="mt-1 text-xs text-zinc-400">
              {t(estimatedTimeKey, { min: current.durationMin })}
            </div>
          )}

          {/* Controls */}
          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => goTo(idx - 1)}
              disabled={!canNavigate}
              className={`
                rounded-lg border px-3 py-2 text-sm transition
                ${
                  canNavigate
                    ? "border-zinc-700 text-zinc-200 hover:bg-zinc-800"
                    : "border-zinc-800 text-zinc-500 cursor-not-allowed"
                }
              `}
            >
              ←
            </button>

            {/* Dots */}
            <div className="flex items-center gap-2">
              {options.map((o, i) => {
                const active = o.slug === selectedSlug;
                return (
                  <button
                    key={o.slug}
                    type="button"
                    onClick={() => goTo(i)}
                    className={`
                      h-2.5 w-2.5 rounded-full transition
                      ${active ? "bg-amber-400" : "bg-zinc-700 hover:bg-zinc-500"}
                    `}
                    aria-label={t(o.labelKey)}
                  />
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => goTo(idx + 1)}
              disabled={!canNavigate}
              className={`
                rounded-lg border px-3 py-2 text-sm transition
                ${
                  canNavigate
                    ? "border-zinc-700 text-zinc-200 hover:bg-zinc-800"
                    : "border-zinc-800 text-zinc-500 cursor-not-allowed"
                }
              `}
            >
              →
            </button>
          </div>
        </div>
      )}

      <div className="text-xs text-zinc-500 mt-3">{t(finalNoteKey)}</div>

      {/* Action */}
      <div className="mt-6 flex flex-col gap-3">
        <NavLink
          to={
            selectedSlug
              ? `${bookingBasePath}?addonSlug=${selectedSlug}`
              : bookingBasePath
          }
          className={`
            w-full text-center rounded-lg py-3 text-sm font-semibold transition
            ${
              selectedSlug
                ? "bg-white text-black hover:bg-zinc-200"
                : "bg-zinc-800 text-zinc-400 cursor-not-allowed pointer-events-none"
            }
          `}
        >
          {t(addSelectedCtaKey)}
        </NavLink>
      </div>
    </div>
  );
}
