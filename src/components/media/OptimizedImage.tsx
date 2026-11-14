"use client";

import Image, { type ImageProps } from "next/image";
import { useState, useEffect } from "react";
import {
  buildCloudflareImageUrl,
  getConfiguredMediaOrigin,
  shouldBypassNextImageOptimization,
  type ImageVariant,
} from "@/lib/media/imageUrl";

export interface OptimizedImageProps extends Omit<ImageProps, "src"> {
  src?: string | null;
  variant?: ImageVariant;
  quality?: number;
}

const FALLBACK_IMAGE_SRC = "/images/projects/technovolt-chantier-01.jpg";

function normalizeImageSrc(src: unknown): string {
  if (typeof src !== "string") return FALLBACK_IMAGE_SRC;
  const trimmed = src.trim();
  if (!trimmed) return FALLBACK_IMAGE_SRC;
  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }
  return `/${trimmed}`;
}

function isNextImageConfiguredHost(src: string): boolean {
  if (!src.startsWith("https://")) return false;
  try {
    const parsed = new URL(src);
    const host = parsed.hostname.toLowerCase();
    if (
      host.endsWith(".supabase.co") ||
      host === "technovolt.tn" ||
      host === "technovolt.vercel.app"
    ) {
      return true;
    }
    const mediaOrigin = getConfiguredMediaOrigin();
    return Boolean(mediaOrigin && parsed.origin === mediaOrigin);
  } catch {
    return false;
  }
}

/**
 * Drop-in wrapper around `next/image` that:
 * 1. Generates safe Cloudflare Images transformation URLs (`/cdn-cgi/image/...`) for R2 assets.
 * 2. Preserves legacy Supabase Storage URLs and local static assets without breaking dual-read.
 * 3. Bypasses Next.js `/_next/image` when serving Cloudflare-transformed, R2, or external legacy URLs so SSR never throws.
 * 4. Gracefully catches loading errors and swaps in the verified fallback image.
 */
export function OptimizedImage({
  src,
  variant = "standard",
  quality,
  unoptimized,
  loading,
  alt,
  priority,
  onError,
  ...rest
}: OptimizedImageProps) {
  const safeSrc = normalizeImageSrc(src);
  const transformedSrc = buildCloudflareImageUrl(safeSrc, variant, { quality });
  const isUnconfiguredRemote =
    (transformedSrc.startsWith("http://") || transformedSrc.startsWith("https://")) &&
    !isNextImageConfiguredHost(transformedSrc);
  const bypass = Boolean(
    unoptimized || shouldBypassNextImageOptimization(transformedSrc) || isUnconfiguredRemote
  );

  const [currentSrc, setCurrentSrc] = useState(transformedSrc);

  useEffect(() => {
    setCurrentSrc(transformedSrc);
  }, [transformedSrc]);

  return (
    <Image
      {...rest}
      alt={alt ?? "TECHNOVOLT"}
      src={currentSrc}
      priority={priority}
      loading={priority ? undefined : loading ?? "lazy"}
      unoptimized={bypass}
      onError={(e) => {
        if (currentSrc !== FALLBACK_IMAGE_SRC) {
          setCurrentSrc(FALLBACK_IMAGE_SRC);
        }
        onError?.(e);
      }}
    />
  );
}
