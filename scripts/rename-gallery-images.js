// scripts/rename-gallery-images.js
import { readdir, rename } from "node:fs/promises";
import { join, extname } from "node:path";

// ---------------- CONFIG ----------------
const SRC_DIR = "src/assets/gallery"; // project folders live here
const VALID_EXTS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".avif",
  ".heic",
  ".heif",
]);

// ---------------- UTILITIES ----------------
function slugify(s) {
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

// ---------------- MAIN ----------------
async function run() {
  // read project folders
  const projectDirs = (await readdir(SRC_DIR, { withFileTypes: true }))
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort((a, b) => a.localeCompare(b));

  for (const folderName of projectDirs) {
    const projectSlug = slugify(folderName);
    const projectPath = join(SRC_DIR, folderName);

    const files = (await readdir(projectPath, { withFileTypes: true }))
      .filter((d) => d.isFile() && VALID_EXTS.has(extname(d.name).toLowerCase()))
      .map((d) => d.name)
      .sort((a, b) => a.localeCompare(b));

    let counter = 1;

    for (const filename of files) {
      const ext = extname(filename).toLowerCase();
      const newName = `${projectSlug}-${counter}${ext}`;
      const oldPath = join(projectPath, filename);
      const newPath = join(projectPath, newName);

      if (filename !== newName) {
        await rename(oldPath, newPath);
        console.log(`Renamed: ${filename} → ${newName}`);
      }

      counter++;
    }
  }

  console.log(`\n✅ Finished renaming images in ${projectDirs.length} project folders.`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});