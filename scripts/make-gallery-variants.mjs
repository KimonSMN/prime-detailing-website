import { readdir, mkdir, writeFile, stat, access } from "node:fs/promises";
import { join, extname, basename } from "node:path";
import sharp from "sharp";

/**
 * CONFIG
 */
const SRC_DIR = "src/assets/gallery"; // project folders live here
const OUT_DIR = "public/gallery"; // output per project here
const WIDTHS = [640, 1280, 1920];
const GENERATE_AVIF = false;
const WEBP_QUALITY = 78;
const AVIF_QUALITY = 52;

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

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

function slugify(s) {
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

function imageIdOf(file) {
  return basename(file, extname(file)).replace(/\s+/g, "-").toLowerCase();
}

function titleFromFilename(name) {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase())
    .trim();
}

/** main */
async function run() {
  await ensureDir(OUT_DIR);

  // 1) read project folders
  const projectFolders = (await readdir(SRC_DIR, { withFileTypes: true }))
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort((a, b) => a.localeCompare(b));

  const manifest = [];
  let totalOriginals = 0;

  for (const folderName of projectFolders) {
    const projectTitle = folderName; // keep exact folder name for display
    const projectId = slugify(folderName);

    const projectSrcDir = join(SRC_DIR, folderName);
    const projectOutDir = join(OUT_DIR, projectId);

    await ensureDir(projectOutDir);

    // 2) read images inside this folder
    const files = (await readdir(projectSrcDir, { withFileTypes: true }))
      .filter(
        (d) => d.isFile() && VALID_EXTS.has(extname(d.name).toLowerCase()),
      )
      .map((d) => d.name)
      .sort((a, b) => a.localeCompare(b));

    if (files.length === 0) continue;

    for (const name of files) {
      totalOriginals++;

      const srcPath = join(projectSrcDir, name);
      const imageId = imageIdOf(name);

      // Read metadata once to get EXIF orientation & intrinsic dims
      const meta = await sharp(srcPath).metadata();

      const orientation = meta.orientation ?? 1;
      const isRotated = orientation >= 5 && orientation <= 8;
      const intrinsicWidth = isRotated ? meta.height : meta.width;
      const intrinsicHeight = isRotated ? meta.width : meta.height;

      if (!intrinsicWidth || !intrinsicHeight) {
        console.warn(`Skipping (no dimensions): ${folderName}/${name}`);
        continue;
      }

      // Filter widths: don’t upscale
      const targetWidths = WIDTHS.filter((w) => w <= intrinsicWidth);
      if (targetWidths.length === 0) targetWidths.push(intrinsicWidth);

      const variants = [];

      for (const w of targetWidths) {
        // WEBP
        const webpOut = join(projectOutDir, `${imageId}-w${w}.webp`);
        if (!(await exists(webpOut))) {
          await sharp(srcPath)
            .rotate()
            .resize({ width: w, withoutEnlargement: true })
            .webp({ quality: WEBP_QUALITY })
            .withMetadata({ orientation: 1 })
            .toFile(webpOut);

          console.log(`webp  → ${webpOut}`);
        }

        variants.push({
          format: "webp",
          width: w,
          url: `/gallery/${projectId}/${imageId}-w${w}.webp`,
        });

        // AVIF (optional)
        if (GENERATE_AVIF) {
          const avifOut = join(projectOutDir, `${imageId}-w${w}.avif`);
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
            url: `/gallery/${projectId}/${imageId}-w${w}.avif`,
          });
        }
      }

      const srcStat = await stat(srcPath).catch(() => null);

      manifest.push({
        id: `${projectId}/${imageId}`, // globally unique
        project: { id: projectId, title: projectTitle },
        alt: titleFromFilename(name),
        original: {
          width: intrinsicWidth,
          height: intrinsicHeight,
          bytes: srcStat?.size ?? null,
        },
        variants: variants.sort((a, b) => a.width - b.width),
      });
    }
  }

  await writeFile(
    "public/gallery-manifest.json",
    JSON.stringify(manifest, null, 2),
    "utf8",
  );

  console.log(`✅ Processed ${totalOriginals} originals`);
  console.log(`✅ Manifest: public/gallery-manifest.json`);
  console.log(`✅ Variants in: ${OUT_DIR}/<projectId>/...`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
