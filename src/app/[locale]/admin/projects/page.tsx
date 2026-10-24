import { setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { getProjects } from "@/lib/data/services";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Image as ImageIcon,
  Plus,
  MapPin,
  Calendar,
  Edit,
  Trash2,
} from "lucide-react";

export default async function AdminProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const projects = await getProjects(locale);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ImageIcon className="h-6 w-6 text-[#1B3A6B]" />
            <span>Galerie & Chantiers Réalisés (CMS Portfolio)</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gérer les photographies, descriptions et catégories des projets présentés au public
          </p>
        </div>

        <Button variant="default" size="sm" className="gap-1.5 font-semibold text-xs">
          <Plus className="h-4 w-4" />
          <span>Ajouter un Projet</span>
        </Button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((proj) => (
          <div
            key={proj.id}
            className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col"
          >
            <div className="relative aspect-[16/9] bg-slate-100">
              <Image
                src={proj.cover_image}
                alt={proj.title || "Projet"}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute top-3 start-3">
                <span className="inline-block px-2.5 py-1 rounded bg-[#1B3A6B]/90 text-white text-xs font-semibold backdrop-blur-md">
                  {proj.category}
                </span>
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-[#F5A623]" />
                    <span>{proj.location}</span>
                  </span>
                  <span>{proj.completion_date}</span>
                </div>

                <h3 className="text-lg font-bold text-slate-900">
                  {proj.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {proj.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <Badge variant="success" className="text-[10px]">
                  Publié sur le site
                </Badge>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs">
                    <Edit className="h-3.5 w-3.5 me-1" />
                    <span>Modifier</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
