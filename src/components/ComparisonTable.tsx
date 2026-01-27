import { Fragment } from "react";
import { useTranslation } from "react-i18next";

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
        labelKey: "comparison.rows.fabricSeatDeepExtraction",
        maintenance: false,
        full_detail: false,
        ultimate: true,
      },
    ],
  },
  {
    titleKey: "comparison.groups.protection",
    rows: [
      {
        labelKey: "comparison.rows.exteriorProtectiveWax",
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
        labelKey: "comparison.rows.exteriorPlasticsProtection",
        maintenance: false,
        full_detail: false,
        ultimate: true,
      },
      {
        labelKey: "comparison.rows.leatherConditioning",
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
        ? "text-secondary text-base sm:text-xl"
        : "text-zinc-500 text-base sm:text-2xl"
    }
  >
    {value ? "●" : "×"}
  </span>
);

const ComparisonTable = () => {
  const { t } = useTranslation();

  return (
    <div className="mt-16 -mx-4 sm:mx-0">
      <div className="overflow-x-auto border border-zinc-700 rounded-xl mt-16">
        <table className="w-full min-w-[600px] border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-zinc-700">
              <th className="text-left p-2 sm:p-4 font-medium text-zinc-400">
                {t("comparison.headers.features")}
              </th>
              <th className="p-2 sm:p-4 text-center font-semibold">
                <span className="sm:hidden">
                  {t("comparison.headers.maintenanceShort")}
                </span>
                <span className="hidden sm:inline">
                  {t("comparison.headers.maintenanceLong")}
                </span>
              </th>
              <th className="p-2 sm:p-4 text-center font-semibold">
                <span className="sm:hidden">
                  {t("comparison.headers.fullShort")}
                </span>
                <span className="hidden sm:inline">
                  {t("comparison.headers.fullLong")}
                </span>
              </th>
              <th className="p-2 sm:p-4 text-center font-semibold">
                {t("comparison.headers.ultimate")}
              </th>
            </tr>
          </thead>

          <tbody>
            {groups.map((group) => (
              <Fragment key={group.titleKey}>
                <tr>
                  <td
                    colSpan={4}
                    className="px-2 sm:px-4 sm:py-4 py-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-secondary"
                  >
                    {t(group.titleKey)}
                  </td>
                </tr>

                {group.rows.map((row) => (
                  <tr
                    key={row.labelKey}
                    className="border-t border-b border-zinc-800 hover:bg-zinc-900/40"
                  >
                    <td className="p-2 sm:p-4 text-zinc-200 leading-tight">
                      {t(row.labelKey)}
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
