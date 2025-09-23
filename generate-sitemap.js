import { SitemapStream, streamToPromise } from "sitemap";
import { createWriteStream } from "fs";

// Your website URL
const siteUrl = "https://prime-detailing.vercel.app";

// List of your routes (update these as you add pages)
const links = [
  { url: "/", changefreq: "daily", priority: 1.0 },
  { url: "/services", changefreq: "monthly", priority: 0.8 },
  { url: "/gallery", changefreq: "monthly", priority: 0.7 },
  { url: "/contact", changefreq: "monthly", priority: 0.7 },
];

const stream = new SitemapStream({ hostname: siteUrl });
const writeStream = createWriteStream("./public/sitemap.xml");

streamToPromise(stream).then(() => console.log("✅ Sitemap generated!"));

links.forEach((link) => stream.write(link));
stream.end();
stream.pipe(writeStream);
