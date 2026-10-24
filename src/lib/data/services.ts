import { createClient } from "@/lib/supabase/server";
import { defaultServices, defaultProjects, defaultCompanySettings } from "./initialData";
import { Service, Project, CompanySettings } from "@/types/database";

export async function getCompanySettings(): Promise<CompanySettings> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("company_settings")
      .select("settings")
      .limit(1)
      .single();

    if (error || !data?.settings) {
      return defaultCompanySettings;
    }
    return { ...defaultCompanySettings, ...data.settings };
  } catch {
    return defaultCompanySettings;
  }
}

export async function getServices(locale: string = "fr"): Promise<Service[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("services")
      .select(`
        *,
        service_translations (
          locale,
          title,
          short_description,
          full_description,
          scope_of_work,
          benefits
        )
      `)
      .eq("status", "published")
      .order("sort_order", { ascending: true });

    if (error || !data || data.length === 0) {
      return defaultServices;
    }

    return data.map((item: any) => {
      const translation = item.service_translations?.find(
        (t: any) => t.locale === locale
      ) || item.service_translations?.[0];

      return {
        ...item,
        title: translation?.title || item.title || item.slug,
        short_description: translation?.short_description || item.short_description,
        full_description: translation?.full_description || item.full_description,
        scope_of_work: translation?.scope_of_work || item.scope_of_work || [],
        benefits: translation?.benefits || item.benefits || [],
      };
    });
  } catch {
    return defaultServices;
  }
}

export async function getServiceBySlug(slug: string, locale: string = "fr"): Promise<Service | null> {
  try {
    const services = await getServices(locale);
    const found = services.find((s) => s.slug === slug);
    return found || null;
  } catch {
    return defaultServices.find((s) => s.slug === slug) || null;
  }
}

export async function getProjects(locale: string = "fr"): Promise<Project[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("projects")
      .select(`
        *,
        project_translations (
          locale,
          title,
          description,
          location_label
        )
      `)
      .eq("status", "published")
      .order("sort_order", { ascending: true });

    if (error || !data || data.length === 0) {
      return defaultProjects;
    }

    return data.map((item: any) => {
      const translation = item.project_translations?.find(
        (t: any) => t.locale === locale
      ) || item.project_translations?.[0];

      return {
        ...item,
        title: translation?.title || item.title,
        description: translation?.description || item.description,
        location: translation?.location_label || item.location,
      };
    });
  } catch {
    return defaultProjects;
  }
}
