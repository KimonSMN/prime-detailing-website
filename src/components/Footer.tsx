import { Phone, Mail, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-secondary py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 justify-items-center">
          {/* Company Info (narrow, centered) */}
          <div className="space-y-4 w-full max-w-xs text-center">
            <h3 className="text-2xl font-bold">
              <span className="text-foreground">{t("footer.title.prime")}</span>
              <span className="bg-gold-gradient bg-clip-text text-transparent ml-2">
                {t("footer.title.detailing")}
              </span>
            </h3>
            <p className="text-muted-foreground">{t("footer.tagline")}</p>
          </div>

          {/* Contact Info */}
          <div className="space-y-4 w-full max-w-md">
            <h4 className="text-xl font-semibold text-foreground text-center md:text-left">
              {t("footer.contact")}
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-muted-foreground justify-center md:justify-start">
                <Phone className="w-5 h-5 text-primary" />
                <a
                  href="tel:+306939949788"
                  className="hover:underline"
                  aria-label={t("footer.phoneAria")}
                >
                  {t("footer.phone")}
                </a>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground justify-center md:justify-start">
                <Mail className="w-5 h-5 text-primary" />
                <a
                  href="mailto:kimonsmirlianos@gmail.com"
                  className="hover:underline break-all"
                  aria-label={t("footer.emailAria")}
                >
                  {t("footer.email")}
                </a>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground justify-center md:justify-start">
                <MapPin className="w-5 h-5 text-primary" />
                <span>{t("footer.address")}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-8 text-center text-muted-foreground">
          <p>{t("footer.copyright", { year })}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
