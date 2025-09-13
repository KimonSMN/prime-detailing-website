import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, Shield, Palette, Sparkles } from "lucide-react";

const services = [
  {
    id: "full-detail",
    title: "Full Exterior & Interior Detail",
    description:
      "Professional detailing service that transforms your vehicle inside and out with comprehensive cleaning and protection.",
    price: "From 40€",
    duration: "3-4 hours",
    icon: Car,
    features: [
      "Contactless pre-wash & hand wash",
      "Paint surface decontamination (removes tar, sap, and bonded contaminants)",
      "Wheel & tire detailing (deep clean + dressing)",
      "Interior deep cleaning (vacuuming, carpets, seats, vents, trims)",
      "Plastic trim conditioning & UV protection",
      "Leather cleaning & conditioning",
      "Streak-free glass cleaning (inside & out)",
    ],
  },
  {
    id: "ceramic-coating",
    title: "Ceramic Coating Package",
    description:
      "Includes Full Exterior & Interior Detail plus professional-grade ceramic coating for ultimate protection.",
    price: "From 60€",
    duration: "4-5 hours",
    icon: Shield,
    features: [
      "Professional-grade ceramic coating applied to all painted surfaces",
      "Hydrophobic protection for easier washing and water beading",
      "Enhanced gloss and depth of paint color",
      "Long-lasting protection against UV rays, dirt, and contaminants",
    ],
  },
  {
    id: "paint-correction",
    title: "Paint Correction Package",
    description:
      "Complete paint restoration service with multi-stage correction, ceramic coating, and comprehensive detailing.",
    price: "From 100€",
    duration: "6-8 hours",
    icon: Palette,
    features: [
      "Complete Full Exterior & Interior Detail",
      "Paint defect analysis & inspection",
      "Multi-stage paint correction (machine polishing to restore clarity)",
      "Swirl mark, oxidation & light scratch removal",
      "Ceramic coating application for added protection and shine",
      "Paint protection guarantee",
    ],
  },
];

const Services = () => {
  return (
    <section id="services" className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Our{" "}
            <span className="bg-gold-gradient bg-clip-text text-transparent">
              Services
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Professional car detailing services designed to restore and protect
            your vehicle's appearance
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-8">
          {services.map((service, index) => {
            const IconComponent = service.icon;
            return (
              <Card
                key={service.id}
                className="w-full md:w-[45%] lg:w-[30%] bg-card border-border hover:bg-card-hover transition-all duration-300 hover:shadow-elegant group animate-slide-up"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-gold-gradient rounded-full flex items-center justify-center mx-auto mb-4 group-hover:animate-glow-pulse">
                    <IconComponent className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-foreground">
                    {service.title}
                  </CardTitle>
                  <CardDescription className="text-lg text-muted-foreground">
                    {service.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="flex justify-between items-center text-center">
                    <div>
                      <p className="text-3xl font-bold bg-gold-gradient bg-clip-text text-transparent">
                        {service.price}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Starting price
                      </p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-foreground">
                        {service.duration}
                      </p>
                      <p className="text-sm text-muted-foreground">Duration</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      What's Included:
                    </h4>
                    <ul className="space-y-1">
                      {service.features.map((feature, idx) => (
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

                  <Button
                    variant="hero"
                    className="w-full"
                    onClick={() => {
                      const bookingSection = document.getElementById("booking");
                      const serviceSelect = document.getElementById(
                        "service-select"
                      ) as HTMLSelectElement;
                      if (bookingSection && serviceSelect) {
                        serviceSelect.value = service.id;
                        bookingSection.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                  >
                    Book This Service
                  </Button>
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
