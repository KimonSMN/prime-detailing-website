import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, Shield, Palette, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

type ServiceDef = {
  id: "fullDetail" | "ceramicCoating" | "paintCorrection";
  icon: any;
  priceFrom: number; // just the number; currency via i18n
  durationLabelKey: string; // e.g. "3-4", "4-5", "6-8" -> we feed to i18n
};

const serviceDefs: ServiceDef[] = [
  { id: "fullDetail", icon: Car, priceFrom: 40, durationLabelKey: "3-4" },
  {
    id: "ceramicCoating",
    icon: Shield,
    priceFrom: 60,
    durationLabelKey: "4-5",
  },
  {
    id: "paintCorrection",
    icon: Palette,
    priceFrom: 100,
    durationLabelKey: "6-8",
  },
];

const Services = () => {
  const { t } = useTranslation();

  return (
    <section id="services" className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            {t("services.title.prefix")}{" "}
            <span className="bg-gold-gradient bg-clip-text text-transparent">
              {t("services.title.accent")}
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t("services.subtitle")}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-8">
          {serviceDefs.map((svc, index) => {
            const IconComponent = svc.icon;

            // pull localized fields by id
            const title = t(`services.items.${svc.id}.title`);
            const description = t(`services.items.${svc.id}.description`);
            const features = t(`services.items.${svc.id}.features`, {
              returnObjects: true,
            }) as string[];

            return (
              <Card
                key={svc.id}
                className="w-full md:w-[45%] lg:w-[30%] bg-card border-border hover:bg-card-hover transition-all duration-300 hover:shadow-elegant group animate-slide-up flex flex-col"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-gold-gradient rounded-full flex items-center justify-center mx-auto mb-4 group-hover:animate-glow-pulse">
                    <IconComponent className="w-8 h-8 text-primary-foreground" />
                  </div>

                  {/* lock heights so rows align */}
                  <CardTitle className="text-2xl font-bold text-foreground h-[4rem] overflow-hidden">
                    {title}
                  </CardTitle>

                  <CardDescription className="text-lg text-muted-foreground h-[5.25rem] overflow-hidden">
                    {description}
                  </CardDescription>
                </CardHeader>

                {/* Grow content and pin button bottom */}
                <CardContent className="space-y-6 flex flex-col flex-grow">
                  <div className="flex justify-between items-center text-center">
                    <div>
                      <p className="text-3xl font-bold bg-gold-gradient bg-clip-text text-transparent">
                        {t("services.fromPrice", {
                          price: `${svc.priceFrom}€`,
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t("services.labels.startingPrice")}
                      </p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-foreground">
                        {t("services.durationHours", {
                          hours: svc.durationLabelKey,
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t("services.labels.duration")}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 flex-grow">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      {t("services.whatsIncluded")}
                    </h4>
                    <ul className="space-y-1">
                      {features.map((feature, idx) => (
                        <li
                          key={idx}
                          className="text-muted-foreground flex items-center gap-2"
                        >
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-auto">
                    <Button
                      variant="hero"
                      className="w-full"
                      onClick={() => {
                        const bookingSection =
                          document.getElementById("booking");
                        const serviceSelect = document.getElementById(
                          "service-select"
                        ) as HTMLSelectElement | null;
                        if (bookingSection && serviceSelect) {
                          serviceSelect.value = svc.id; // FYI: if you're using shadcn <Select>, consider lifting state instead
                          bookingSection.scrollIntoView({ behavior: "smooth" });
                        } else if (bookingSection) {
                          bookingSection.scrollIntoView({ behavior: "smooth" });
                        }
                      }}
                    >
                      {t("services.bookThis")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Services;
