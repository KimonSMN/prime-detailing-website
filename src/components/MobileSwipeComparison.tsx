import { useState } from "react";

/* =========================
   Types
========================= */

type PackageKey = "maintenance" | "full_detail" | "ultimate";

type FeatureRow = {
  label: string;
  maintenance: boolean;
  full_detail: boolean;
  ultimate: boolean;
};

type FeatureGroup = {
  title: string;
  rows: FeatureRow[];
};

/* =========================
   Data
========================= */

const groups: FeatureGroup[] = [
  {
    title: "Exterior Cleaning",
    rows: [
      {
        label: "Contactless pre-wash & Hand wash",
        maintenance: true,
        full_detail: true,
        ultimate: true,
      },
      {
        label: "Wheel face cleaning",
        maintenance: true,
        full_detail: true,
        ultimate: true,
      },
      {
        label: "Wheel barrel cleaning",
        maintenance: false,
        full_detail: true,
        ultimate: true,
      },
      {
        label: "Tar / sap removal",
        maintenance: false,
        full_detail: true,
        ultimate: true,
      },
    ],
  },
  {
    title: "Interior Cleaning",
    rows: [
      {
        label: "Interior vacuum",
        maintenance: true,
        full_detail: true,
        ultimate: true,
      },
      {
        label: "Interior surface cleaning",
        maintenance: false,
        full_detail: true,
        ultimate: true,
      },
      {
        label: "Fabric extraction",
        maintenance: false,
        full_detail: false,
        ultimate: true,
      },
    ],
  },
];

/* =========================
   Helpers
========================= */

const Check = ({ value }: { value: boolean }) => (
  <span className={value ? "text-amber-400" : "text-zinc-600"}>
    {value ? "●" : "×"}
  </span>
);

const swipePackages: {
  key: PackageKey;
  title: string;
}[] = [
  { key: "full_detail", title: "Full Detail" },
  { key: "ultimate", title: "Ultimate Detail" },
];

/* =========================
   Component
========================= */

export default function MobileSwipeComparison() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="md:hidden mt-10 border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/50">
      {/* Header */}
      <div className="grid grid-cols-[1fr_1fr_1fr] border-b border-zinc-800 text-xs font-semibold">
        <div className="p-3 text-zinc-400">Feature</div>
        <div className="p-3 text-center">Maintenance</div>
        <div className="p-3 text-center text-amber-400">
          {swipePackages[activeIndex].title}
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-[1fr_1fr_1fr]">
        {/* Feature names */}
        <div className="border-r border-zinc-800">
          {groups.map((group) => (
            <div key={group.title}>
              <div className="px-3 py-2 text-[10px] uppercase text-zinc-500">
                {group.title}
              </div>
              {group.rows.map((row) => (
                <div
                  key={row.label}
                  className="px-3 py-2 text-xs text-zinc-200 border-t border-zinc-800"
                >
                  {row.label}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Maintenance (STATIC) */}
        <div className="border-r border-zinc-800 text-center">
          {groups.map((group) => (
            <div key={group.title}>
              <div className="px-3 py-2 text-[10px]">&nbsp;</div>
              {group.rows.map((row) => (
                <div
                  key={row.label}
                  className="px-3 py-2 border-t border-zinc-800"
                >
                  <Check value={row.maintenance} />
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Swipeable column */}
        <div
          className="overflow-x-auto snap-x snap-mandatory flex"
          onScroll={(e) => {
            const index = Math.round(
              e.currentTarget.scrollLeft / e.currentTarget.clientWidth
            );
            setActiveIndex(index);
          }}
        >
          {swipePackages.map((pkg) => (
            <div key={pkg.key} className="min-w-full snap-center text-center">
              {groups.map((group) => (
                <div key={group.title}>
                  <div className="px-3 py-2 text-[10px]">&nbsp;</div>
                  {group.rows.map((row) => (
                    <div
                      key={row.label}
                      className="px-3 py-2 border-t border-zinc-800"
                    >
                      <Check value={row[pkg.key]} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Swipe hint */}
      <div className="text-center text-xs text-zinc-500 py-2">
        Swipe → to compare packages
      </div>
    </div>
  );
}
