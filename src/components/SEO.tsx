import { Helmet } from "react-helmet-async";

type Props = {
  title: string;
  description: string;
  canonical: string;
  locale?: "el_GR" | "en_US";
  image?: string;
  robots?: string;
  jsonLd?: object | object[];
  siteName?: string;
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
}: Props) {
  return (
    <>
      <Helmet prioritizeSeoTags>
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
