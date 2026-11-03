import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const logo = await readFile(new URL("../public/logo.svg", import.meta.url));
await writeFile(new URL("../src/app/icon.svg", import.meta.url), logo);
await sharp(logo).resize(180, 180).png().toFile(fileURLToPath(new URL("../src/app/apple-icon.png", import.meta.url)));
const sizes = [16, 32, 48];
const frames = await Promise.all(
  sizes.map((size) => sharp(logo).resize(size, size).png().toBuffer()),
);
const directory = Buffer.alloc(6 + 16 * frames.length);
directory.writeUInt16LE(1, 2);
directory.writeUInt16LE(frames.length, 4);
let offset = directory.length;
frames.forEach((png, index) => {
  const entry = 6 + index * 16;
  directory[entry] = sizes[index];
  directory[entry + 1] = sizes[index];
  directory.writeUInt16LE(1, entry + 4);
  directory.writeUInt16LE(32, entry + 6);
  directory.writeUInt32LE(png.length, entry + 8);
  directory.writeUInt32LE(offset, entry + 12);
  offset += png.length;
});
await writeFile(
  new URL("../src/app/favicon.ico", import.meta.url),
  Buffer.concat([directory, ...frames]),
);
console.log(
  "Generated matching SVG, Apple touch icon, and 16/32/48px favicon assets from public/logo.svg.",
);
