import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { isSafeObjectKey, sanitizeOriginalFilename } from "./validation.ts";

if (typeof window !== "undefined") {
  throw new Error("Security violation: src/lib/storage/r2.ts is strictly server-only.");
}

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  endpoint: string;
  publicUrl: string;
}

const DEFAULT_TIMEOUT_MS = 15_000;
const UPLOAD_TIMEOUT_MS = 30_000;
const MAX_PRESIGN_EXPIRY_SECONDS = 300; // 5 minutes
const MIN_PRESIGN_EXPIRY_SECONDS = 60;

/**
 * Validate that the configured public URL is a custom HTTPS domain and NOT
 * an R2 S3 API endpoint or r2.dev development URL.
 */
export function validateR2PublicUrl(rawUrl: string): { valid: boolean; normalized?: string; error?: string } {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { valid: false, error: "R2_PUBLIC_URL is missing." };
  }
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== "https:") {
      return { valid: false, error: "R2_PUBLIC_URL must use https://." };
    }
    const host = parsed.hostname.toLowerCase();
    if (host.endsWith(".r2.dev") || host === "r2.dev") {
      return {
        valid: false,
        error: "R2_PUBLIC_URL must use a custom domain, not a development r2.dev domain.",
      };
    }
    if (host.endsWith(".r2.cloudflarestorage.com")) {
      return {
        valid: false,
        error: "R2_PUBLIC_URL must use a custom domain, not the R2 S3 API endpoint.",
      };
    }
    const normalized = `${parsed.origin}${parsed.pathname.replace(/\/+$/, "")}`;
    return { valid: true, normalized };
  } catch {
    return { valid: false, error: "R2_PUBLIC_URL is not a valid URL." };
  }
}

/**
 * Validate the S3-compatible R2 endpoint URL.
 */
export function validateR2Endpoint(rawEndpoint: string): { valid: boolean; normalized?: string; error?: string } {
  if (!rawEndpoint || typeof rawEndpoint !== "string") {
    return { valid: false, error: "R2_ENDPOINT is missing." };
  }
  try {
    const parsed = new URL(rawEndpoint.trim());
    if (parsed.protocol !== "https:") {
      return { valid: false, error: "R2_ENDPOINT must use https://." };
    }
    return { valid: true, normalized: parsed.origin };
  } catch {
    return { valid: false, error: "R2_ENDPOINT is not a valid URL." };
  }
}

/**
 * Read and validate R2 environment variables on the server.
 * Never logs or includes secret values in error messages.
 */
export function getR2Config(env: NodeJS.ProcessEnv = process.env): R2Config {
  const accountId = env.R2_ACCOUNT_ID?.trim() || "";
  const accessKeyId = env.R2_ACCESS_KEY_ID?.trim() || "";
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY?.trim() || "";
  const bucketName = env.R2_BUCKET_NAME?.trim() || "";
  const rawEndpoint = env.R2_ENDPOINT?.trim() || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "");
  const rawPublicUrl = env.R2_PUBLIC_URL?.trim() || "";

  const missing: string[] = [];
  if (!accountId) missing.push("R2_ACCOUNT_ID");
  if (!accessKeyId) missing.push("R2_ACCESS_KEY_ID");
  if (!secretAccessKey) missing.push("R2_SECRET_ACCESS_KEY");
  if (!bucketName) missing.push("R2_BUCKET_NAME");
  if (!rawEndpoint) missing.push("R2_ENDPOINT");
  if (!rawPublicUrl) missing.push("R2_PUBLIC_URL");

  if (missing.length > 0) {
    throw new Error(`Cloudflare R2 configuration incomplete. Missing: ${missing.join(", ")}`);
  }

  const endpointCheck = validateR2Endpoint(rawEndpoint);
  if (!endpointCheck.valid || !endpointCheck.normalized) {
    throw new Error(endpointCheck.error || "Invalid R2_ENDPOINT.");
  }

  const publicUrlCheck = validateR2PublicUrl(rawPublicUrl);
  if (!publicUrlCheck.valid || !publicUrlCheck.normalized) {
    throw new Error(publicUrlCheck.error || "Invalid R2_PUBLIC_URL.");
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    endpoint: endpointCheck.normalized,
    publicUrl: publicUrlCheck.normalized,
  };
}

export function isR2Configured(env: NodeJS.ProcessEnv = process.env): boolean {
  try {
    getR2Config(env);
    return true;
  } catch {
    return false;
  }
}

export function createR2Client(config: R2Config = getR2Config()): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    maxAttempts: 3,
  });
}

export function buildR2PublicUrl(objectKey: string, publicBaseUrl?: string): string {
  if (!isSafeObjectKey(objectKey)) {
    throw new Error("Invalid object key.");
  }
  const base = (publicBaseUrl || getR2Config().publicUrl).replace(/\/+$/, "");
  return `${base}/${objectKey}`;
}

export interface PresignedUploadResult {
  uploadUrl: string;
  objectKey: string;
  publicUrl: string;
  expiresInSeconds: number;
  requiredHeaders: Record<string, string>;
}

/**
 * Generate a short-lived presigned PUT URL locked to bucket, object key, MIME type, and exact byte length.
 */
