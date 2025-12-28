import React from "react";
import { Link } from "react-router-dom";

type ServiceCardProps = {
  title: string;
  price: string;
  duration: string;
  // features: string[];
  // exclusions?: string[];
  onMoreDetails?: () => void;
};

const ServiceCard = ({
  title,
  price,
  duration,
  // features,
  // exclusions,
  onMoreDetails,
}: ServiceCardProps) => {
  return (
    <div
      className="
      w-full
      min-w-0
      rounded-2xl
      p-4 sm:p-6
      border border-zinc-800
      bg-zinc-900/60
      flex flex-col
      hover:border-zinc-400
      transition
    "
    >
      {/* Title */}
      <h3 className="text-base sm:text-xl font-bold mb-1 leading-tight">
        {title}
      </h3>

      {/* Price */}
      <p className="text-sm sm:text-base text-zinc-300 mb-4">
        {price} · {duration}
      </p>

      {/* Features */}
      {/* <ul className="space-y-2 mb-4 flex-grow">
        {features.map((f) => (
          <li
            key={f}
            className="text-sm text-zinc-200 leading-snug break-words"
          >
            ✓ {f}
          </li>
        ))}
      </ul> */}

      {/* Exclusions */}
      {/* {exclusions && (
        <ul className="space-y-1 text-xs text-zinc-500 mb-4">
          {exclusions.map((e) => (
            <li key={e} className="break-words">
              ✕ {e}
            </li>
          ))}
        </ul>
      )} */}

      {/* Actions */}
      <div className="mt-4 flex flex-col gap-3">
        <Link
          to="/booking"
          className="w-full text-center rounded-lg bg-white text-black py-3 text-sm font-semibold hover:bg-zinc-200 transition"
        >
          Book now
        </Link>

        <button
          onClick={onMoreDetails}
          className="w-full rounded-lg border border-zinc-700 py-3 text-sm text-zinc-300 hover:bg-zinc-800 transition"
        >
          More details
        </button>
      </div>
    </div>
  );
};

export default ServiceCard;
