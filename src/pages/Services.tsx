import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Car,
  Shield,
  Palette,
  Sparkles,
  Droplets,
  Crown,
  Wrench,
  Settings,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

type ServiceDef = {
  id:
    | "basicWash"
    | "fullDetail"
    | "ceramicCoating"
    | "paintCorrection"
    | "ultimateDetail";
  icon: any;
  priceFrom?: number;
  durationLabelKey?: string;
};

const serviceDefs: ServiceDef[] = [
  {
    id: "basicWash",
    icon: Droplets,
    priceFrom: 20,
    durationLabelKey: "1-2",
  },
  {
    id: "fullDetail",
    icon: Car,
    priceFrom: 40,
    durationLabelKey: "3-4",
  },
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
  {
    id: "ultimateDetail",
    icon: Crown,
  },
];

const addons = [
  {
    id: "engineBay",
    title: "Engine Bay Clean",
    icon: Wrench,
    priceFrom: 40,
    features: ["Degrease & clean engine surfaces", "Plastics dressed"],
  },
  {
    id: "clayBar",
    title: "Clay Bar Decontamination",
    icon: Settings,
    priceFrom: 50,
    features: [
      "Removes bonded contaminants",
      "Prepares paint for polish/protection",
    ],
  },
];

const Services = () => {
  const { t } = useTranslation();

  return (
    <section id="services" className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Services */}
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
                  <CardTitle className="text-2xl font-bold text-foreground">
                    {title}
                  </CardTitle>
                  <CardDescription className="text-lg text-muted-foreground">
                    {description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6 flex flex-col flex-grow">
                  {svc.priceFrom && svc.durationLabelKey && (
                    <div className="flex justify-between items-center text-center">
                      <div>
                        <p className="text-3xl font-bold bg-gold-gradient bg-clip-text text-transparent">
                          {t("services.fromPrice", {
                            price: `${svc.priceFrom}€`,
                          })}
                        </p>
                        <p className="text-sm text-white">
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
                  )}

                  <div className="space-y-2 flex-grow">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      {t("services.whatsIncluded")}
                    </h4>
                    <ul className="space-y-1">
                      {features.map((feature, idx) => (
                        <li
                          key={idx}
                          className="text-muted-foreground flex gap-2"
                        >
                          <span className="relative mt-1.5 flex-shrink-0 w-1.5 h-1.5 bg-primary rounded-full"></span>
                          <span className="flex-1">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-auto">
                    <NavLink to={`/booking?serviceId=${svc.id}`}>
                      <Button variant="hero" className="w-full">
                        {svc.id === "ultimateDetail"
                          ? t("services.requestQuote")
                          : t("services.bookThis")}
                      </Button>
                    </NavLink>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        {/* Add-ons
        <div className="text-center mt-20 mb-12">
          <h3 className="text-3xl font-bold">
            {t("services.addons.title", "Add-Ons")}
          </h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t(
              "services.addons.subtitle",
              "Enhance your detailing package with these extras"
            )}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-8">
          {addons.map((addon, index) => {
            const IconComponent = addon.icon;
            return (
              <Card
                key={addon.id}
                className="w-full md:w-[45%] lg:w-[30%] bg-card border-border hover:bg-card-hover transition-all duration-300 hover:shadow-elegant group animate-slide-up flex flex-col"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-gold-gradient rounded-full flex items-center justify-center mx-auto mb-4 group-hover:animate-glow-pulse">
                    <IconComponent className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-xl font-bold text-foreground">
                    {addon.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-6 flex flex-col flex-grow">
                  <div className="text-center">
                    <p className="text-2xl font-bold bg-gold-gradient bg-clip-text text-transparent">
                      {t("services.fromPrice", {
                        price: `${addon.priceFrom}€`,
                      })}
                    </p>
                  </div>

                  <div className="space-y-2 flex-grow">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      {t("services.whatsIncluded")}
                    </h4>
                    <ul className="space-y-1">
                      {addon.features.map((feature, idx) => (
                        <li
                          key={idx}
                          className="text-muted-foreground flex gap-2"
                        >
                          <span className="relative mt-1.5 flex-shrink-0 w-1.5 h-1.5 bg-primary rounded-full"></span>
                          <span className="flex-1">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-auto">
                    <NavLink to={`/booking?addonId=${addon.id}`}>
                      <Button variant="secondary" className="w-full">
                        {t("services.bookThis")}
                      </Button>
                    </NavLink>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div> */}
      </div>
    </section>
  );
};

export default Services;
