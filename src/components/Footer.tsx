import { Phone, Mail, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-background py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 justify-items-center">
          {/* Company Info (narrow, centered) */}
          <div className="space-y-4 w-full max-w-xs text-center">
            <h3 className="text-2xl font-bold">
              <span className="text-foreground">{t("footer.title.prime")}</span>
              <span className="text-secondary ml-2">
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
                <Phone className="w-5 h-5 text-secondary" />
                <a
                  href="tel:+306939949788"
                  className="hover:underline"
                  aria-label={t("footer.phoneAria")}
                >
                  {t("footer.phone")}
                </a>
              </div>
              <div className="flex items-center gap-3 text-zinc-400 justify-center md:justify-start">
                <Mail className="w-5 h-5 text-secondary" />
                <a
                  href="mailto:kimonsmirlianos@gmail.com"
                  className="hover:underline break-all"
                  aria-label={t("footer.emailAria")}
                >
                  {t("footer.email")}
                </a>
              </div>
              <div className="flex items-center gap-3 text-zinc-400 justify-center md:justify-start">
                <MapPin className="w-5 h-5 text-secondary" />
                <a
                  href="https://maps.app.goo.gl/spdExjQ9h5NxUgze8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {t("footer.address")}
                </a>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground justify-center md:justify-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 text-secondary"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M7 2C4.243 2 2 4.243 2 7v10c0 2.757 2.243 5 5 5h10c2.757 0 5-2.243 5-5V7c0-2.757-2.243-5-5-5H7zm10 2c1.654 0 3 1.346 3 3v10c0 1.654-1.346 3-3 3H7c-1.654 0-3-1.346-3-3V7c0-1.654 1.346-3 3-3h10zm-5 3a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6zm4.5-.75a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0z" />
                </svg>

                <a
                  href="https://instagram.com/primedetailing.ath"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  primedetailing.ath
                </a>
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
