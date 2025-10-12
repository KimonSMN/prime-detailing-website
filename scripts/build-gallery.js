// scripts/build-gallery.js
import {
  readdir,
  mkdir,
  writeFile,
  stat,
  access,
  rename,
  unlink,
} from "node:fs/promises";
import { join, extname, basename } from "node:path";
import sharp from "sharp";

// ----------------- CONFIG -----------------
const SRC_DIR = "src/assets/gallery"; // originals here
const OUT_DIR = "public/gallery"; // variants + manifest here
const WIDTHS = [480, 960];
const QUALITY_WEBP = { 480: 70, 960: 65 };
const QUALITY_AVIF = { 480: 50, 960: 45 };

const GENERATE_AVIF = process.argv.includes("--avif");
const FORCE = process.argv.includes("--force");
const DRY_RUN = process.argv.includes("--dry");
const CONCURRENCY = 6;
const VALID_EXTS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".avif",
  ".heic",
  ".heif",
]);

// --------------- UTILITIES ----------------
async function ensureDir(p) {
  await mkdir(p, { recursive: true }).catch(() => {});
}
async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
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
function limit(n) {
  let active = 0,
    q = [];
  return async function (fn) {
    if (active >= n) await new Promise((r) => q.push(r));
    active++;
    try {
      return await fn();
    } finally {
      active--;
      const next = q.shift();
      if (next) next();
    }
  };
}
async function writeIfSmaller(tmpPath, finalPath) {
  const tmpStat = await stat(tmpPath).catch(() => null);
  const finalStat = await stat(finalPath).catch(() => null);
  if (!tmpStat) return false;
  const shouldReplace = !finalStat || tmpStat.size < finalStat.size;
  if (DRY_RUN) {
    await unlink(tmpPath).catch(() => {});
    return shouldReplace;
  }
  if (shouldReplace) {
    await rename(tmpPath, finalPath);
  } else {
    await unlink(tmpPath).catch(() => {});
  }
  return shouldReplace;
}

// --------------- BUILD VARIANTS ---------------
async function makeVariant(srcPath, outPath, w, fmt) {
  const pipeline = sharp(srcPath)
    .rotate()
    .resize({ width: w, withoutEnlargement: true });

  if (fmt === "webp") {
    const q = QUALITY_WEBP[w] ?? 70;
    pipeline.webp({
      quality: q,
      effort: 6,
      smartSubsample: true,
      alphaQuality: 70,
    });
  } else {
    const q = QUALITY_AVIF[w] ?? 50;
    pipeline.avif({ quality: q, effort: 4, chromaSubsampling: "4:2:0" });
  }

  pipeline.withMetadata({ orientation: 1 });

  if (DRY_RUN) return true;

  const tmp = outPath + ".tmp";
  await pipeline.toFile(tmp);
  const replaced = await writeIfSmaller(tmp, outPath);
  const label = replaced ? "✔ wrote" : "↷ kept existing (smaller)";
  console.log(`${label} ${outPath}`);
  return replaced;
}

// ----------------- MAIN -------------------
async function run() {
  await ensureDir(OUT_DIR);

  const files = (await readdir(SRC_DIR, { withFileTypes: true }))
    .filter((d) => d.isFile() && VALID_EXTS.has(extname(d.name).toLowerCase()))
    .map((d) => d.name)
    .sort((a, b) => a.localeCompare(b));

  const manifest = [];
  const gate = limit(CONCURRENCY);

  for (const name of files) {
    const srcPath = join(SRC_DIR, name);
    const id = idOf(name);
    const meta = await sharp(srcPath).metadata();
    const orientation = meta.orientation ?? 1;
    const isRotated = orientation >= 5 && orientation <= 8;
    const intrinsicWidth = (isRotated ? meta.height : meta.width) ?? 0;
    const intrinsicHeight = (isRotated ? meta.width : meta.height) ?? 0;

    if (!intrinsicWidth || !intrinsicHeight) {
      console.warn(`Skipping (no dimensions): ${name}`);
      continue;
    }

    const targetWidths = WIDTHS.filter((w) => w <= intrinsicWidth);
    if (targetWidths.length === 0) targetWidths.push(intrinsicWidth);

    const variants = [];
    const tasks = [];

    for (const w of targetWidths) {
      const webpOut = join(OUT_DIR, `${id}-w${w}.webp`);
      if (FORCE || !(await exists(webpOut))) {
        tasks.push(gate(() => makeVariant(srcPath, webpOut, w, "webp")));
      }
      variants.push({
        format: "webp",
        width: w,
        url: `/gallery/${id}-w${w}.webp`,
      });

      if (GENERATE_AVIF) {
        const avifOut = join(OUT_DIR, `${id}-w${w}.avif`);
        if (FORCE || !(await exists(avifOut))) {
          tasks.push(gate(() => makeVariant(srcPath, avifOut, w, "avif")));
        }
        variants.push({
          format: "avif",
          width: w,
          url: `/gallery/${id}-w${w}.avif`,
        });
      }
    }

    await Promise.all(tasks);

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

  if (!DRY_RUN) {
    await writeFile(
      join("public", "gallery-manifest.json"),
      JSON.stringify(manifest, null, 2),
      "utf8"
    );
  }

  console.log(`\n✅ Processed ${files.length} originals`);
  console.log(`✅ Manifest: public/gallery-manifest.json`);
  console.log(`✅ Variants in: ${OUT_DIR}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
