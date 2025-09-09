import { Phone, Mail, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-secondary py-16 px-4 ">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 justify-items-center">
          {/* Company Info (narrow, centered) */}
          <div className="space-y-4 w-full max-w-xs text-center">
            <h3 className="text-2xl font-bold">
              <span className="text-foreground">Prime</span>
              <span className="bg-gold-gradient bg-clip-text text-transparent ml-2">
                Detailing
              </span>
            </h3>
            <p className="text-muted-foreground">
              Professional car detailing services that restore and protect your
              vehicle's appearance with premium care and attention to detail.
            </p>
          </div>

          {/* Contact Info */}
          <div className="space-y-4 w-full max-w-md">
            <h4 className="text-xl font-semibold text-foreground text-center md:text-left">
              Contact Us
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-muted-foreground justify-center md:justify-start">
                <Phone className="w-5 h-5 text-primary" />
                <a href="tel:+306939949788" className="hover:underline">
                  (+30) 6939949788
                </a>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground justify-center md:justify-start">
                <Mail className="w-5 h-5 text-primary" />
                <a
                  href="mailto:kimonsmirlianos@gmail.com"
                  className="hover:underline break-all"
                >
                  kimonsmirlianos@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground justify-center md:justify-start">
                <MapPin className="w-5 h-5 text-primary" />
                <span>Kleious 39, Cholargos 15561</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-8 text-center text-muted-foreground">
          <p>&copy; 2025 Prime Detailing. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
