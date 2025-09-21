import { useTranslation } from "react-i18next";
import { CheckCircle } from "lucide-react";

const USPIntro = () => {
  const { t } = useTranslation();

  return (
    <section
      id="intro"
      className="px-4 py-12 md:py-16 bg-background"
      aria-label={t("intro.aria", "About Prime Detailing in Cholargos, Athens")}
    >
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
          {t("intro.heading", "Showroom Shine, Every Time")}
        </h2>

        <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
          {t(
            "intro.body",
            "We are a local, family-run detailing studio in Cholargos, Athens, delivering precision paint correction, long-lasting ceramic coatings, and meticulous interior care. We use premium products and proven techniques to protect your investment and keep it looking like new."
          )}
        </p>

        {/* Three quick USPs */}
        <ul className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          <li className="flex items-start gap-3 p-4 rounded-xl border bg-card">
            <CheckCircle
              className="mt-0.5 h-5 w-5 text-primary flex-shrink-0"
              aria-hidden="true"
            />
            <div>
              <p className="font-medium text-foreground">
                {t("intro.usp.premiumTitle", "Premium Products")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t(
                  "intro.usp.premiumDesc",
                  "Top-grade coatings and safe wash methods."
                )}
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3 p-4 rounded-xl border bg-card">
            <CheckCircle
              className="mt-0.5 h-5 w-5 text-primary flex-shrink-0"
              aria-hidden="true"
            />
            <div>
              <p className="font-medium text-foreground">
                {t("intro.usp.experienceTitle", "Expert Correction")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t(
                  "intro.usp.experienceDesc",
                  "Swirl, haze, and light scratch removal for true gloss."
                )}
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3 p-4 rounded-xl border bg-card">
            <CheckCircle
              className="mt-0.5 h-5 w-5 text-primary flex-shrink-0"
              aria-hidden="true"
            />
            <div>
              <p className="font-medium text-foreground">
                {t("intro.usp.localTitle", "Local & Trusted")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t(
                  "intro.usp.localDesc",
                  "Serving Cholargos and greater Athens with care."
                )}
              </p>
            </div>
          </li>
        </ul>
      </div>
    </section>
  );
};

export default USPIntro;
