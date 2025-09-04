import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, Palette, Sparkles } from "lucide-react";

const services = [
  {
    id: "full-detail",
    title: "Full Exterior & Interior Detail",
    description: "Complete transformation of your vehicle inside and out. Includes wash, wax, interior deep clean, and protection.",
    price: "From $299",
    duration: "4-6 hours",
    icon: Car,
    features: [
      "Exterior hand wash & dry",
      "Paint decontamination",
      "Wheel & tire detailing", 
      "Interior deep cleaning",
      "Leather conditioning",
      "Glass cleaning"
    ]
  },
  {
    id: "paint-correction",
    title: "Paint Correction Package",
    description: "Premium paint correction service that includes full exterior & interior detail plus advanced paint restoration.",
    price: "From $599", 
    duration: "8-12 hours",
    icon: Palette,
    features: [
      "Everything in Full Detail",
      "Paint defect analysis",
      "Multi-stage paint correction",
      "Swirl mark removal",
      "Ceramic coating application",
      "Paint protection guarantee"
    ]
  }
];

const Services = () => {
  return (
    <section id="services" className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Our <span className="bg-gold-gradient bg-clip-text text-transparent">Services</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Professional car detailing services designed to restore and protect your vehicle's appearance
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {services.map((service, index) => {
            const IconComponent = service.icon;
            return (
              <Card 
                key={service.id}
                className="bg-card border-border hover:bg-card-hover transition-all duration-300 hover:shadow-elegant group animate-slide-up"
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
                      <p className="text-sm text-muted-foreground">Starting price</p>
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
                        <li key={idx} className="text-muted-foreground flex items-center gap-2">
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
                      const bookingSection = document.getElementById('booking');
                      const serviceSelect = document.getElementById('service-select') as HTMLSelectElement;
                      if (bookingSection && serviceSelect) {
                        serviceSelect.value = service.id;
                        bookingSection.scrollIntoView({ behavior: 'smooth' });
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