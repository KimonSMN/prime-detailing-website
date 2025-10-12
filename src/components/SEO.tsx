import { Helmet } from "react-helmet-async";

type LinkTag = {
  rel: string;
  href: string;
  as?: string;
  imagesrcset?: string;
  imagesizes?: string;
  crossOrigin?: "anonymous" | "use-credentials";
};

type Props = {
  title: string;
  description: string;
  canonical: string;
  locale?: "el_GR" | "en_US";
  image?: string;
  robots?: string;
  jsonLd?: object | object[];
  siteName?: string;
  links?: LinkTag[];
};

export function Seo({
  title,
  description,
  canonical,
  locale = "el_GR",
  image = "https://prime-detailing-cholargos.com/og-default.webp",
  robots = "index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1",
  jsonLd,
  siteName = "Prime Detailing Cholargos",
  links = [],
}: Props) {
  // derive site origin for preconnect/dns-prefetch
  let origin: string | undefined;
  try {
    origin = new URL(canonical).origin;
  } catch {
    try {
      origin = new URL(image).origin;
    } catch {}
  }

  return (
    <>
      <Helmet prioritizeSeoTags>
        {/* Preconnect to your own origin (and dns-prefetch) */}
        {origin && (
          <>
            <link rel="preconnect" href={origin} />
            <link rel="dns-prefetch" href={origin} />
          </>
        )}

        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta name="robots" content={robots} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={siteName} />
        <meta property="og:url" content={canonical} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:locale" content={locale} />
        <meta property="og:image" content={image} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={image} />

        {/* Extra link tags (e.g., hero preload) */}
        {links.map((link, i) => (
          <link key={i} {...link} />
        ))}
      </Helmet>

      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
    </>
  );
}
