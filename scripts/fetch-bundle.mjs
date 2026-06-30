import { mkdir, writeFile } from "node:fs/promises";

const url = process.env.RADEONRUN_BUNDLE_URL ||
  "https://raw.githubusercontent.com/radeon-arena/radeonrun/main/results/bundle.json";

const res = await fetch(url, { cache: "no-store" });
if (!res.ok) {
  throw new Error(`failed to fetch radeonrun bundle: ${res.status} ${res.statusText}`);
}
const text = await res.text();
JSON.parse(text);
await mkdir("public/data", { recursive: true });
await writeFile("public/data/bundle.json", text.endsWith("\n") ? text : `${text}\n`);
console.log(`wrote public/data/bundle.json from ${url}`);
