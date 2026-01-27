import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type PackageKey = "maintenance" | "full_detail" | "ultimate";

type FeatureRow = {
  labelKey: string;
  maintenance: boolean;
  full_detail: boolean;
  ultimate: boolean;
};

type FeatureGroup = {
  titleKey: string;
  rows: FeatureRow[];
};

const groups: FeatureGroup[] = [
  {
    titleKey: "comparison.groups.exteriorCleaning",
    rows: [
      {
        labelKey: "comparison.rows.contactlessPrewashHandWash",
        maintenance: true,
        full_detail: true,
        ultimate: true,
      },
      {
        labelKey: "comparison.rows.wheelFaceCleaningTireDressing",
        maintenance: true,
        full_detail: true,
        ultimate: true,
      },
      {
        labelKey: "comparison.rows.tarSapRemoval",
        maintenance: false,
        full_detail: true,
        ultimate: true,
      },
      {
        labelKey: "comparison.rows.wheelBarrelDeepCleaning",
        maintenance: false,
        full_detail: false,
        ultimate: true,
      },
      {
        labelKey: "comparison.rows.exteriorProtectiveWax",
        maintenance: false,
        full_detail: false,
        ultimate: true,
      },
      {
        labelKey: "comparison.rows.exteriorPlasticsProtection",
        maintenance: false,
        full_detail: false,
        ultimate: true,
      },
    ],
  },
  {
    titleKey: "comparison.groups.interiorCleaning",
    rows: [
      {
        labelKey: "comparison.rows.interiorVacuumWipeDown",
        maintenance: true,
        full_detail: true,
        ultimate: true,
      },
      {
        labelKey: "comparison.rows.glassCleaning",
        maintenance: true,
        full_detail: true,
        ultimate: true,
      },
      {
        labelKey: "comparison.rows.fullVacuumCarpetCleaning",
        maintenance: false,
        full_detail: true,
        ultimate: true,
      },
      {
        labelKey: "comparison.rows.interiorSurfaceShampooing",
        maintenance: false,
        full_detail: true,
        ultimate: true,
      },
      {
        labelKey: "comparison.rows.doorJambsTrunkCleaning",
        maintenance: false,
        full_detail: true,
        ultimate: true,
      },
      {
        labelKey: "comparison.rows.leatherCleaning",
        maintenance: false,
        full_detail: true,
        ultimate: true,
      },
      {
        labelKey: "comparison.rows.leatherConditioning",
        maintenance: false,
        full_detail: false,
        ultimate: true,
      },
      {
        labelKey: "comparison.rows.interiorPlasticsProtection",
        maintenance: false,
        full_detail: false,
        ultimate: true,
      },
      {
        labelKey: "comparison.rows.fabricSeatDeepExtraction",
        maintenance: false,
        full_detail: false,
        ultimate: true,
      },
    ],
  },
];

const swipePackages = [
  { key: "full_detail", titleKey: "comparison.headers.fullShort" },
  { key: "ultimate", titleKey: "comparison.headers.ultimateShort" },
] as const;

const Check = ({ value }: { value: boolean }) => (
  <span
    className={[
      "inline-flex items-center justify-center",
      "w-5 h-5 leading-none select-none",
      value ? "text-secondary" : "text-zinc-600",
    ].join(" ")}
    aria-hidden="true"
  >
    {value ? "●" : "×"}
  </span>
);


type Item =
  | { type: "group"; titleKey: string }
  | { type: "row"; row: FeatureRow };

