import React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description: string;
  fromPrice: string; // "From €249"
  Icon: React.ComponentType<{ className?: string }>;
  href?: string; // optional, defaults to /booking
  className?: string;
};

export default function ServiceTileCard({
  title,
  description,
  fromPrice,
  Icon,
  href = "/booking",
  className,
}: Props) {
  return (
    <Link
      to={href}
      className={cn(
        "group block w-full min-w-0",
        "rounded-2xl p-5 sm:p-6",
        "border border-zinc-800 bg-zinc-900/60",
        "transition-all duration-200",
        "hover:border-zinc-500 hover:-translate-y-0.5",
        "focus:outline-none focus:ring-2 focus:ring-zinc-400/40",
        className,
      )}
    >
      {/* icon */}
      <div
        className={cn(
          "mb-4 inline-flex h-10 w-10 items-center justify-center",
          "rounded-xl border border-zinc-800 bg-zinc-950/40",
          "transition-colors group-hover:border-zinc-600",
        )}
      >
        <Icon className="h-5 w-5 text-sky-400" />
      </div>

      {/* title */}
      <h3 className="text-base sm:text-lg font-semibold text-zinc-100">
        {title}
      </h3>

      {/* description */}
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">
        {description}
      </p>

      {/* price */}
      <div className="mt-4 text-sm font-semibold text-sky-400">
        {fromPrice}
      </div>
    </Link>
  );
}
