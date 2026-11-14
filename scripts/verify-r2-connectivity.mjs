#!/usr/bin/env node
/**
 * TECHNOVOLT — Phase C Credential & Cloudflare R2 Connectivity Validator
 *
 * SAFETY GUARANTEES:
 * - Never prints secret credential values.
 * - Never touches or modifies existing media objects.
 * - Tests PUT, HEAD, GET, custom-domain HTTPS delivery, and DELETE strictly
 *   on a unique disposable temporary probe object (`__connectivity_check__/...`),
 *   then verifies cleanup succeeded.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {
  deleteR2Object,
  getR2Config,
  getR2ObjectBytes,
  headR2Object,
  putR2Object,
} from "../src/lib/storage/r2.ts";

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return false;
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
  return true;
}

const envLoaded = loadEnvLocal();

const REQUIRED_KEYS = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_ENDPOINT",
  "R2_PUBLIC_URL",
  "NEXT_PUBLIC_CLOUDFLARE_IMAGES_ENABLED",
];

console.log("=== TECHNOVOLT R2 CREDENTIAL & CONNECTIVITY CHECK ===");
console.log(`.env.local present: ${envLoaded ? "YES" : "NO"}`);

const missing = [];
for (const key of REQUIRED_KEYS) {
  const present = Boolean(process.env[key] && process.env[key].trim());
  console.log(`- ${key}: ${present ? "CONFIGURED" : "MISSING"}`);
  if (!present) missing.push(key);
}

const mediaPublicPresent = Boolean(
  (process.env.NEXT_PUBLIC_MEDIA_URL || process.env.NEXT_PUBLIC_MEDIA_PUBLIC_URL || "").trim()
);
console.log(`- NEXT_PUBLIC_MEDIA_URL / NEXT_PUBLIC_MEDIA_PUBLIC_URL: ${mediaPublicPresent ? "CONFIGURED" : "MISSING"}`);
if (!mediaPublicPresent) missing.push("NEXT_PUBLIC_MEDIA_URL");

if (missing.length > 0) {
  console.error(`\nBLOCKED: Missing ${missing.length} required environment variable(s). Configure .env.local and re-run.`);
  process.exit(1);
}

async function runProbe() {
  const config = getR2Config();
  console.log(`\nValidated R2 config for bucket "${config.bucketName}" -> public origin "${config.publicUrl}"`);

  const probeId = crypto.randomUUID();
  const probeKey = `media/__connectivity_check__/probe-${probeId}.txt`;
  const probeBody = Buffer.from(`technovolt-r2-probe:${probeId}`, "utf8");
  const probeShaBase64 = crypto.createHash("sha256").update(probeBody).digest("base64");

  try {
    console.log("1. Testing PUT temporary probe object...");
    const putRes = await putR2Object(
      {
        objectKey: probeKey,
        body: probeBody,
        contentType: "text/plain; charset=utf-8",
        originalFilename: `probe-${probeId}.txt`,
        checksumSha256Base64: probeShaBase64,
      },
      { config }
    );
    console.log(`   PUT OK -> ${putRes.publicUrl}`);

    console.log("2. Testing HEAD temporary probe object...");
    const headRes = await headR2Object(probeKey, { config });
    if (!headRes.exists || headRes.contentLength !== probeBody.byteLength) {
      throw new Error(`HEAD verification failed (exists=${headRes.exists}, length=${headRes.contentLength})`);
    }
    console.log(`   HEAD OK -> length=${headRes.contentLength}`);

    console.log("3. Testing S3 GET temporary probe object...");
    const gotBytes = await getR2ObjectBytes(probeKey, { config });
    if (!gotBytes.equals(probeBody)) {
      throw new Error("GET verification failed: downloaded bytes differ from probe payload.");
    }
    console.log("   S3 GET OK -> payload matched");

    console.log("4. Testing HTTPS delivery via configured custom domain...");
    const cdnRes = await fetch(putRes.publicUrl, { method: "GET" });
    const cdnText = await cdnRes.text();
    if (!cdnRes.ok || cdnText !== probeBody.toString("utf8")) {
      throw new Error(`Custom domain check failed (HTTP ${cdnRes.status})`);
    }
    console.log(`   HTTPS custom domain delivery OK -> HTTP ${cdnRes.status}`);

    if (process.env.NEXT_PUBLIC_CLOUDFLARE_IMAGES_ENABLED === "true") {
      console.log("   Notice: test live image transformations on a PNG/JPEG via /cdn-cgi/image/width=300,quality=80,format=auto,fit=scale-down/...");
    }
  } finally {
    console.log("5. Cleaning up temporary probe object...");
    await deleteR2Object(probeKey, { config });
    const verifyDeleted = await headR2Object(probeKey, { config });
    if (verifyDeleted.exists) {
      throw new Error("Cleanup verification failed: temporary probe object still exists.");
    }
    console.log("   DELETE + cleanup verification OK -> temporary probe removed.");
  }
}

runProbe().catch((err) => {
  console.error("\nConnectivity check failed:", err?.message || "Unknown error");
  process.exit(1);
});
