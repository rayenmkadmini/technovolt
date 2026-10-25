import { Service, Project, CompanySettings } from "@/types/database";

export const defaultCompanySettings: CompanySettings = {
  company_name: "TECHNOVOLT",
  tagline: "Électricité générale | Domotique",
  tagline_ar: "كهرباء عامة | أنظمة تحكم ذكي",
  tagline_en: "General Electrical | Smart Home",
  phone: "+216 75 000 000",
  whatsapp: "+216 90 000 000",
  email: "contact@technovolt.tn",
  address: "Centre Ville, Route de Remada",
  city: "Tataouine",
  governorate: "Tataouine",
  country: "Tunisie",
  opening_hours_fr: "Lundi - Samedi : 08h00 - 18h00",
  opening_hours_ar: "الإثنين - السبت : 08:00 - 18:00",
  opening_hours_en: "Monday - Saturday: 8:00 AM - 6:00 PM",
  logo_url: "/logo.jpg",
  default_tax_rate: 19.0,
  currency: "TND",
};

export const defaultServices: Service[] = [];

export const defaultProjects: Project[] = [];
