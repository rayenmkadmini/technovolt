import { setRequestLocale } from "next-intl/server";
import { getProjects } from "@/lib/data/services";
import { AdminProjectsClient, ProjectItem } from "./AdminProjectsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const rawProjects = await getProjects(locale);

  const initialProjects: ProjectItem[] = rawProjects.map((p) => ({
    id: p.id,
    title: p.title || "Projet TECHNOVOLT",
    category: p.category || "Électricité Générale",
    location: p.location || "Tataouine, Tunisie",
    completion_date: p.completion_date || "",
    description: p.description || "",
    cover_image: p.cover_image || "/images/projects/technovolt-chantier-01.jpg",
    is_featured: p.is_featured ?? true,
  }));

  return <AdminProjectsClient initialProjects={initialProjects} />;
}
