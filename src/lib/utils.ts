// src/lib/utils.ts
// Utility functions for the TECHNOVOLT platform

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a monetary value in TND (Tunisian Dinar)
 * TND has 3 decimal places (millimes)
 */
export function formatCurrency(
  amount: number,
  locale: string = "fr-TN",
  currency: string = "TND"
): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-TN" : locale === "en" ? "en-TN" : "fr-TN", {
    style: "currency",
    currency,
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(amount);
}

/**
 * Format a date according to locale
 */
export function formatDate(
  date: Date | string,
  locale: string = "fr",
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const localeMap: Record<string, string> = {
    fr: "fr-FR",
    ar: "ar-TN",
    en: "en-US",
  };
  return d.toLocaleDateString(localeMap[locale] || "fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  });
}

/**
 * Format a number according to locale
 */
export function formatNumber(num: number, locale: string = "fr"): string {
  const localeMap: Record<string, string> = {
    fr: "fr-FR",
    ar: "ar-TN",
    en: "en-US",
  };
  return new Intl.NumberFormat(localeMap[locale] || "fr-FR").format(num);
}

/**
 * Generate a unique reference number
 */
export function generateReference(prefix: string): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${year}${month}-${random}`;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

/**
 * Slugify a string for URLs
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Check if a locale is RTL
 */
export function isRTL(locale: string): boolean {
  return locale === "ar";
}

/**
 * Get the text direction for a locale
 */
export function getDirection(locale: string): "ltr" | "rtl" {
  return isRTL(locale) ? "rtl" : "ltr";
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Calculate percentage
 */
export function percentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100 * 100) / 100;
}

/**
 * Monetary calculation helpers (avoid floating point issues)
 * All monetary values are stored as DECIMAL(12,3) in the database
 */
export const money = {
  /**
   * Add monetary values safely
   */
  add(...amounts: number[]): number {
    return amounts.reduce((sum, amount) => {
      return Math.round((sum + amount) * 1000) / 1000;
    }, 0);
  },

  /**
   * Subtract monetary values safely
   */
  subtract(a: number, b: number): number {
    return Math.round((a - b) * 1000) / 1000;
  },

  /**
   * Multiply (e.g., quantity × unit price)
   */
  multiply(a: number, b: number): number {
    return Math.round(a * b * 1000) / 1000;
  },

  /**
   * Calculate tax amount
   */
  tax(amount: number, rate: number): number {
    return Math.round(amount * (rate / 100) * 1000) / 1000;
  },

  /**
   * Calculate discount
   */
  discount(amount: number, discount: number, type: "fixed" | "percentage"): number {
    if (type === "percentage") {
      return Math.round(amount * (discount / 100) * 1000) / 1000;
    }
    return discount;
  },
};