export async function createPresignedPutUpload(
  params: {
    objectKey: string;
    contentType: string;
    contentLength: number;
    originalFilename: string;
    expiresInSeconds?: number;
  },
  deps?: { config?: R2Config; client?: S3Client }
): Promise<PresignedUploadResult> {
  if (!isSafeObjectKey(params.objectKey)) {
    throw new Error("Invalid R2 object key.");
  }

  const config = deps?.config || getR2Config();
  const client = deps?.client || createR2Client(config);

  const rawExpiry = params.expiresInSeconds ?? MAX_PRESIGN_EXPIRY_SECONDS;
  const expiresIn = Math.min(
    MAX_PRESIGN_EXPIRY_SECONDS,
    Math.max(MIN_PRESIGN_EXPIRY_SECONDS, Math.floor(rawExpiry))
  );

  const safeOriginalName = sanitizeOriginalFilename(params.originalFilename);

  const command = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: params.objectKey,
    ContentType: params.contentType,
    ContentLength: params.contentLength,
    CacheControl: "public, max-age=31536000, immutable",
    Metadata: {
      "original-filename": safeOriginalName,
    },
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn });

  return {
    uploadUrl,
    objectKey: params.objectKey,
    publicUrl: buildR2PublicUrl(params.objectKey, config.publicUrl),
    expiresInSeconds: expiresIn,
    requiredHeaders: {
      "Content-Type": params.contentType,
    },
  };
}

export interface HeadObjectResult {
  exists: boolean;
  contentLength?: number;
  contentType?: string;
  eTag?: string;
  metadata?: Record<string, string>;
}

export async function headR2Object(
  objectKey: string,
  deps?: { config?: R2Config; client?: S3Client; timeoutMs?: number }
): Promise<HeadObjectResult> {
  if (!isSafeObjectKey(objectKey)) {
    throw new Error("Invalid R2 object key.");
  }
  const config = deps?.config || getR2Config();
  const client = deps?.client || createR2Client(config);

  try {
    const res = await client.send(
      new HeadObjectCommand({
        Bucket: config.bucketName,
        Key: objectKey,
      }),
      { abortSignal: AbortSignal.timeout(deps?.timeoutMs ?? DEFAULT_TIMEOUT_MS) }
    );

    return {
      exists: true,
      contentLength: res.ContentLength,
      contentType: res.ContentType,
      eTag: res.ETag?.replace(/"/g, ""),
      metadata: res.Metadata,
    };
  } catch (err: any) {
    if (err?.$metadata?.httpStatusCode === 404 || err?.name === "NotFound") {
      return { exists: false };
    }
    throw err;
  }
}

export async function getR2ObjectBytes(
  objectKey: string,
  opts?: { maxBytes?: number; config?: R2Config; client?: S3Client; timeoutMs?: number }
): Promise<Buffer> {
  if (!isSafeObjectKey(objectKey)) {
    throw new Error("Invalid R2 object key.");
  }
  const config = opts?.config || getR2Config();
  const client = opts?.client || createR2Client(config);

  const rangeHeader = opts?.maxBytes ? `bytes=0-${opts.maxBytes - 1}` : undefined;

  const res = await client.send(
    new GetObjectCommand({
      Bucket: config.bucketName,
      Key: objectKey,
      ...(rangeHeader ? { Range: rangeHeader } : {}),
    }),
    { abortSignal: AbortSignal.timeout(opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS) }
  );

  if (!res.Body) {
    throw new Error("Empty R2 response body.");
  }

  const byteArray = await res.Body.transformToByteArray();
  return Buffer.from(byteArray);
}

export async function putR2Object(
  params: {
    objectKey: string;
    body: Buffer | Uint8Array;
    contentType: string;
    originalFilename?: string;
    checksumSha256Base64?: string;
    metadata?: Record<string, string>;
  },
  deps?: { config?: R2Config; client?: S3Client; timeoutMs?: number }
): Promise<{ eTag?: string; publicUrl: string }> {
  if (!isSafeObjectKey(params.objectKey)) {
    throw new Error("Invalid R2 object key.");
  }
  const config = deps?.config || getR2Config();
  const client = deps?.client || createR2Client(config);

  const mergedMeta: Record<string, string> = {
    ...(params.metadata || {}),
  };
  if (params.originalFilename) {
    mergedMeta["original-filename"] = sanitizeOriginalFilename(params.originalFilename);
  }

  const res = await client.send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: params.objectKey,
      Body: params.body,
      ContentType: params.contentType,
      ContentLength: params.body.byteLength,
      CacheControl: "public, max-age=31536000, immutable",
      ...(params.checksumSha256Base64 ? { ChecksumSHA256: params.checksumSha256Base64 } : {}),
      Metadata: mergedMeta,
    }),
    { abortSignal: AbortSignal.timeout(deps?.timeoutMs ?? UPLOAD_TIMEOUT_MS) }
  );

  return {
    eTag: res.ETag?.replace(/"/g, ""),
    publicUrl: buildR2PublicUrl(params.objectKey, config.publicUrl),
  };
}

export async function deleteR2Object(
  objectKey: string,
  deps?: { config?: R2Config; client?: S3Client; timeoutMs?: number }
): Promise<void> {
  if (!isSafeObjectKey(objectKey)) {
    throw new Error("Invalid R2 object key.");
  }
  const config = deps?.config || getR2Config();
  const client = deps?.client || createR2Client(config);

  await client.send(
    new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: objectKey,
    }),
    { abortSignal: AbortSignal.timeout(deps?.timeoutMs ?? DEFAULT_TIMEOUT_MS) }
  );
}

/**
 * Minimal R2 CORS configuration for exact local development and production origins.
 */
export function getRecommendedR2CorsPolicy(allowedOrigins: string[]) {
  return [
    {
      AllowedOrigins: allowedOrigins,
      AllowedMethods: ["PUT", "GET", "HEAD"],
      AllowedHeaders: ["Content-Type", "Content-Length", "x-amz-meta-original-filename"],
      ExposeHeaders: ["ETag"],
      MaxAgeSeconds: 3600,
    },
  ];
}
