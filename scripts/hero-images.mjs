import sharp from "sharp";
import fs from "fs";

const input = "src/assets/icons/hero.png";
const outDir = "public/hero";
fs.mkdirSync(outDir, { recursive: true });

const sizes = [720, 1080, 1600];

for (const w of sizes) {
  await sharp(input)
    .resize({ width: w })
    .avif({ quality: 45 })
    .toFile(`${outDir}/hero-${w}.avif`);

  await sharp(input)
    .resize({ width: w })
    .webp({ quality: 70 })
    .toFile(`${outDir}/hero-${w}.webp`);
}
console.log("Hero images generated.");
