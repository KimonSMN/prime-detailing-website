// generate-sitemap.js
import { SitemapStream, streamToPromise } from "sitemap";
import { createWriteStream } from "fs";

const siteUrl = "https://prime-detailing.vercel.app";

// Your routes
const links = [
  { url: "/", changefreq: "daily", priority: 1.0 },
  { url: "/services", changefreq: "monthly", priority: 0.8 },
  { url: "/gallery", changefreq: "monthly", priority: 0.7 },
  { url: "/contact", changefreq: "monthly", priority: 0.8 },
];

async function generateSitemap() {
  const stream = new SitemapStream({ hostname: siteUrl });
  const writeStream = createWriteStream("./public/sitemap.xml");

  links.forEach((link) => stream.write(link));
  stream.end();

  const data = await streamToPromise(stream);
  writeStream.write(data.toString());
  writeStream.end();

  console.log("✅ Sitemap successfully generated!");
}

generateSitemap().catch(console.error);
