import crypto from "node:crypto";

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/svg+xml",
] as const;

export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

export const MIME_TO_EXTENSIONS: Record<AllowedImageMimeType, readonly string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "image/avif": ["avif"],
  "image/svg+xml": ["svg"],
};

export const ALLOWED_MEDIA_FOLDERS = [
  "branding",
  "chantiers",
  "climatisation",
  "domotique",
  "services",
  "projects",
  "general",
] as const;

export const MAX_IMAGE_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  normalizedMime?: AllowedImageMimeType;
  extension?: string;
  sanitizedFilename?: string;
  folder?: string;
}

/**
 * Normalize MIME aliases (e.g. image/jpg -> image/jpeg)
 */
export function normalizeMimeType(mime: string): AllowedImageMimeType | null {
  const lower = (mime || "").trim().toLowerCase();
  if (lower === "image/jpg") return "image/jpeg";
  if ((ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(lower)) {
    return lower as AllowedImageMimeType;
  }
  return null;
}

/**
 * Sanitize an original filename to prevent path traversal, null bytes, and header injection.
 */
export function sanitizeOriginalFilename(filename: string): string {
  const base = (filename || "image")
    .replace(/\0/g, "")
    .split(/[\\/]/)
    .pop() || "image";

  const cleaned = base
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/^\.+/, "")
    .slice(0, 120);

  return cleaned || "image";
}

/**
 * Normalize and validate folder/category names against an allowlist to prevent path injection.
 */
export function sanitizeMediaFolder(folder?: string | null): string {
  const normalized = (folder || "chantiers")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");

  if ((ALLOWED_MEDIA_FOLDERS as readonly string[]).includes(normalized)) {
    return normalized;
  }
  return "general";
}

/**
 * Extract and validate file extension against the declared MIME type.
 */
export function validateFilenameAndExtension(
  filename: string,
  mimeType: string
): FileValidationResult {
  if (!filename || typeof filename !== "string") {
    return { valid: false, error: "Nom de fichier manquant." };
  }

  // Reject path traversal attempts or null bytes explicitly
  if (
    filename.includes("..") ||
    filename.includes("/") ||
    filename.includes("\\") ||
    filename.includes("\0")
  ) {
    return { valid: false, error: "Nom de fichier invalide (caractères de chemin interdits)." };
  }

  const normalizedMime = normalizeMimeType(mimeType);
  if (!normalizedMime) {
    return {
      valid: false,
      error: "Format d'image non valide. Formats autorisés : PNG, JPG, WebP, AVIF ou SVG.",
    };
  }

  const sanitizedFilename = sanitizeOriginalFilename(filename);
  const parts = sanitizedFilename.split(".");
  const ext = parts.length > 1 ? parts.pop()!.toLowerCase() : "";
  const allowedExts = MIME_TO_EXTENSIONS[normalizedMime];

  if (!ext || !allowedExts.includes(ext)) {
    return {
      valid: false,
      error: `L'extension ".${ext || "?"}" ne correspond pas au type MIME ${normalizedMime}.`,
    };
  }

  return {
    valid: true,
    normalizedMime,
    extension: ext === "jpeg" ? "jpg" : ext,
    sanitizedFilename,
  };
}

/**
 * Validate file size against server bounds.
 */
export function validateFileSize(
  sizeBytes: number,
  maxBytes: number = MAX_IMAGE_FILE_SIZE_BYTES
): { valid: boolean; error?: string } {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return { valid: false, error: "Le fichier est vide ou sa taille est invalide." };
  }
  if (sizeBytes > maxBytes) {
    const maxMb = Math.round((maxBytes / (1024 * 1024)) * 10) / 10;
    return {
      valid: false,
      error: `Le fichier dépasse la taille maximale autorisée (${maxMb} Mo).`,
    };
  }
  return { valid: true };
}

/**
 * Inspect actual binary magic bytes to verify the file content matches its claimed MIME type.
 * Also performs basic XSS sanitization check on SVG files.
 */
