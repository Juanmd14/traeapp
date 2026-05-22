// Generates app icons from public/brand/app-icon-vadelivery-512.svg into src/app/ and public/.
// Run with: node scripts/generate-icons.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const source = resolve(root, "public/brand/app-icon-vadelivery-512.svg");
const appOutDir = resolve(root, "src/app");
const publicOutDir = resolve(root, "public");

await mkdir(appOutDir, { recursive: true });
await mkdir(publicOutDir, { recursive: true });

// Source is an SVG with the brand coral background already baked in (per assets/README.md).
// Render straight to PNG at multiple sizes without padding.
const renderTo = (size) =>
  sharp(source).resize({ width: size, height: size, fit: "contain" }).png();

await renderTo(512).toFile(resolve(appOutDir, "icon.png"));
await renderTo(180).toFile(resolve(appOutDir, "apple-icon.png"));
await renderTo(512).toFile(resolve(publicOutDir, "icon-512.png"));
await renderTo(192).toFile(resolve(publicOutDir, "icon-192.png"));

console.log(
  "Generated: src/app/icon.png, src/app/apple-icon.png, public/icon-512.png, public/icon-192.png"
);
