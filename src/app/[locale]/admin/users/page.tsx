import { setRequestLocale } from "next-intl/server";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Users,
  Shield,
  Plus,
  Key,
  CheckCircle2,
  Lock,
} from "lucide-react";

const demoUsers = [
  {
    id: "usr-00",
    fullName: "Rayen Mkadmini (Super Admin)",
    email: "rayen25360@gmail.com",
    role: "super_admin",
    roleLabel: "Super Admin",
    status: "active",
    lastLogin: "Session active (Connecté)",
    permissions: "Accès Total Illimité (Super Administrateur, Rôles, Supabase, RLS, Finances, CMS)",
  },
  {
    id: "usr-01",
    fullName: "Directeur Technique TECHNOVOLT",
    email: "contact@technovolt.tn",
    role: "owner",
    roleLabel: "Propriétaire",
    status: "active",
    lastLogin: "Aujourd'hui à 08:35",
    permissions: "Accès Direction (Finances, Paramètres, Utilisateurs, Chantiers)",
  },
  {
    id: "usr-02",
    fullName: "Kamel B. (Technicien Électricien)",
    email: "kamel.tech@technovolt.tn",
    role: "technician",
    roleLabel: "Technicien",
    status: "active",
    lastLogin: "Hier à 17:15",
    permissions: "Ordres de Travail, Rendez-vous, Photos de chantiers",
  },
  {
    id: "usr-03",
    fullName: "Sihem T. (Comptabilité)",
    email: "finance@technovolt.tn",
    role: "accountant",
    roleLabel: "Comptable",
    status: "active",
    lastLogin: "23 Octobre 2026",
    permissions: "Factures, Devis, Règlements, Dépenses, Rapports Financiers",
  },
  {
    id: "usr-04",
    fullName: "Client Tataouine (Portail Client)",
    email: "client.tataouine@technovolt.tn",
    role: "client",
    roleLabel: "Client",
    status: "active",
    lastLogin: "Aujourd'hui à 11:20",
    permissions: "Consultation devis & factures personnelles, demande d'intervention",
  },
];

const systemRoles = [
  { name: "super_admin", label: "Super Admin", desc: "Autorité totale et illimitée sur la plateforme et les utilisateurs", color: "bg-purple-100 text-purple-900 border-purple-200" },
  { name: "owner", label: "Propriétaire", desc: "Gérant principal de l'entreprise TECHNOVOLT", color: "bg-blue-100 text-blue-900 border-blue-200" },
  { name: "admin", label: "Administrateur", desc: "Gestion des opérations, clients, stocks et finances", color: "bg-slate-100 text-slate-800 border-slate-200" },
  { name: "manager", label: "Responsable d'Exploitation", desc: "Planning des interventions et suivi des chantiers", color: "bg-amber-100 text-amber-900 border-amber-200" },
  { name: "accountant", label: "Comptable", desc: "Facturation, règlements, TVA et export comptable", color: "bg-emerald-100 text-emerald-900 border-emerald-200" },
  { name: "technician", label: "Technicien Terrain", desc: "Exécution des ordres de mission et rapports photos", color: "bg-cyan-100 text-cyan-900 border-cyan-200" },
  { name: "content_editor", label: "Éditeur CMS", desc: "Gestion des pages web, réalisations et avis clients", color: "bg-indigo-100 text-indigo-900 border-indigo-200" },
  { name: "client", label: "Client (Portail)", desc: "Accès à ses devis, factures et suivi de ses demandes", color: "bg-orange-100 text-orange-900 border-orange-200" },
];

export default async function AdminUsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Shield className="h-6 w-6 text-[#1B3A6B]" />
            <span>Gestion des Utilisateurs & Rôles d'Accès (RBAC)</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Contrôle des autorisations d'accès basé sur les rôles et politiques Supabase RLS
          </p>
        </div>

        <Button variant="default" size="sm" className="gap-1.5 font-semibold text-xs">
          <Plus className="h-4 w-4" />
          <span>Inviter un Utilisateur</span>
        </Button>
      </div>

      {/* Role explanation cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1">
          <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
            <Key className="h-4 w-4 text-[#F5A623]" />
            <span>Super Admin & Gérant</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Contrôle complet des réglages fiscaux, coordonnées bancaires et gestion des accès d'équipe.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1">
          <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
            <Shield className="h-4 w-4 text-[#1B3A6B]" />
            <span>Comptabilité & Finances</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Gestion exclusive des devis, factures, encaissements et suivi des charges fournisseurs.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1">
          <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
            <Lock className="h-4 w-4 text-emerald-600" />
            <span>Techniciens Terrain</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Consultation des fiches chantiers assignées et téléversement des photos de réception sans accès aux bilans.
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3.5 text-start">Utilisateur</th>
                <th className="px-4 py-3.5 text-start">Rôle Assigné</th>
                <th className="px-4 py-3.5 text-start">Périmètre des Permissions</th>
                <th className="px-4 py-3.5 text-start">Dernière Connexion</th>
                <th className="px-4 py-3.5 text-center">État</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {demoUsers.map((usr) => (
                <tr key={usr.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-4">
                    <div className="font-bold text-slate-900 text-sm">
                      {usr.fullName}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {usr.email}
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <span className="inline-block px-2.5 py-1 rounded bg-[#1B3A6B]/10 text-[#1B3A6B] font-semibold text-xs">
                      {usr.roleLabel}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-slate-600 max-w-xs">
                    {usr.permissions}
                  </td>

                  <td className="px-4 py-4 text-slate-500 text-xs">
                    {usr.lastLogin}
                  </td>

                  <td className="px-4 py-4 text-center">
                    <Badge variant="success" className="text-[10px]">
                      Actif
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Roles Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Key className="h-4 w-4 text-[#F5A623]" />
            <span>Nomenclature des 8 Rôles Système & Périmètres de Sécurité (RBAC)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Chaque rôle dispose de règles de sécurité au niveau des lignes (Row Level Security - RLS) sous Supabase.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {systemRoles.map((r) => (
            <div
              key={r.name}
              className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${r.color}`}>
                  {r.label}
                </span>
                <code className="text-[10px] text-slate-400 font-mono">{r.name}</code>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {r.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
