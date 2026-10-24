import { MetadataRoute } from "next";
import { defaultServices } from "@/lib/data/initialData";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://technovolt.tn";
  const locales = ["fr", "ar", "en"];
  const staticRoutes = ["", "/services", "/projects", "/about", "/contact", "/quote"];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  // Static routes for each locale
  locales.forEach((locale) => {
    staticRoutes.forEach((route) => {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: route === "" ? 1.0 : 0.8,
      });
    });

    // Dynamic services routes
    defaultServices.forEach((service) => {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}/services/${service.slug}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.9,
      });
    });
  });

  return sitemapEntries;
}
