import { Fragment } from "react";

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
        label: "Interior shampoo",
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
      {
        label: "Leather cleaning",
        maintenance: false,
        full_detail: true,
        ultimate: true,
      },
    ],
  },
  {
    title: "Protection",
    rows: [
      {
        label: "Exterior protective wax",
        maintenance: false,
        full_detail: false,
        ultimate: true,
      },
      {
        label: "Interior plastics protection",
        maintenance: false,
        full_detail: false,
        ultimate: true,
      },
      {
        label: "Leather conditioning",
        maintenance: false,
        full_detail: false,
        ultimate: true,
      },
    ],
  },
];

const Check = ({ value }: { value: boolean }) => (
  <span
    className={
      value
        ? "text-amber-400 text-base sm:text-xl"
        : "text-zinc-500 text-base sm:text-2xl"
    }
  >
    {value ? "●" : "×"}
  </span>
);

const ComparisonTable = () => {
  return (
    <div className="mt-16 -mx-4 sm:mx-0">
      <div className="overflow-x-auto border border-zinc-700 rounded-xl mt-16">
        <table className="w-full min-w-[600px] border-collapse text-xs sm:text-sm">
          {/* Header */}
          <thead>
            <tr className="border-b border-zinc-700">
              <th className="text-left p-2 sm:p-4 font-medium text-zinc-400">
                Features
              </th>
              <th className="p-2 sm:p-4 text-center font-semibold">
                <span className="sm:hidden">Maint.</span>
                <span className="hidden sm:inline">Maintenance Wash</span>
              </th>
              <th className="p-2 sm:p-4 text-center font-semibold">
                <span className="sm:hidden">Full</span>
                <span className="hidden sm:inline">
                  Full Exterior & Interior
                </span>
              </th>
              <th className="p-2 sm:p-4 text-center font-semibold">Ultimate</th>
            </tr>
          </thead>

          <tbody>
            {groups.map((group) => (
              <Fragment key={group.title}>
                {/* Group title */}
                <tr>
                  <td
                    colSpan={4}
                    className="px-2 sm:px-4 pt-6 pb-1 text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-white"
                  >
                    {group.title}
                  </td>
                </tr>

                {/* Rows */}
                {group.rows.map((row) => (
                  <tr
                    key={row.label}
                    className="border-t border-zinc-800 hover:bg-zinc-900/40"
                  >
                    <td className="p-2 sm:p-4 text-zinc-200 leading-tight">
                      {row.label}
                    </td>
                    <td className="p-2 sm:p-4 text-center">
                      <Check value={row.maintenance} />
                    </td>
                    <td className="p-2 sm:p-4 text-center">
                      <Check value={row.full_detail} />
                    </td>
                    <td className="p-2 sm:p-4 text-center">
                      <Check value={row.ultimate} />
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComparisonTable;
