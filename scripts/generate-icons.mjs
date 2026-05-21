// Generates app icons from public/logo-vadelivery.jpg into src/app/.
// Run with: node scripts/generate-icons.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const source = resolve(root, "public/logo-vadelivery.jpg");
const outDir = resolve(root, "src/app");

await mkdir(outDir, { recursive: true });

const renderToSquare = (size, padding) =>
  sharp(source)
    .resize({
      width: size - padding * 2,
      height: size - padding * 2,
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .extend({
      top: padding,
      bottom: padding,
      left: padding,
      right: padding,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png();

await renderToSquare(512, 32).toFile(resolve(outDir, "icon.png"));
await renderToSquare(180, 12).toFile(resolve(outDir, "apple-icon.png"));

console.log("Generated: src/app/icon.png, src/app/apple-icon.png");
