import React from "react";

/**
 * Services Page (React + Tailwind)
 * - Prices start with "From $X"
 * - Includes a dummy comparison table text (since you have the real one)
 * - Paint Correction + Ceramic Coatings live in a "Special" section with horizontal scroll
 */

const detailServices = [
  {
    name: "Exterior Detail",
    price: 15,
    description:
      "A quick refresh to bring back a clean, glossy exterior look.",
    highlights: ["Safe wash", "Wheel & tire cleaning", "Exterior wipe-down"],
    badge: "Popular",
  },
  {
    name: "Maintenance Detail",
    price: 30,
    description:
      "Ideal for keeping your car consistently clean between deep details.",
    highlights: ["Light interior tidy", "Exterior wash", "Quick protection"],
  },
  {
    name: "Full Interior & Exterior Detail",
    price: 50,
    description:
      "A complete reset inside and out for a noticeably cleaner finish.",
    highlights: ["Interior vacuum", "Exterior wash", "Deep clean touchpoints"],
  },
  {
    name: "Ultimate Detail",
    price: 60,
    description:
      "Our most thorough detail package for maximum clean and shine.",
    highlights: ["Deep interior clean", "Enhanced exterior finish", "Detailing trim"],
    badge: "Best Value",
  },
];

const protectionAddOns = [
  {
    name: "Wax (lasts ~1 month)",
    price: 10,
    description: "Classic warm gloss with short-term protection.",
  },
  {
    name: "Spray Sealant (lasts ~3 months)",
    price: 20,
    description: "Fast, durable protection with great hydrophobic performance.",
  },
];

const extras = [
  {
    name: "Headlight Restoration",
    price: 20,
    description: "Improves clarity and appearance for safer night driving.",
  },
  {
    name: "Engine Bay Detailing",
    price: 20,
    description: "Careful cleaning for a neat, refreshed engine bay look.",
  },
];

const paintCorrectionOptions = [
  {
    title: "1-Step Paint Correction",
    price: 100,
    description: "Boost gloss and reduce light swirls for a cleaner finish.",
    tag: "Correction",
  },
  {
    title: "2-Step Paint Correction",
    price: 200,
    description: "More defect removal + higher clarity and depth.",
    tag: "Correction",
  },
  {
    title: "3-Step Paint Correction",
    price: 300,
    description: "Maximum refinement for the highest gloss and clarity possible.",
    tag: "Correction",
  },
];

const ceramicCoatingOptions = [
  {
    title: "Ceramic Coating (2 years)",
    price: 120,
    description: "Strong protection with impressive water beading and gloss.",
    tag: "Ceramic",
  },
  {
    title: "Ceramic Coating (3 years)",
    price: 150,
    description: "Enhanced longevity and durability.",
    tag: "Ceramic",
  },
  {
    title: "Ceramic Coating (4 years)",
    price: 200,
    description: "Longer-term coating performance with easier maintenance.",
    tag: "Ceramic",
  },
  {
    title: "Ceramic Coating (50 months)",
    price: 250,
    description: "Extended protection for drivers who want maximum longevity.",
    tag: "Ceramic",
  },
];

function Price({ value }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-sm text-white/60">From</span>
      <span className="text-2xl font-semibold tracking-tight">${value}</span>
    </div>
  );
}

function Badge({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-white/80">
      {children}
    </span>
  );
}

