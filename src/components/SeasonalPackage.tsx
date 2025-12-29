import { useEffect, useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";

type SeasonId = "winter" | "spring" | "summer" | "autumn";

type SeasonalPackageMeta = {
  id: SeasonId;
  price: number;
  endsAt: Date;
};

function getSeasonalPackageMeta(): SeasonalPackageMeta {
  const now = new Date();
  const month = now.getMonth() + 1;

  // Winter: Dec–Feb (end Mar 1)
  if (month === 12 || month <= 2) {
    const endYear = month === 12 ? now.getFullYear() + 1 : now.getFullYear();
    return {
      id: "winter",
      price: 120,
      endsAt: new Date(endYear, 2, 1),
    };
  }

  // Spring: Mar–May (end Jun 1)
  if (month >= 3 && month <= 5) {
    return {
      id: "spring",
      price: 120,
      endsAt: new Date(now.getFullYear(), 5, 1),
    };
  }

  // Summer: Jun–Aug (end Sep 1)
  if (month >= 6 && month <= 8) {
    return {
      id: "summer",
      price: 120,
      endsAt: new Date(now.getFullYear(), 8, 1),
    };
  }

  // Autumn: Sep–Nov (end Dec 1)
  return {
    id: "autumn",
    price: 120,
    endsAt: new Date(now.getFullYear(), 11, 1),
  };
}

function getCountdown(target: Date) {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return { months: 0, days: 0, hours: 0 };

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);

  return { months, days: days % 30, hours: hours % 24 };
}

export default function SeasonalPackage() {
  const { t } = useTranslation();

  const meta = useMemo(() => getSeasonalPackageMeta(), []);
  const [timer, setTimer] = useState(getCountdown(meta.endsAt));

  useEffect(() => {
    const i = setInterval(() => setTimer(getCountdown(meta.endsAt)), 60_000);
    return () => clearInterval(i);
  }, [meta.endsAt]);

  const pkg = useMemo(() => {
    const baseKey = `seasonalPackage.packages.${meta.id}`;
    const items = t(`${baseKey}.items`, { returnObjects: true }) as string[];

    return {
      name: t(`${baseKey}.name`),
      tagline: t(`${baseKey}.tagline`),
      description: t(`${baseKey}.description`),
      items: Array.isArray(items) ? items : [],
    };
  }, [meta.id, t]);

  const normalPrice = "150€+";

  return (
    <div className="max-w-xl sm:max-w-2xl mx-auto mt-20 px-2">
      <div className="relative border border-amber-400/60 bg-gradient-to-br from-amber-500/10 via-zinc-900 to-zinc-900 rounded-xl p-10 md:p-8 overflow-hidden">
        {/* Badge */}
        <span className="absolute top-3 right-3 bg-amber-500 text-black px-2 py-0.5 pt-1 text-xs font-bold rounded tracking-wide">
          {t("seasonalPackage.badge")}
        </span>

        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-bold text-amber-400 mb-2 text-center">
          {pkg.name}
        </h2>

        {/* Tagline */}
        <p className="text-lg font-semibold text-zinc-100 text-center mb-2">
          {pkg.tagline}
        </p>

        {/* Description */}
        <p className="text-sm text-zinc-400 mb-4 max-w-xl mx-auto text-center">
          {pkg.description}
        </p>

        <p className="text-sm font-semibold text-amber-400 mb-4 text-center">
          {t("seasonalPackage.whatYouGet", { count: 3 })}
        </p>

        {/* Items */}
        <ul className="space-y-2 mb-6">
          {pkg.items.map((item) => (
            <li key={item} className="text-sm text-zinc-200 flex gap-2">
              <span className="text-amber-400">✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        {/* Value */}
        <div className="bg-zinc-900/60 border border-zinc-700/50 rounded-lg p-4 mb-6">
          <p className="text-sm text-zinc-200 font-medium mb-1">
            {t("seasonalPackage.value.title")}
          </p>

          <p className="text-sm text-zinc-400">
            <Trans
              i18nKey="seasonalPackage.value.desc"
              values={{
                count: 3,
                normalPrice,
                packagePrice: `${meta.price}€`,
              }}
              components={{
                s: <span className="line-through" />,
                b: <b className="text-amber-400" />,
              }}
            />
          </p>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="text-3xl font-bold text-white text-center">
            {meta.price}€
            <span className="ml-2 text-sm font-normal text-zinc-400">
              {t("seasonalPackage.price.oneTime")}
            </span>
          </div>

          <div className="text-center sm:text-right">
            <p className="text-amber-400 text-md">
              {t("seasonalPackage.offerEnds")}
            </p>
            <p className="font-mono text-amber-400 text-xl md:text-xl font-bold tracking-wider">
              {timer.months}M : {timer.days}D : {timer.hours}H
            </p>
          </div>
        </div>

        {/* Rules */}
        <p className="text-xs text-zinc-500 leading-relaxed text-center">
          <Trans
            i18nKey="seasonalPackage.rules"
            values={{ tickets: 3, perMonth: 1 }}
            components={{ b: <b /> }}
          />
        </p>
      </div>
    </div>
  );
}
