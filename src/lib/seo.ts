export const BASE_URL = "https://prime-detailing-cholargos.com";

export function buildCanonical(): string {
  // Keep full path and query (including ?lng=)
  return `${BASE_URL}${window.location.pathname}${window.location.search}`;
}

export function localeFor(i18nResolved: string | undefined): "el_GR" | "en_US" {
  return i18nResolved?.startsWith("el") ? "el_GR" : "en_US";
}
