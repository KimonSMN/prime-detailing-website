import { useEffect, useMemo, useState } from "react";

type SeasonalPackage = {
  name: string;
  price: number;
  endsAt: Date;
  items: string[];
  tagline: string;
  description: string;
};

function getSeasonalPackage(): SeasonalPackage {
  const now = new Date();
  const month = now.getMonth() + 1;

  if (month === 12 || month <= 2) {
    const endYear = month === 12 ? now.getFullYear() + 1 : now.getFullYear();

    return {
      name: "Winter Protection Package",
      price: 120,
      endsAt: new Date(endYear, 2, 1),
      tagline: "See better. Stay protected. Less cleaning between washes.",
      description:
        "Cold weather brings constant moisture, dirty roads, and reduced visibility. " +
        "The Winter Package focuses on water repellency, safety, and fast protection " +
        "against harsh conditions.",
      items: [
        "Full Exterior & Interior Detailing (50€ value)",
        "FREE Rain-repellent on windshield (20€ value)",
        "FREE Spray Sealant (20€ value)",
      ],
    };
  }

  if (month >= 3 && month <= 5) {
    return {
      name: "Spring Decontamination Package",
      price: 120,
      endsAt: new Date(now.getFullYear(), 5, 1),
      tagline: "Remove winter damage. Start the season clean.",
      description:
        "After winter, your paint is loaded with iron particles, salt residue, and road contamination. " +
        "This package is a deep exterior reset that prepares the car for the sunny months ahead.",
      items: [
        "Full Exterior & Interior Detailing (50€ value)",
        "Iron / Fallout Removal (20€ value)",
        "Protection Wax – Koch PW (20€ value)",
      ],
    };
  }

  if (month >= 6 && month <= 8) {
    return {
      name: "Summer UV Shield Package",
      price: 120,
      endsAt: new Date(now.getFullYear(), 8, 1),
      tagline: "Protect your interior from sun damage and fading.",
      description:
        "Summer sun is brutal on plastics, dashboards, and trim. " +
        "This package focuses on UV protection and keeping the car looking newer " +
        "during peak exposure.",
      items: [
        "Full Exterior & Interior Detailing (50€ value)",
        "Exterior Plastics UV Protection (10€ value)",
        "Interior Plastics UV Protection (10€ value)",
        "Protection Wax – Koch PW (20€ value)",
      ],
    };
  }

  return {
    name: "Autumn Reset Package",
    price: 120,
    endsAt: new Date(now.getFullYear(), 11, 1),
    tagline: "Clean the inside. Prepare for winter.",
    description:
      "Summer leaves behind salt, sweat, sand, and fabric stains. " +
      "Autumn is the perfect moment to deep-clean the interior and re-apply protection " +
      "before bad weather returns.",
    items: [
      "Full Exterior & Interior Detailing (50€ value)",
      "Deep Fabric Seat Cleaning (Wet-Vac)",
      "FREE Rain-repellent on windshield (20€ value)",
      "Spray Sealant (S002) (20€ value)",
    ],
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
  const pkg = useMemo(() => getSeasonalPackage(), []);
  const [timer, setTimer] = useState(getCountdown(pkg.endsAt));

  useEffect(() => {
    const i = setInterval(() => setTimer(getCountdown(pkg.endsAt)), 60_000);
    return () => clearInterval(i);
  }, [pkg.endsAt]);

  return (
    <div className="max-w-xl sm:max-w-2xl mx-auto mt-20 px-2">
      <div className="relative border border-amber-400/60 bg-gradient-to-br from-amber-500/10 via-zinc-900 to-zinc-900 rounded-xl p-10 md:p-8 overflow-hidden">
        {/* Badge */}
        <span className="absolute top-3 right-3 bg-amber-500 text-black px-2 py-0.5 pt-1 text-xs font-bold rounded tracking-wide">
          SEASONAL · LIMITED
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
          What you get - 3× per season
        </p>

        {/* Items – vertical */}
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
            Why this package is worth it
          </p>
          <p className="text-sm text-zinc-400">
            3 Full Exterior & Interior Details normally cost{" "}
            <span className="line-through">150€+</span>. This package is{" "}
            <b className="text-amber-400">{pkg.price}€</b> and includes seasonal
            protection services.
          </p>
        </div>

        {/* Footer */}
        <div
          className="
            flex flex-col
            gap-4
            sm:flex-row
            sm:items-center
            sm:justify-between
            mb-6
          "
        >
          {" "}
          <div className="text-3xl font-bold text-white text-center">
            {pkg.price}€
            <span className="ml-2 text-sm font-normal text-zinc-400 ">
              one-time payment
            </span>
          </div>
          <div className="text-center sm:text-right">
            <p className="text-amber-400 text-md">Offer ends in</p>
            <p className="font-mono text-amber-400 text-xl md:text-xl font-bold tracking-wider">
              {timer.months}M : {timer.days}D : {timer.hours}H
            </p>
          </div>
        </div>

        {/* Rules – bottom */}
        <p className="text-xs text-zinc-500 leading-relaxed text-center">
          * One-time payment. Includes <b>3 service tickets</b>. Only{" "}
          <b>1 ticket may be redeemed per month</b>. Tickets are valid{" "}
          <b>only during the current season</b> and expire when the season ends.
        </p>
      </div>
    </div>
  );
}
