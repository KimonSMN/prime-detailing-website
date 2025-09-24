import { useTranslation } from "react-i18next";
import { useEffect } from "react";

function FlagEN() {
  // Simplified UK flag (Union Jack)
  return (
    <svg viewBox="0 0 60 36" className="h-4 w-6 rounded-sm overflow-hidden">
      <rect width="60" height="36" fill="#012169" />
      <path d="M0,0 60,36 M60,0 0,36" stroke="#fff" strokeWidth="10" />
      <path d="M0,0 60,36 M60,0 0,36" stroke="#C8102E" strokeWidth="6" />
      <path d="M30,0 v36 M0,18 h60" stroke="#fff" strokeWidth="12" />
      <path d="M30,0 v36 M0,18 h60" stroke="#C8102E" strokeWidth="8" />
    </svg>
  );
}

function FlagEL() {
  // Greek flag
  return (
    <svg viewBox="0 0 90 60" className="h-4 w-6 rounded-sm overflow-hidden">
      <rect width="90" height="60" fill="#0D5EAF" />
      {Array.from({ length: 5 }).map((_, i) => (
        <rect key={i} y={i * 12 + 6} width="90" height="6" fill="#fff" />
      ))}
      <rect width="36" height="36" fill="#0D5EAF" />
      <rect y="15" width="36" height="6" fill="#fff" />
      <rect x="15" width="6" height="36" fill="#fff" />
    </svg>
  );
}

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const isEL = i18n.resolvedLanguage?.startsWith("el");

  const setLang = (lng: "en" | "el") => {
    i18n.changeLanguage(lng);
    localStorage.setItem("i18nextLng", lng);
    document.documentElement.lang = lng;

    // Update the URL without reload
    const url = new URL(window.location.href);
    url.searchParams.set("lng", lng);
    window.history.pushState({}, "", url);
  };

  useEffect(() => {
    // Sync on back/forward: if URL lng changes, update i18n
    const onPopState = () => {
      const url = new URL(window.location.href);
      const lng = (url.searchParams.get("lng") as "en" | "el") || null;
      if (lng && i18n.resolvedLanguage !== lng) i18n.changeLanguage(lng);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [i18n]);

  return (
    <div
      className="relative select-none"
      role="group"
      aria-label="Language Switcher"
    >
      <div className="relative flex items-center gap-1 rounded-full bg-background/70 backdrop-blur px-1 py-1 border border-border shadow-sm">
        {/* Animated pill */}
        <div
          className={`absolute top-1 bottom-1 w-[50%] rounded-full bg-primary/10 transition-all duration-300 ${
            isEL ? "right-1" : "left-1"
          }`}
          aria-hidden="true"
        />
        <button
          type="button"
          onClick={() => setLang("en")}
          className={`relative z-10 flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${
            !isEL ? "text-primary" : "text-foreground/70 hover:text-foreground"
          }`}
          aria-pressed={!isEL}
        >
          <FlagEN />
          <span className="text-sm font-medium">EN</span>
        </button>
        <button
          type="button"
          onClick={() => setLang("el")}
          className={`relative z-10 flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${
            isEL ? "text-primary" : "text-foreground/70 hover:text-foreground"
          }`}
          aria-pressed={isEL}
        >
          <FlagEL />
          <span className="text-sm font-medium">EL</span>
        </button>
      </div>
    </div>
  );
}
