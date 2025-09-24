// Resize every /public/gallery/*.webp into 3 sizes + optional AVIF
import sharp from "sharp";
import { globby } from "globby";
import { basename, dirname, join } from "node:path";
import { mkdir, stat } from "node:fs/promises";

const INPUT_GLOB = "public/gallery/*.webp";
const SIZES = [480, 768, 1000]; // good enough for your 2-col grid on desktop
const QUALITY_WEBP = 78; // balance quality/size
const QUALITY_AVIF = 60;

function outName(fp, w, ext) {
  const base = basename(fp).replace(/\.webp$/i, "");
  return join(dirname(fp), `${base}-${w}.${ext}`);
}

async function exists(fp) {
  try {
    await stat(fp);
    return true;
  } catch {
    return false;
  }
}

const files = await globby([INPUT_GLOB]);
if (files.length === 0) {
  console.log("No images found in /public/gallery");
  process.exit(0);
}

for (const file of files) {
  await mkdir(dirname(file), { recursive: true });

  for (const w of SIZES) {
    const webpOut = outName(file, w, "webp");
    if (!(await exists(webpOut))) {
      await sharp(file)
        .resize({ width: w })
        .webp({ quality: QUALITY_WEBP })
        .toFile(webpOut);
      console.log("✓", webpOut);
    }

    // Optional AVIF (smaller files, modern browsers)
    const avifOut = outName(file, w, "avif");
    if (!(await exists(avifOut))) {
      await sharp(file)
        .resize({ width: w })
        .avif({ quality: QUALITY_AVIF })
        .toFile(avifOut);
      console.log("✓", avifOut);
    }
  }
}
console.log("Done.");