export function validateImageMagicBytes(
  buffer: Uint8Array | Buffer,
  mimeType: AllowedImageMimeType
): { valid: boolean; error?: string } {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (bytes.length < 4) {
    return { valid: false, error: "Contenu de fichier trop court ou corrompu." };
  }

  if (mimeType === "image/png") {
    const isPng =
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a;
    return isPng
      ? { valid: true }
      : { valid: false, error: "Signature binaire PNG invalide." };
  }

  if (mimeType === "image/jpeg") {
    const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    return isJpeg
      ? { valid: true }
      : { valid: false, error: "Signature binaire JPEG invalide." };
  }

  if (mimeType === "image/webp") {
    const isWebp =
      bytes.length >= 12 &&
      bytes[0] === 0x52 && // R
      bytes[1] === 0x49 && // I
      bytes[2] === 0x46 && // F
      bytes[3] === 0x46 && // F
      bytes[8] === 0x57 && // W
      bytes[9] === 0x45 && // E
      bytes[10] === 0x42 && // B
      bytes[11] === 0x50; // P
    return isWebp
      ? { valid: true }
      : { valid: false, error: "Signature binaire WebP invalide." };
  }

  if (mimeType === "image/avif") {
    if (bytes.length < 12) {
      return { valid: false, error: "Signature binaire AVIF invalide." };
    }
    const headerStr = Buffer.from(bytes.slice(4, 12)).toString("ascii");
    const isAvif = headerStr === "ftypavif" || headerStr === "ftypavis";
    return isAvif
      ? { valid: true }
      : { valid: false, error: "Signature binaire AVIF invalide." };
  }

  if (mimeType === "image/svg+xml") {
    const text = Buffer.from(bytes.slice(0, Math.min(bytes.length, 65536))).toString("utf8");
    const trimmed = text.trimStart().toLowerCase();
    if (!trimmed.includes("<svg")) {
      return { valid: false, error: "Contenu SVG invalide (balise <svg manquante)." };
    }
    if (
      /<script[\s>]/i.test(text) ||
      /\son[a-z]+\s*=/i.test(text) ||
      /javascript:/i.test(text) ||
      /<foreignobject[\s>]/i.test(text)
    ) {
      return {
        valid: false,
        error: "Fichier SVG rejeté : scripts ou gestionnaires d'événements interdits.",
      };
    }
    return { valid: true };
  }

  return { valid: false, error: "Type MIME non supporté." };
}

/**
 * Validate complete upload metadata before issuing a presigned URL.
 */
export function validateUploadRequest(input: {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  folder?: string;
}): FileValidationResult {
  const sizeCheck = validateFileSize(input.sizeBytes);
  if (!sizeCheck.valid) {
    return { valid: false, error: sizeCheck.error };
  }

  const nameCheck = validateFilenameAndExtension(input.filename, input.mimeType);
  if (!nameCheck.valid) {
    return nameCheck;
  }

  return {
    ...nameCheck,
    folder: sanitizeMediaFolder(input.folder),
  };
}

/**
 * Generate a collision-free, non-guessable UUID-based R2 object key.
 */
export function generateSafeObjectKey(params: {
  folder?: string;
  extension: string;
  prefix?: string;
  date?: Date;
}): string {
  const safeFolder = sanitizeMediaFolder(params.folder);
  const safeExt = (params.extension || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const now = params.date || new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const uuid = crypto.randomUUID();
  const root = (params.prefix || "media").replace(/[^a-z0-9_-]/gi, "").toLowerCase() || "media";

  return `${root}/${safeFolder}/${year}/${month}/${uuid}.${safeExt}`;
}

/**
 * Verify that an object key matches expected safe pattern and contains no traversal segments.
 */
export function isSafeObjectKey(key: string): boolean {
  if (!key || typeof key !== "string") return false;
  if (key.startsWith("/") || key.includes("..") || key.includes("\\") || key.includes("\0")) {
    return false;
  }
  return /^[a-z0-9_-]+(\/[a-z0-9_.-]+)+$/i.test(key);
}

/**
 * Compute SHA-256 hex digest of a buffer.
 */
export function computeSha256Hex(buffer: Uint8Array | Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}
