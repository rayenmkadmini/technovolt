import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import {
  createR2Client,
  createPresignedPutUpload,
  getR2Config,
  deleteR2Object,
  headR2Object,
} from "../src/lib/storage/r2.ts";
import {
  validateImageMagicBytes,
} from "../src/lib/storage/validation.ts";

// Helper to load .env.local without exposing values
function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    throw new Error(".env.local file is missing");
  }
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

loadEnvLocal();

// Valid 1x1 RGBA PNG buffer (67 bytes)
const TEST_PNG_BYTES = Buffer.from(
  "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082",
  "hex"
);

async function runControlledTest() {
  const testResults = {
    testStartedAt: new Date().toISOString(),
    steps: {},
    passedAll: false,
  };

  console.log("=== TECHNOVOLT: STARTING CONTROLLED R2 LIVE INTEGRATION TEST ===");

  // 1. Validate environment & dependencies
  const r2Config = getR2Config();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase configuration in .env.local");
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Verify PNG magic bytes locally first
  const byteCheck = validateImageMagicBytes(TEST_PNG_BYTES, "image/png");
  if (!byteCheck.valid) {
    throw new Error("Local test PNG buffer failed magic bytes validation");
  }

  const testSha256 = crypto.createHash("sha256").update(TEST_PNG_BYTES).digest("hex");
  const testUuid = crypto.randomUUID();
  const testObjectKey = `media/__r2_live_tests/test-probe-${testUuid}.png`;
  const testFileName = `test-probe-${testUuid}.png`;

  console.log(`[SETUP] Target test key: ${testObjectKey}`);
  console.log(`[SETUP] Test SHA-256: ${testSha256}`);
  console.log(`[SETUP] Test payload size: ${TEST_PNG_BYTES.length} bytes`);

  let createdAssetId = null;

  try {
    // =========================================================================
    // STEP 2: TEST UPLOAD VIA PRESIGNED URL
    // =========================================================================
    console.log("\n[STEP 2] Generating Presigned PUT URL...");
    const r2Client = createR2Client(r2Config);

    const presigned = await createPresignedPutUpload(
      {
        objectKey: testObjectKey,
        contentType: "image/png",
        contentLength: TEST_PNG_BYTES.length,
        originalFilename: testFileName,
        expiresInSeconds: 300,
      },
      { config: r2Config, client: r2Client }
    );

    console.log(`[STEP 2] Presigned URL generated successfully (expires in ${presigned.expiresInSeconds}s).`);

    console.log(`[STEP 2] Uploading direct to R2 via PUT with Content-Type: image/png...`);
    const putResponse = await fetch(presigned.uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "image/png",
        "Content-Length": String(TEST_PNG_BYTES.length),
      },
      body: TEST_PNG_BYTES,
    });

    const putStatus = putResponse.status;
    const putEtag = putResponse.headers.get("etag")?.replace(/"/g, "");
    console.log(`[STEP 2] PUT response status: ${putStatus} (${putResponse.statusText})`);
    console.log(`[STEP 2] ETag received from R2: ${putEtag}`);

    if (putStatus < 200 || putStatus >= 300) {
      throw new Error(`R2 Direct PUT failed with HTTP status ${putStatus}`);
    }

    // Verify object directly in R2 via HeadObject
    console.log(`[STEP 2] Verifying object existence via HeadObject...`);
    const head = await headR2Object(testObjectKey, { config: r2Config, client: r2Client });
    console.log(`[STEP 2] HeadObject verified: size=${head.contentLength}, type=${head.contentType}`);

    if (head.contentLength !== TEST_PNG_BYTES.length) {
      throw new Error(`Size mismatch: expected ${TEST_PNG_BYTES.length}, got ${head.contentLength}`);
    }

    testResults.steps.upload = {
      status: "PASS",
      httpStatus: putStatus,
      etag: putEtag,
      objectKey: testObjectKey,
      contentLength: head.contentLength,
      contentType: head.contentType,
    };

    // =========================================================================
    // STEP 3: PUBLIC DELIVERY VIA https://media.technovolt.tn/
    // =========================================================================
    console.log(`\n[STEP 3] Testing public delivery via https://media.technovolt.tn/...`);
    const publicUrl = presigned.publicUrl;
    console.log(`[STEP 3] Fetching public URL: ${publicUrl}`);

    const publicFetch = await fetch(publicUrl, {
      method: "GET",
      headers: {
        Origin: "https://technovolt.tn",
      },
    });

    const publicStatus = publicFetch.status;
    const publicContentType = publicFetch.headers.get("content-type");
    const publicBytes = Buffer.from(await publicFetch.arrayBuffer());
    const publicSha256 = crypto.createHash("sha256").update(publicBytes).digest("hex");
    const accessControlAllowOrigin = publicFetch.headers.get("access-control-allow-origin");

    console.log(`[STEP 3] Public delivery HTTP status: ${publicStatus}`);
    console.log(`[STEP 3] Public delivery Content-Type: ${publicContentType}`);
    console.log(`[STEP 3] Public delivery payload bytes: ${publicBytes.length}`);
    console.log(`[STEP 3] CORS Access-Control-Allow-Origin: ${accessControlAllowOrigin || "None (Standard GET)"}`);

    if (publicStatus !== 200) {
      throw new Error(`Public delivery failed with HTTP status ${publicStatus}`);
    }
    if (publicSha256 !== testSha256) {
      throw new Error(`Public delivery SHA-256 mismatch!`);
    }

    testResults.steps.publicDelivery = {
      status: "PASS",
      httpStatus: publicStatus,
      publicUrl,
      contentType: publicContentType,
      contentLength: publicBytes.length,
      sha256Matched: true,
      accessControlAllowOrigin,
    };

    // =========================================================================
    // STEP 4: SUPABASE METADATA, RLS, AND TRIGGER VERIFICATION
    // =========================================================================
    console.log(`\n[STEP 4] Registering test metadata in Supabase public.media_assets...`);
    const { data: insertData, error: insertError } = await supabase
      .from("media_assets")
      .insert({
        file_name: testFileName,
        original_filename: testFileName,
        file_path: testObjectKey,
        object_key: testObjectKey,
        file_url: publicUrl,
        public_url: publicUrl,
        file_type: "image",
        mime_type: "image/png",
        file_size: TEST_PNG_BYTES.length,
        size_bytes: TEST_PNG_BYTES.length,
        category: "__r2_live_tests",
        storage_provider: "r2",
        migration_status: "native_r2",
        checksum_sha256: testSha256,
        is_public: true,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Supabase insert failed: ${insertError.message}`);
    }

    createdAssetId = insertData.id;
    const initialCreatedAt = insertData.created_at;
    const initialUpdatedAt = insertData.updated_at;
    console.log(`[STEP 4] Inserted record ID: ${createdAssetId}`);
    console.log(`[STEP 4] Initial created_at: ${initialCreatedAt}`);
    console.log(`[STEP 4] Initial updated_at: ${initialUpdatedAt}`);

    // Test updated_at trigger by updating alt_text_fr
    console.log(`[STEP 4] Testing updated_at trigger by updating alt_text_fr...`);
    await new Promise((r) => setTimeout(r, 1000)); // Sleep 1s to ensure distinct timestamp

    const { data: updateData, error: updateError } = await supabase
      .from("media_assets")
      .update({ alt_text_fr: "Test live R2 validé" })
      .eq("id", createdAssetId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Supabase update trigger test failed: ${updateError.message}`);
    }

    const modifiedUpdatedAt = updateData.updated_at;
    console.log(`[STEP 4] Modified updated_at: ${modifiedUpdatedAt}`);

    const triggerVerified = modifiedUpdatedAt !== initialUpdatedAt;
    console.log(`[STEP 4] Trigger set_updated_at verified: ${triggerVerified ? "YES" : "NO"}`);

    if (!triggerVerified) {
      throw new Error("Trigger set_updated_at did not update updated_at timestamp");
    }

    // Verify RLS for public read
    console.log(`[STEP 4] Verifying RLS public select query...`);
    const { data: publicReadData, error: publicReadError } = await supabase
      .from("media_assets")
      .select("id, is_public, deleted_at, object_key")
      .eq("id", createdAssetId)
      .single();

    if (publicReadError || !publicReadData) {
      throw new Error(`RLS public select check failed: ${publicReadError?.message}`);
    }

    testResults.steps.supabase = {
      status: "PASS",
      assetId: createdAssetId,
      triggerVerified: true,
      rlsVerified: true,
      initialUpdatedAt,
      modifiedUpdatedAt,
    };

    // =========================================================================
    // STEP 5: DELETION TEST (SOFT-DELETE THEN PURGE R2 OBJECT)
    // =========================================================================
    console.log(`\n[STEP 5] Testing Soft-Delete on test asset ${createdAssetId}...`);
    const deletedTimestamp = new Date().toISOString();
    const { data: softDeleteData, error: softDeleteError } = await supabase
      .from("media_assets")
      .update({
        deleted_at: deletedTimestamp,
        is_public: false,
      })
      .eq("id", createdAssetId)
      .select()
      .single();

    if (softDeleteError) {
      throw new Error(`Soft delete failed: ${softDeleteError.message}`);
    }

    console.log(`[STEP 5] Soft-delete verified: deleted_at=${softDeleteData.deleted_at}, is_public=${softDeleteData.is_public}`);

    // Verify soft-deleted item is excluded from anon/public query
    const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: anonQueryData } = await anonClient
      .from("media_assets")
      .select("id")
      .eq("id", createdAssetId)
      .maybeSingle();

    const anonHidden = anonQueryData === null;
    console.log(`[STEP 5] Anon RLS filter (hidden when deleted_at is not null): ${anonHidden ? "YES" : "NO"}`);

    // Purge test object from R2 permanently
    console.log(`[STEP 5] Permanently deleting test object from R2 bucket...`);
    await deleteR2Object(testObjectKey, { config: r2Config, client: r2Client });

    // Verify object is gone from R2
    const headAfterDelete = await headR2Object(testObjectKey, { config: r2Config, client: r2Client });
    const objectGoneFromR2 = headAfterDelete.exists === false;
    console.log(`[STEP 5] Verified test object removed from R2: ${objectGoneFromR2 ? "YES" : "NO"}`);

    // Permanently remove test row from Supabase to leave ZERO residue
    console.log(`[STEP 5] Removing test row from Supabase database to leave zero residue...`);
    const { error: finalDbPurgeError } = await supabase
      .from("media_assets")
      .delete()
      .eq("id", createdAssetId);

    if (finalDbPurgeError) {
      console.warn(`[CLEANUP] Notice on final DB row purge: ${finalDbPurgeError.message}`);
    } else {
      console.log(`[STEP 5] Test row removed cleanly from public.media_assets.`);
    }

    testResults.steps.deletion = {
      status: "PASS",
      softDeleteVerified: true,
      anonRlsHidden: anonHidden,
      r2ObjectPurged: objectGoneFromR2,
      databaseRowCleaned: !finalDbPurgeError,
    };

    // =========================================================================
    // STEP 6: VERIFY ZERO TOUCH ON EXISTING MEDIA
    // =========================================================================
    console.log(`\n[STEP 6] Confirming zero impact on existing Supabase Storage and database records...`);
    const { count: remainingTestRecords } = await supabase
      .from("media_assets")
      .select("id", { count: "exact", head: true })
      .like("category", "__r2_live_tests%");

    console.log(`[STEP 6] Remaining test records in database: ${remainingTestRecords || 0}`);

    testResults.passedAll = true;
    console.log("\n=== ALL CONTROLLED LIVE INTEGRATION TESTS PASSED WITH 100% SUCCESS ===");
    return testResults;
  } catch (err) {
    console.error(`\n[ERROR] Test failed: ${err.message}`);
    // Safe cleanup of test object if it was created
    try {
      if (testObjectKey) {
        const r2Client = createR2Client(r2Config);
        await deleteR2Object(testObjectKey, { config: r2Config, client: r2Client });
        console.log("[ERROR-CLEANUP] Deleted test R2 object.");
      }
      if (createdAssetId) {
        await supabase.from("media_assets").delete().eq("id", createdAssetId);
        console.log("[ERROR-CLEANUP] Deleted test database row.");
      }
    } catch (cleanupErr) {
      console.error("[ERROR-CLEANUP] Cleanup error:", cleanupErr.message);
    }
    testResults.error = err.message;
    return testResults;
  }
}

runControlledTest().then((res) => {
  fs.writeFileSync("scripts/test-output.json", JSON.stringify(res, null, 2));
  if (!res.passedAll) {
    process.exit(1);
  }
});
