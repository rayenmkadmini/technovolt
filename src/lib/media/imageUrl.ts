export type ImageVariant = "thumbnail" | "card" | "standard" | "large" | "original";

export const IMAGE_VARIANT_WIDTHS: Record<Exclude<ImageVariant, "original">, number> = {
  thumbnail: 300,
  card: 600,
  standard: 1000,
  large: 1600,
};

export const DEFAULT_IMAGE_QUALITY = 80;

export interface BuildCloudflareImageOptions {
  width?: number;
  quality?: number;
  fit?: "scale-down" | "contain" | "cover" | "crop" | "pad";
  format?: "auto" | "webp" | "avif" | "jpeg" | "json";
  allowedMediaOrigin?: string;
  transformationZoneOrigin?: string;
  transformationsEnabled?: boolean;
}

/**
 * Return configured public custom domain for R2 media if valid.
 */
export function getConfiguredMediaOrigin(overrideOrigin?: string): string | null {
  const raw =
    overrideOrigin ??
    process.env.NEXT_PUBLIC_MEDIA_URL ??
    process.env.NEXT_PUBLIC_MEDIA_PUBLIC_URL ??
    process.env.R2_PUBLIC_URL ??
    "";

  if (!raw.trim()) return null;

  try {
    const parsed = new URL(raw.trim());
    if (parsed.protocol !== "https:") return null;
    const host = parsed.hostname.toLowerCase();
    if (host.endsWith(".r2.dev") || host.endsWith(".r2.cloudflarestorage.com")) {
      return null;
    }
    return parsed.origin;
  } catch {
    return null;
  }
}

export function isCloudflareImagesEnabled(override?: boolean): boolean {
  if (typeof override === "boolean") return override;
  return process.env.NEXT_PUBLIC_CLOUDFLARE_IMAGES_ENABLED === "true";
}

export function isCloudflareTransformedUrl(src: string): boolean {
  return typeof src === "string" && src.includes("/cdn-cgi/image/");
}

export function isSvgUrl(src: string): boolean {
  if (!src || typeof src !== "string") return false;
  const clean = src.split("?")[0].split("#")[0].toLowerCase();
  return clean.endsWith(".svg") || src.startsWith("data:image/svg+xml");
}

/**
 * Determine if a URL belongs strictly to our configured R2 custom media origin.
 * Never accepts arbitrary external origins for Cloudflare image transformations.
 */
