import { useMemo, useState } from "react";

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
        label: "Wheel face cleaning & tire dressing",
        maintenance: true,
        full_detail: true,
        ultimate: true,
      },
      {
        label: "Tar / sap removal",
        maintenance: false,
        full_detail: true,
        ultimate: true,
      },
      {
        label: "Wheel barrel deep cleaning",
        maintenance: false,
        full_detail: false,
        ultimate: true,
      },
      {
        label: "Exterior protection wax",
        maintenance: false,
        full_detail: false,
        ultimate: true,
      },
      {
        label: "Exterior plastic protection",
        maintenance: false,
        full_detail: false,
        ultimate: true,
      },
    ],
  },
  {
    title: "Interior Cleaning",
    rows: [
      {
        label: "Interior vacuum & wipe-down",
        maintenance: true,
        full_detail: true,
        ultimate: true,
      },
      {
        label: "Glass cleaning",
        maintenance: true,
        full_detail: true,
        ultimate: true,
      },
      {
        label: "Full vacuum & carpet cleaning",
        maintenance: false,
        full_detail: true,
        ultimate: true,
      },
      {
        label: "Interior surface shampooing",
        maintenance: false,
        full_detail: true,
        ultimate: true,
      },
      {
        label: "Door jambs & trunk cleaning",
        maintenance: false,
        full_detail: true,
        ultimate: true,
      },
      {
        label: "Leather cleaning",
        maintenance: false,
        full_detail: true,
        ultimate: true,
      },
      {
        label: "Leather conditioning",
        maintenance: false,
        full_detail: false,
        ultimate: true,
      },
      {
        label: "Interior plastic protection",
        maintenance: false,
        full_detail: false,
        ultimate: true,
      },
      {
        label: "Fabric seat deep extraction",
        maintenance: false,
        full_detail: false,
        ultimate: true,
      },
    ],
  },
];

const swipePackages = [
  { key: "full_detail", title: "Full Detail" },
  { key: "ultimate", title: "Ultimate Detail" },
] as const;

const Check = ({ value }: { value: boolean }) => (
  <span className={value ? "text-secondary" : "text-zinc-600"}>
    {value ? "●" : "×"}
  </span>
);

type Item = { type: "group"; title: string } | { type: "row"; row: FeatureRow };

export default function MobileSwipeComparison() {
  const [activeIndex, setActiveIndex] = useState(0);

  const items: Item[] = useMemo(() => {
    const out: Item[] = [];
    for (const g of groups) {
      out.push({ type: "group", title: g.title });
      for (const r of g.rows) out.push({ type: "row", row: r });
    }
    return out;
  }, []);

  // --- sizes / classes ---
  const ROW_HEIGHT = "h-[48px]";
  const GROUP_HEIGHT = "h-[48px] ";
  const BORDER = "border-t border-zinc-800";

  const groupCellLeft = `px-3 ${GROUP_HEIGHT} ${BORDER} flex items-center text-[10px] uppercase text-secondary`;
  const groupCellMid = `px-3 ${GROUP_HEIGHT} ${BORDER} flex items-center justify-center`;
  const groupCellRight = `px-3 ${GROUP_HEIGHT} ${BORDER} flex items-center justify-center`;

  const featureCell = `px-3 ${ROW_HEIGHT} ${BORDER} flex items-center text-xs text-zinc-200`;
  const checkCell = `px-3 ${ROW_HEIGHT} ${BORDER} flex items-center justify-center`;

  return (
    <div className="md:hidden mt-2 border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/50">
      {/* Header */}
      <div className="grid grid-cols-[1fr_90px_1fr] border-b border-zinc-800 text-xs font-semibold">
        <div className="p-3 text-zinc-400">Feature</div>
        <div className="p-3 text-center">Maintenance</div>
        <div className="p-3 text-center text-secondary ">
          {swipePackages[activeIndex].title}
        </div>
      </div>

      {/* Body: 3 columns, but rows are rendered in sync */}
      <div className="grid grid-cols-[1fr_90px_1fr]">
        {/* Left column (Feature / Group titles) */}
        <div className="border-r border-zinc-800">
          {items.map((it, idx) =>
            it.type === "group" ? (
              <div key={`g-${idx}`} className={groupCellLeft}>
                {it.title}
              </div>
            ) : (
              <div key={`r-${idx}`} className={featureCell}>
                <span className="leading-snug line-clamp-2">
                  {it.row.label}
                </span>
              </div>
            ),
          )}
        </div>

        {/* Middle column (Maintenance) */}
        <div className="border-r border-zinc-800">
          {items.map((it, idx) =>
            it.type === "group" ? (
              <div key={`gm-${idx}`} className={groupCellMid}>
                {/* this is the "box next to group.title" */}
                &nbsp;
              </div>
            ) : (
              <div key={`rm-${idx}`} className={checkCell}>
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
            setActiveIndex(
              Math.max(0, Math.min(index, swipePackages.length - 1)),
            );
          }}
        >
          <div className="flex">
            {swipePackages.map((pkg) => (
              <div key={pkg.key} className="min-w-full snap-center">
                {items.map((it, idx) =>
                  it.type === "group" ? (
                    <div
                      key={`gs-${pkg.key}-${idx}`}
                      className={groupCellRight}
                    >
                      {/* this is the 2nd "box next to group.title" */}
                      &nbsp;
                    </div>
                  ) : (
                    <div key={`rs-${pkg.key}-${idx}`} className={checkCell}>
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
