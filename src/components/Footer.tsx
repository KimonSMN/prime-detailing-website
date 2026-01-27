import { Phone, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-background border-t border-border">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-center w-full">
          {/* Mobile: column, Desktop: row */}
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 py-5 text-md sm:whitespace-nowrap">
            <a
              href="tel:+306939949788"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={t("footer.phoneAria")}
            >
              <Phone className="w-4 h-4 text-secondary" />
              {t("footer.phone")}
            </a>

            <a
              href="https://maps.app.goo.gl/spdExjQ9h5NxUgze8"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <MapPin className="w-4 h-4 text-secondary" />
              {t("footer.address")}
            </a>

            <a
              href="https://instagram.com/primedetailing.ath"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 text-secondary"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M7 2C4.243 2 2 4.243 2 7v10c0 2.757 2.243 5 5 5h10c2.757 0 5-2.243 5-5V7c0-2.757-2.243-5-5-5H7zm10 2c1.654 0 3 1.346 3 3v10c0 1.654-1.346 3-3 3H7c-1.654 0-3-1.346-3-3V7c0-1.654 1.346-3 3-3h10zm-5 3a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6zm4.5-.75a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0z" />
              </svg>
              primedetailing.ath
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