export function isAllowedMediaSourceUrl(src: string, allowedOrigin?: string): boolean {
  const expectedOrigin = getConfiguredMediaOrigin(allowedOrigin);
  if (!expectedOrigin) return false;

  try {
    const parsed = new URL(src);
    return parsed.origin === expectedOrigin && parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Resolve dual-read media URL: prefer verified R2 URL, fall back to legacy Supabase URL or local path.
 */
export function resolveMediaSrc(record: {
  public_url?: string | null;
  file_url?: string | null;
  legacy_public_url?: string | null;
  migration_status?: string | null;
  storage_provider?: string | null;
}): string {
  // If migration failed or rolled back, explicitly prefer legacy URL if available
  if (
    (record.migration_status === "failed" || record.migration_status === "rolled_back") &&
    record.legacy_public_url
  ) {
    return record.legacy_public_url;
  }

  return (
    record.public_url ||
    record.file_url ||
    record.legacy_public_url ||
    "/images/projects/technovolt-chantier-01.jpg"
  );
}

/**
 * Safely build a Cloudflare Images Transformation URL (/cdn-cgi/image/...)
 * for R2-hosted assets on the configured custom domain.
 *
 * - Restricts source origins strictly to the configured R2 custom domain.
 * - Uses `fit=scale-down` so images are never upscaled unnecessarily.
 * - Uses `format=auto` for AVIF/WebP negotiation and preserves PNG transparency.
 * - Skips transformation for SVGs, blob:/data: URLs, relative local assets, or legacy URLs.
 */
export function buildCloudflareImageUrl(
  src: string,
  variant: ImageVariant = "standard",
  options: BuildCloudflareImageOptions = {}
): string {
  if (!src || typeof src !== "string") {
    return src;
  }

  // Already transformed -> return as-is to prevent double transformation
  if (isCloudflareTransformedUrl(src)) {
    return src;
  }

  // Never transform local preview URLs, relative paths, or SVGs
  if (
    src.startsWith("blob:") ||
    src.startsWith("data:") ||
    src.startsWith("/") ||
    isSvgUrl(src) ||
    variant === "original"
  ) {
    return src;
  }

  const enabled = isCloudflareImagesEnabled(options.transformationsEnabled);
  if (!enabled) {
    return src;
  }

  const allowedOrigin = getConfiguredMediaOrigin(options.allowedMediaOrigin);
  if (!allowedOrigin || !isAllowedMediaSourceUrl(src, allowedOrigin)) {
    // Dual-read safety: return legacy Supabase or external URL untouched without proxying through Cloudflare
    return src;
  }

  const rawWidth =
    typeof options.width === "number" && Number.isFinite(options.width)
      ? options.width
      : IMAGE_VARIANT_WIDTHS[variant];
  const clampedWidth = Math.max(50, Math.min(3840, Math.round(rawWidth)));
  const rawQuality =
    typeof options.quality === "number" && Number.isFinite(options.quality)
      ? options.quality
      : DEFAULT_IMAGE_QUALITY;
  const quality = Math.max(10, Math.min(100, Math.round(rawQuality)));
  const ALLOWED_FITS = ["scale-down", "contain", "cover", "crop", "pad"] as const;
  const ALLOWED_FORMATS = ["auto", "webp", "avif", "jpeg", "json"] as const;
  const fit =
    options.fit && (ALLOWED_FITS as readonly string[]).includes(options.fit)
      ? options.fit
      : "scale-down";
  const format =
    options.format && (ALLOWED_FORMATS as readonly string[]).includes(options.format)
      ? options.format
      : "auto";

  const zoneOrigin =
    getConfiguredMediaOrigin(options.transformationZoneOrigin) || allowedOrigin;

  const parsedSource = new URL(src);
  const directives = `width=${clampedWidth},quality=${quality},format=${format},fit=${fit}`;

  // When transformation zone matches media origin, use clean relative path after /cdn-cgi/image/<opts>
  if (zoneOrigin === parsedSource.origin) {
    const pathAndQuery = `${parsedSource.pathname}${parsedSource.search}`;
    return `${zoneOrigin}/cdn-cgi/image/${directives}${pathAndQuery}`;
  }

  return `${zoneOrigin}/cdn-cgi/image/${directives}/${parsedSource.toString()}`;
}

/**
 * Convenience helpers for standard TECHNOVOLT responsive image presets.
 */
export const mediaImageUrl = {
  thumbnail: (src: string, opts?: BuildCloudflareImageOptions) =>
    buildCloudflareImageUrl(src, "thumbnail", opts),
  card: (src: string, opts?: BuildCloudflareImageOptions) =>
    buildCloudflareImageUrl(src, "card", opts),
  standard: (src: string, opts?: BuildCloudflareImageOptions) =>
    buildCloudflareImageUrl(src, "standard", opts),
  large: (src: string, opts?: BuildCloudflareImageOptions) =>
    buildCloudflareImageUrl(src, "large", opts),
};

/**
 * Determine whether Next.js `<Image>` should bypass `/_next/image` to avoid double optimization.
 */
export function shouldBypassNextImageOptimization(src: string): boolean {
  if (!src) return false;
  return (
    isCloudflareTransformedUrl(src) ||
    isAllowedMediaSourceUrl(src) ||
    src.startsWith("blob:") ||
    src.startsWith("data:") ||
    isSvgUrl(src)
  );
}
