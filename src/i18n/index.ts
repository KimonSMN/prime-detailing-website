import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en/common.json";
import el from "./locales/el/common.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: en },
      el: { common: el },
    },
    fallbackLng: "en",
    supportedLngs: ["en", "el"],
    ns: ["common"],
    defaultNS: "common",
    interpolation: { escapeValue: false },
    detection: {
      // Querystring should be first so ?lng= overrides cache & browser
      order: ["querystring", "localStorage", "htmlTag", "navigator"],
      lookupQuerystring: "lng",
      caches: ["localStorage"],
    },
  });

// keep <html lang> correct
i18n.on("languageChanged", (lng) => {
  document.documentElement.lang = lng || "en";
});
