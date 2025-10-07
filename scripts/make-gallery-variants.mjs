import { readdir, mkdir, writeFile, stat, access } from "node:fs/promises";
import { join, extname, basename } from "node:path";
import sharp from "sharp";

/**
 * CONFIG — keep it lean by default
 * - WIDTHS: pick 2–3 meaningful widths for your layout
 *   Your grid shows ~50vw on desktop within a ~1200px container → ~600px.
 *   So 640 & 1280 cover 1x and 2x DPR nicely.
 */
const SRC_DIR = "src/assets/gallery"; // originals go here
const OUT_DIR = "public/gallery"; // generated variants
const WIDTHS = [640, 1280, 1920]; // keep it lean; add 1920 if needed
const GENERATE_AVIF = false; // set true to also emit AVIF
const WEBP_QUALITY = 78; // 78–82 is a good range
const AVIF_QUALITY = 52; // only used if GENERATE_AVIF=true
const VALID_EXTS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".avif",
  ".heic",
  ".heif",
]);

/** utils */
async function ensureDir(p) {
  await mkdir(p, { recursive: true }).catch(() => {});
}
function idOf(file) {
  return basename(file, extname(file)).replace(/\s+/g, "-").toLowerCase();
}
function titleFromFilename(name) {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase())
    .trim();
}
async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

/** main */
async function run() {
  await ensureDir(OUT_DIR);

  const files = (await readdir(SRC_DIR, { withFileTypes: true }))
    .filter((d) => d.isFile() && VALID_EXTS.has(extname(d.name).toLowerCase()))
    .map((d) => d.name)
    .sort((a, b) => a.localeCompare(b));

  const manifest = [];

  for (const name of files) {
    const srcPath = join(SRC_DIR, name);
    const id = idOf(name);

    // Read metadata once to get EXIF orientation & intrinsic dims
    const meta = await sharp(srcPath).metadata();

    // Compute intrinsic width/height AFTER applying orientation
    const orientation = meta.orientation ?? 1;
    const isRotated = orientation >= 5 && orientation <= 8;
    const intrinsicWidth = isRotated ? meta.height : meta.width;
    const intrinsicHeight = isRotated ? meta.width : meta.height;

    if (!intrinsicWidth || !intrinsicHeight) {
      console.warn(`Skipping (no dimensions): ${name}`);
      continue;
    }

    // Filter widths: don’t upscale
    const targetWidths = WIDTHS.filter((w) => w <= intrinsicWidth);
    if (targetWidths.length === 0) {
      // if all targets are larger, at least generate one at original width
      targetWidths.push(intrinsicWidth);
    }

    const variants = [];

    for (const w of targetWidths) {
      // WEBP
      const webpOut = join(OUT_DIR, `${id}-w${w}.webp`);
      // Skip if already up-to-date (basic check by existence; feel free to compare mtimes if you want)
      if (!(await exists(webpOut))) {
        await sharp(srcPath)
          .rotate() // normalize EXIF orientation (applies rotation & clears tag)
          .resize({ width: w, withoutEnlargement: true })
          .webp({ quality: WEBP_QUALITY })
          .withMetadata({ orientation: 1 })
          .toFile(webpOut);
        console.log(`webp  → ${webpOut}`);
      }
      variants.push({
        format: "webp",
        width: w,
        url: `/gallery/${id}-w${w}.webp`,
      });

      // AVIF (optional)
      if (GENERATE_AVIF) {
        const avifOut = join(OUT_DIR, `${id}-w${w}.avif`);
        if (!(await exists(avifOut))) {
          await sharp(srcPath)
            .rotate()
            .resize({ width: w, withoutEnlargement: true })
            .avif({ quality: AVIF_QUALITY })
            .withMetadata({ orientation: 1 })
            .toFile(avifOut);
          console.log(`avif  → ${avifOut}`);
        }
        variants.push({
          format: "avif",
          width: w,
          url: `/gallery/${id}-w${w}.avif`,
        });
      }
    }

    const srcStat = await stat(srcPath).catch(() => null);
    manifest.push({
      id,
      alt: titleFromFilename(name),
      original: {
        width: intrinsicWidth,
        height: intrinsicHeight,
        bytes: srcStat?.size ?? null,
      },
      variants: variants.sort((a, b) => a.width - b.width),
    });
  }

  await writeFile(
    "public/gallery-manifest.json",
    JSON.stringify(manifest, null, 2),
    "utf8"
  );
  console.log(`✅ Processed ${files.length} originals`);
  console.log(`✅ Manifest: public/gallery-manifest.json`);
  console.log(`✅ Variants in: ${OUT_DIR}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
