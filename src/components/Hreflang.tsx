import { Helmet } from "react-helmet-async";

const BASE = "https://prime-detailing.vercel.app";

export function Hreflang() {
  const url = new URL(window.location.href);
  const path = url.pathname || "/";

  const el = new URLSearchParams(url.search);
  el.set("lng", "el");
  const en = new URLSearchParams(url.search);
  en.set("lng", "en");

  return (
    <Helmet>
      <link rel="alternate" href={`${BASE}${path}?${el}`} hrefLang="el" />
      <link rel="alternate" href={`${BASE}${path}?${en}`} hrefLang="en" />
      <link rel="alternate" href={`${BASE}${path}`} hrefLang="x-default" />
    </Helmet>
  );
}