function Card({ title, price, description, highlights, badge }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 shadow-sm backdrop-blur transition hover:border-white/20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
          {badge ? (
            <div className="mt-2">
              <Badge>{badge}</Badge>
            </div>
          ) : null}
        </div>
        <Price value={price} />
      </div>

      <p className="mt-3 text-sm text-white/70">{description}</p>

      {highlights?.length ? (
        <ul className="mt-5 space-y-2 text-sm text-white/70">
          {highlights.map((h) => (
            <li key={h} className="flex gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-white/50" />
              <span>{h}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-white/10 blur-3xl transition-opacity group-hover:opacity-80" />
    </div>
  );
}

function SmallRow({ name, price, description }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-5 transition hover:border-white/20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-medium">{name}</div>
          <div className="mt-1 text-sm text-white/70">{description}</div>
        </div>
        <Price value={price} />
      </div>
    </div>
  );
}

function ScrollRail({ title, subtitle, items }) {
  return (
    <section className="mt-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          {subtitle ? (
            <p className="mt-2 text-sm text-white/70">{subtitle}</p>
          ) : null}
        </div>

        <div className="hidden text-xs text-white/60 md:block">
          Scroll →
        </div>
      </div>

      <div className="mt-5 -mx-4 overflow-x-auto px-4 pb-2">
        <div className="flex min-w-max gap-4">
          {items.map((it) => (
            <div
              key={it.title}
              className="w-[280px] shrink-0 rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-5 transition hover:border-white/20"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm text-white/70">{it.tag}</div>
                  <div className="mt-1 font-semibold leading-snug">
                    {it.title}
                  </div>
                </div>
                <Price value={it.price} />
              </div>
              <p className="mt-3 text-sm text-white/70">{it.description}</p>
              <div className="mt-4 text-xs text-white/50">
                * Final pricing depends on vehicle size & condition.
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Services() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Top glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-white/10 to-transparent" />

      <main className="relative mx-auto w-full max-w-6xl px-4 py-14 sm:py-16">
        {/* Header */}
        <header className="flex flex-col gap-4">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
            <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
            Services & Pricing
          </div>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Clean. Protect. Restore.
          </h1>

          <p className="max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">
            Choose a detail package, then add protection or extras. All prices start
            at the listed amount and may vary based on vehicle size and condition.
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            <a
              href="#details"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:border-white/20"
            >
              View Details
            </a>
            <a
              href="#special"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:border-white/20"
            >
              Special Services
            </a>
            <a
              href="#addons"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:border-white/20"
            >
              Add-ons & Extras
            </a>
          </div>
        </header>

        {/* Detail services */}
        <section id="details" className="mt-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                Detail Packages
              </h2>
              <p className="mt-2 text-sm text-white/70">
                Pick a package that matches your needs and how often you maintain your vehicle.
              </p>
            </div>
            <div className="hidden text-xs text-white/60 sm:block">
              Starting prices shown
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {detailServices.map((s) => (
              <Card
                key={s.name}
                title={s.name}
                price={s.price}
                description={s.description}
                highlights={s.highlights}
                badge={s.badge}
              />
            ))}
          </div>
        </section>

        {/* Dummy comparison table text */}
        <section className="mt-10">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold tracking-tight">
                Package Comparison
              </h3>
              <Badge>Placeholder</Badge>
            </div>

            <p className="mt-3 text-sm text-white/70">
              Dummy comparison table text goes here. (Replace this section with your real
              comparison table showing what each detail service includes.)
            </p>

            <div className="mt-5 overflow-hidden rounded-xl border border-white/10">
              <div className="grid grid-cols-4 bg-white/5 text-xs text-white/70">
                <div className="p-3 font-medium">Feature</div>
                <div className="p-3 font-medium">Exterior</div>
                <div className="p-3 font-medium">Full</div>
                <div className="p-3 font-medium">Ultimate</div>
              </div>
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="grid grid-cols-4 border-t border-white/10 text-sm"
                >
                  <div className="p-3 text-white/70">Dummy row {i + 1}</div>
                  <div className="p-3 text-white/60">—</div>
                  <div className="p-3 text-white/60">—</div>
                  <div className="p-3 text-white/60">—</div>
                </div>
              ))}
            </div>

            <div className="mt-4 text-xs text-white/50">
              * This is placeholder content only.
            </div>
          </div>
        </section>

        {/* Special services */}
        <section id="special" className="mt-12">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-transparent p-6 sm:p-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
                  Special Services
                </div>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                  Correction & Coatings
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-white/70">
                  For noticeable gloss improvements and longer-term protection, choose an option below.
                </p>
              </div>

              <div className="mt-3 text-xs text-white/60 sm:mt-0">
                Swipe/scroll to see all options
              </div>
            </div>

            <ScrollRail
              title="Paint Correction"
              subtitle="Multiple stages depending on condition and desired finish."
              items={paintCorrectionOptions}
            />

            <ScrollRail
              title="Ceramic Coatings"
              subtitle="Longer protection options with increasing durability."
              items={ceramicCoatingOptions}
            />
          </div>
        </section>

        {/* Add-ons & extras */}
        <section id="addons" className="mt-12">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                Protection Add-ons
              </h2>
              <p className="mt-2 text-sm text-white/70">
                Add protection to enhance gloss and make cleaning easier.
              </p>

              <div className="mt-5 space-y-3">
                {protectionAddOns.map((a) => (
                  <SmallRow
                    key={a.name}
                    name={a.name}
                    price={a.price}
                    description={a.description}
                  />
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold tracking-tight">Extras</h2>
              <p className="mt-2 text-sm text-white/70">
                Targeted services to restore key areas.
              </p>

              <div className="mt-5 space-y-3">
                {extras.map((e) => (
                  <SmallRow
                    key={e.name}
                    name={e.name}
                    price={e.price}
                    description={e.description}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="mt-14">
          <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <h3 className="text-lg font-semibold tracking-tight">
                Ready to book?
              </h3>
              <p className="mt-1 text-sm text-white/70">
                Send your vehicle info and preferred date — we’ll confirm pricing and availability.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:opacity-90">
                Book Now
              </button>
              <button className="rounded-xl border border-white/10 bg-transparent px-5 py-2.5 text-sm font-semibold text-white/80 transition hover:border-white/20">
                Get a Quote
              </button>
            </div>
          </div>

          <div className="mt-6 text-xs text-white/50">
            Disclaimer: All services are priced “From” and may vary by vehicle size, condition, and requested results.
          </div>
        </section>
      </main>
    </div>
  );
}