export default function MobileSwipeComparison() {
  const { t, i18n } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);

  const items: Item[] = useMemo(() => {
    const out: Item[] = [];
    for (const g of groups) {
      out.push({ type: "group", titleKey: g.titleKey });
      for (const r of g.rows) out.push({ type: "row", row: r });
    }
    return out;
  }, []);

  // --- sizes / classes ---
  const GROUP_HEIGHT = "h-[48px]";
  const BORDER = "border-t border-zinc-800";

  const groupCellLeft  = `px-3 ${GROUP_HEIGHT} ${BORDER} flex items-center text-[10px] uppercase text-secondary box-border`;
  const groupCellMid   = `px-3 ${GROUP_HEIGHT} ${BORDER} flex items-center justify-center box-border`;
  const groupCellRight = `px-3 ${GROUP_HEIGHT} ${BORDER} flex items-center justify-center box-border`;

  const featureCell = `px-3 py-3 ${BORDER} flex items-start text-xs text-zinc-200 box-border`;
  const checkCell   = `px-3 py-3 ${BORDER} flex items-center justify-center box-border`;


  // --- refs for height syncing ---
  const leftRefs = useRef<(HTMLDivElement | null)[]>([]);
  const midRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rightRefs = useRef<(HTMLDivElement | null)[][]>([]); // [pkgIndex][itemIndex]

  const syncHeights = () => {
  const heights = items.map((_, idx) => {
    const el = leftRefs.current[idx];
    return el ? el.getBoundingClientRect().height : 0;
  });

  // Apply to LEFT too (prevents fractional-vs-integer drift)
  heights.forEach((h, idx) => {
    const el = leftRefs.current[idx];
    if (el && h) el.style.height = `${h}px`; // keep decimals
  });

  // Apply to middle
  heights.forEach((h, idx) => {
    const el = midRefs.current[idx];
    if (el && h) el.style.height = `${h}px`;
  });

  // Apply to each swipe page
  for (let p = 0; p < swipePackages.length; p++) {
    const page = rightRefs.current[p] || [];
    heights.forEach((h, idx) => {
      const el = page[idx];
      if (el && h) el.style.height = `${h}px`;
    });
  }
};


  // Recalc when text/width changes
  useLayoutEffect(() => {
    // next frame helps after layout settles
    const raf = requestAnimationFrame(syncHeights);

    const onResize = () => syncHeights();
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, activeIndex, i18n.language]);

  return (
    <div className="md:hidden mt-2 border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/50">
      {/* Header */}
      <div className="grid grid-cols-[1fr_90px_1fr] border-b border-zinc-800 text-xs font-semibold">
        <div className="p-3 text-zinc-400">{t("comparison.headers.features")}</div>

        <div className="p-3 text-center">{t("comparison.headers.maintenanceShort")}</div>

        <div className="p-3 text-center text-secondary">
          {t(swipePackages[activeIndex].titleKey)}
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-[1fr_90px_1fr]">
        {/* Left column */}
        <div className="border-r border-zinc-800 min-w-0">
          {items.map((it, idx) =>
            it.type === "group" ? (
              <div
                key={`g-${idx}`}
                ref={(el) => {
                  leftRefs.current[idx] = el;
                }}
                className={groupCellLeft}
              >
                {t(it.titleKey)}
              </div>
            ) : (
              <div
                key={`r-${idx}`}
                ref={(el) => {
                  leftRefs.current[idx] = el;
                }}
                className={featureCell}
              >
                <span className="break-words leading-snug">
                  {t(it.row.labelKey)}
                </span>
              </div>
            ),
          )}
        </div>

        {/* Middle column (Maintenance) */}
        <div className="border-r border-zinc-800">
          {items.map((it, idx) =>
            it.type === "group" ? (
              <div
                key={`gm-${idx}`}
                ref={(el) => {
                  midRefs.current[idx] = el;
                }}
                className={groupCellMid}
              >
                &nbsp;
              </div>
            ) : (
              <div
                key={`rm-${idx}`}
                ref={(el) => {
                  midRefs.current[idx] = el;
                }}
                className={checkCell}
              >
                <Check value={it.row.maintenance} />
              </div>
            ),
          )}
        </div>

        {/* Right column (Swipe packages) */}
        <div
          className="overflow-x-auto snap-x snap-mandatory"
          onScroll={(e) => {
            const w = e.currentTarget.clientWidth || 1;
            const index = Math.round(e.currentTarget.scrollLeft / w);
            setActiveIndex(Math.max(0, Math.min(index, swipePackages.length - 1)));
          }}
        >
          <div className="flex">
            {swipePackages.map((pkg, pkgIndex) => (
              <div key={pkg.key} className="min-w-full snap-center">
                {items.map((it, idx) =>
                  it.type === "group" ? (
                    <div
                      key={`gs-${pkg.key}-${idx}`}
                      ref={(el) => {
                        rightRefs.current[pkgIndex] ??= [];
                        rightRefs.current[pkgIndex][idx] = el;
                      }}
                      className={groupCellRight}
                    >
                      &nbsp;
                    </div>
                  ) : (
                    <div
                      key={`rs-${pkg.key}-${idx}`}
                      ref={(el) => {
                        rightRefs.current[pkgIndex] ??= [];
                        rightRefs.current[pkgIndex][idx] = el;
                      }}
                      className={checkCell}
                    >
                      <Check value={it.row[pkg.key]} />
                    </div>
                  ),
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
