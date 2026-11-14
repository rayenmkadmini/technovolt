import fs from "node:fs";
import path from "node:path";
import { headR2Object, putR2Object } from "../src/lib/storage/r2.ts";

const envPath = path.resolve(".env.local");
const content = fs.readFileSync(envPath, "utf8");
for (const line of content.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const idx = trimmed.indexOf("=");
  if (idx === -1) continue;
  process.env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
}

async function main() {
  const files = [
    { name: "tableau-electrique.jpg", type: "image/jpeg" },
    { name: "tableau-electrique.webp", type: "image/webp" },
    { name: "depannage.jpg", type: "image/jpeg" },
    { name: "depannage.webp", type: "image/webp" },
    { name: "climatisation.jpg", type: "image/jpeg" },
    { name: "climatisation.webp", type: "image/webp" },
    { name: "renovation.jpg", type: "image/jpeg" },
    { name: "renovation.webp", type: "image/webp" },
  ];

  for (const f of files) {
    const key = `images/services/${f.name}`;
    const head = await headR2Object(key);
    console.log(key, "exists in R2?", head.exists);
    if (!head.exists) {
      const localPath = path.resolve(`public/images/services/${f.name}`);
      const buf = fs.readFileSync(localPath);
      const put = await putR2Object({
        objectKey: key,
        body: buf,
        contentType: f.type,
      });
      console.log("Uploaded to R2:", put.publicUrl);
    }
  }
}

main();
