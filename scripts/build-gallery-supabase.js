// scripts/build-gallery-supabase.js
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";
import 'dotenv/config'; // loads .env automatically

// ----------------- CONFIG -----------------
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error("VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set in .env");
  process.exit(1);
}
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const BUCKET = "images"; // bucket name
const MANIFEST_PATH = "public/gallery-manifest.json";

const WIDTHS = [480, 960];
const GENERATE_AVIF = process.argv.includes("--avif");
const CONCURRENCY = 6;

// ----------------- UTILITIES -----------------
function slugify(s) {
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

function imageIdOf(file) {
  return file.replace(/\s+/g, "-").replace(/\.[^.]+$/, "").toLowerCase();
}

function titleFromFilename(name) {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim();
}

function urlForImage(project, filename, width, format = "webp") {
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(project)}/${encodeURIComponent(filename)}?width=${width}&format=${format}`;
}

function limit(n) {
  let active = 0,
      q = [];
  return async function(fn) {
    if (active >= n) await new Promise(r => q.push(r));
    active++;
    try { return await fn(); }
    finally {
      active--;
      const next = q.shift();
      if (next) next();
    }
  };
}

const gate = limit(CONCURRENCY);

// ----------------- SUPABASE FUNCTIONS -----------------
async function listProjects() {
  const { data, error } = await supabase.storage.from(BUCKET).list("", { limit: 100 });
  if (error) throw error;

  // only folders
  return data.filter(d => d.type === "folder").map(f => f.name);
}

async function listImages(projectFolder) {
  const { data, error } = await supabase.storage.from(BUCKET).list(projectFolder, { limit: 1000 });
  // console.log("Raw bucket contains:", data, error);
  if (error) throw error;

  return data.filter(f => f.type === "file").map(f => f.name);
}

async function getImageMetadata(projectFolder, filename) {
  const { data, error } = await supabase.storage.from(BUCKET).download(`${projectFolder}/${filename}`);
  if (error || !data) {
    console.warn(`Failed to fetch image metadata: ${projectFolder}/${filename}`);
    return null;
  }

  const buffer = Buffer.from(await data.arrayBuffer());
  const meta = await sharp(buffer).metadata();
  const orientation = meta.orientation ?? 1;
  const isRotated = orientation >= 5 && orientation <= 8;
  const width = isRotated ? meta.height : meta.width;
  const height = isRotated ? meta.width : meta.height;
  return { width, height };
}

// ----------------- MAIN -----------------
async function run() {
  const manifest = [];
  const projects = await listProjects();
  console.log("Found projects:", projects);

  for (const projectFolderName of projects) {
    const projectId = slugify(projectFolderName);
    const projectTitle = projectFolderName;

    const files = await listImages(projectFolderName);

    for (const filename of files) {
      const imageId = imageIdOf(filename);
      const alt = titleFromFilename(filename);

      const meta = await gate(() => getImageMetadata(projectFolderName, filename));
      if (!meta || !meta.width || !meta.height) {
        console.warn(`Skipping (no metadata): ${projectFolderName}/${filename}`);
        continue;
      }

      const targetWidths = WIDTHS.filter(w => w <= meta.width);
      if (!targetWidths.length) targetWidths.push(meta.width);

      const variants = [];
      for (const w of targetWidths) {
        variants.push({
          format: "webp",
          width: w,
          url: urlForImage(projectFolderName, filename, w, "webp")
        });

        if (GENERATE_AVIF) {
          variants.push({
            format: "avif",
            width: w,
            url: urlForImage(projectFolderName, filename, w, "avif")
          });
        }
      }

      manifest.push({
        id: `${projectId}/${imageId}`,
        project: { id: projectId, title: projectTitle },
        alt,
        original: { width: meta.width, height: meta.height, bytes: null },
        variants: variants.sort((a, b) => a.width - b.width)
      });
    }
  }

  // write manifest
  const fs = await import("node:fs/promises");
  await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf8");

  console.log(`\n✅ Projects: ${projects.length}`);
  console.log(`✅ Manifest: ${MANIFEST_PATH}`);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});