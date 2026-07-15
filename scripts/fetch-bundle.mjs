import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const url = process.env.RADEONRUN_BUNDLE_URL ||
  "https://raw.githubusercontent.com/radeon-arena/radeonrun/main/results/bundle.json";

let text;
if (url.startsWith("file://")) {
  text = await readFile(fileURLToPath(url), "utf8");
} else if (!/^https?:\/\//i.test(url)) {
  text = await readFile(url, "utf8");
} else {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`failed to fetch radeonrun bundle: ${res.status} ${res.statusText}`);
  }
  text = await res.text();
}
JSON.parse(text);
await mkdir("public/data", { recursive: true });
await writeFile("public/data/bundle.json", text.endsWith("\n") ? text : `${text}\n`);
console.log(`wrote public/data/bundle.json from ${url}`);
