import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-car-detailing.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        // style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-hero-gradient opacity-80"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto animate-fade-in">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
          <span className="text-foreground">Prime</span>
          <span className="bg-gold-gradient bg-clip-text text-transparent ml-4">
            Detailing
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed max-w-2xl mx-auto">
          Transform your vehicle with our premium detailing services.
          Professional care that makes your car shine like new.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up">
          <Button
            variant="hero"
            size="lg"
            className="text-lg px-8 py-6 h-auto"
            onClick={() =>
              document
                .getElementById("booking")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Book Appointment
          </Button>
          <Button
            variant="premium"
            size="lg"
            className="text-lg px-8 py-6 h-auto"
            onClick={() =>
              document
                .getElementById("services")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            View Services
          </Button>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 rounded-full flex justify-center border-[#99CCFF]">
          <div className="w-1 h-3 rounded-full mt-2 animate-pulse bg-[#99CCFF]"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
