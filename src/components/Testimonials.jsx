import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Star } from "lucide-react";

// Replace with real reviews (name, car, text, rating 1..5)
const REVIEWS = [
  {
    name: "Nikos P.",
    car: "VW Golf",
    text: "Άψογη δουλειά! Το αυτοκίνητο δείχνει καλύτερο από καινούριο. Πολύ προσεκτικοί και επαγγελματίες.",
    rating: 5,
  },
  {
    name: "Maria K.",
    car: "Mini Cooper",
    text: "Το ceramic coating άξιζε 100%. Το νερό φεύγει αμέσως και το πλύσιμο είναι παιχνιδάκι.",
    rating: 5,
  },
  {
    name: "George S.",
    car: "BMW 3 Series",
    text: "Έβγαλαν στροβιλισμούς και γρατζουνιές που με ενοχλούσαν χρόνια. Ειλικρινείς και σχολαστικοί.",
    rating: 5,
  },
];

const Testimonials = ({ averageRating, reviewCount }) => {
  const { t } = useTranslation();

  const aggRatingJsonLd = useMemo(() => {
    if (!averageRating || !reviewCount) return null;
    const json = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: "Prime Detailing Cholargos",
      url: "https://prime-detailing.vercel.app/",
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: averageRating.toFixed(1),
        reviewCount: reviewCount,
        bestRating: "5",
        worstRating: "1",
      },
    };
    return JSON.stringify(json);
  }, [averageRating, reviewCount]);

  return (
    <section
      id="testimonials"
      className="px-4 py-14 md:py-20 bg-muted/20"
      aria-label={t("testimonials.aria", "Customer testimonials")}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
            {t("testimonials.heading", "What Clients Say")}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {t(
              "testimonials.subheading",
              "Real results, happy drivers — detailing trusted in Cholargos & Athens."
            )}
          </p>

          {/* Optional rating summary row */}
          {averageRating && reviewCount ? (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-card border px-3 py-1.5">
              <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.round(averageRating)
                        ? "text-primary fill-primary"
                        : "text-muted-foreground"
                    }`}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <span className="text-sm text-foreground font-medium">
                {t("testimonials.ratingLabel", "{{rating}}/5 average", {
                  rating: averageRating.toFixed(1),
                })}
              </span>
              <span className="text-sm text-muted-foreground">
                ·{" "}
                {t("testimonials.reviewCount", "{{count}} reviews", {
                  count: reviewCount,
                })}
              </span>
            </div>
          ) : null}
        </div>

        {/* Reviews grid */}
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {REVIEWS.map((r, idx) => (
            <li
              key={idx}
              className="h-full rounded-2xl border bg-card p-6 flex flex-col"
              itemScope
              itemType="https://schema.org/Review"
            >
              <meta
                itemProp="itemReviewed"
                content="Prime Detailing Cholargos"
              />
              <div
                className="flex items-center gap-1 mb-3"
                aria-label={t("testimonials.starAria", "Review rating")}
              >
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < r.rating
                        ? "text-primary fill-primary"
                        : "text-muted-foreground"
                    }`}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <p
                className="text-foreground leading-relaxed"
                itemProp="reviewBody"
              >
                {r.text}
              </p>

              <div className="mt-5 flex items-center justify-between text-sm text-muted-foreground">
                <span
                  itemProp="author"
                  itemScope
                  itemType="https://schema.org/Person"
                >
                  <span itemProp="name">{r.name}</span>
                </span>
                <span
                  aria-label={t("testimonials.carOfClient", "Customer vehicle")}
                >
                  {r.car}
                </span>
              </div>
            </li>
          ))}
        </ul>

        {/* CTA row (instead of booking section) */}
        <div className="mt-10 text-center">
          <a
            href="/services"
            className="inline-flex items-center justify-center rounded-xl border bg-primary text-primary-foreground px-6 py-3 text-base font-medium hover:opacity-95 transition"
            aria-label={t("testimonials.ctaAria", "See all detailing services")}
          >
            {t("testimonials.cta", "See Services")}
          </a>
        </div>
      </div>

      {/* AggregateRating JSON-LD for rich snippets (only if numbers provided) */}
      {aggRatingJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: aggRatingJsonLd }}
        />
      ) : null}
    </section>
  );
};

export default Testimonials;
