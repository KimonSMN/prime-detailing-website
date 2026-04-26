import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

type ServiceCardProps = {
  title: string;
  price: string;
  duration: string;
  onMoreDetails?: () => void;
};

const ServiceCard = ({
  title,
  price,
  duration,
  onMoreDetails,
}: ServiceCardProps) => {
  const { t } = useTranslation();

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
      <p className="text-base text-zinc-300 mb-4">
        {price} {duration}
      </p>

      {/* Actions */}
      <div className="mt-4 flex flex-col gap-3">
        <Link
          to="/booking"
          className="w-full text-center rounded-lg bg-white text-black py-3 text-sm font-semibold hover:bg-zinc-200 transition"
        >
          {t("servicesNew.book")}
        </Link>

        <button
          onClick={onMoreDetails}
          className="w-full rounded-lg border border-zinc-700 py-3 text-sm text-zinc-300 hover:bg-zinc-800 transition"
        >
          {t("servicesNew.details")}
        </button>
      </div>
    </div>
  );
};

export default ServiceCard;
