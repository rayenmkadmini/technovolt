"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  Shield,
  Plus,
  CheckCircle2,
  Trash2,
  X,
} from "lucide-react";

export interface UserItem {
  id: string;
  fullName: string;
  email: string;
  role: string;
  roleLabel: string;
  status: string;
  lastLogin: string;
  permissions: string;
}

const STORAGE_KEY = "technovolt_admin_users";

const ROLE_OPTIONS = [
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "Administrateur" },
  { value: "client", label: "Client (Portail)" },
];

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Administrateur",
  client: "Client (Portail)",
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-purple-100 text-purple-900 border-purple-200",
  admin: "bg-slate-100 text-slate-800 border-slate-200",
  client: "bg-orange-100 text-orange-900 border-orange-200",
};

const ROLE_PERMS: Record<string, string> = {
  super_admin: "Accès Total Illimité (Super Administrateur, Rôles, Supabase, RLS, Finances, CMS)",
  admin: "Gestion des opérations, clients, stocks et finances",
  client: "Consultation devis & factures personnelles, demande d'intervention",
};

interface AdminUsersClientProps {
  initialUsers: UserItem[];
}

export function AdminUsersClient({ initialUsers }: AdminUsersClientProps) {
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState("client");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setTimeout(() => setUsers(parsed), 0);
        }
      }
    } catch {
      // fallback
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const saveUsers = (newUsers: UserItem[]) => {
    setUsers(newUsers);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUsers));
      window.dispatchEvent(new Event("storage"));
    } catch (e) {
      console.error("Failed to save users", e);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      alert("Veuillez saisir le nom et l'email.");
      return;
    }
    const newUser: UserItem = {
      id: `usr-${Date.now()}`,
      fullName: formName.trim(),
      email: formEmail.trim(),
      role: formRole,
      roleLabel: ROLE_LABELS[formRole] || formRole,
      status: "active",
      lastLogin: "Jamais connecté",
      permissions: ROLE_PERMS[formRole] || "",
    };
    saveUsers([newUser, ...users]);
    showToast("Utilisateur ajouté avec succès !");
    setIsModalOpen(false);
    setFormName("");
    setFormEmail("");
    setFormRole("client");
  };

  const handleDelete = (id: string) => {
    saveUsers(users.filter((u) => u.id !== id));
    setDeleteConfirmId(null);
    showToast("Utilisateur supprimé.");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {toastMessage && (
        <div className="fixed bottom-5 end-5 z-50 bg-[#0B69FF] text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 text-sm font-semibold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Shield className="h-6 w-6 text-[#0B69FF]" />
            <span>Gestion des Utilisateurs & Rôles d'Accès (RBAC)</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Le Super Admin peut créer des comptes Super Admin, Administrateur et Client.
          </p>
        </div>
        <Button variant="default" size="sm" className="gap-1.5 font-semibold text-xs" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4" />
          <span>Inviter un Utilisateur</span>
        </Button>
      </div>

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
                <th className="px-4 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((usr) => (
                <tr key={usr.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-4">
                    <div className="font-bold text-slate-900 text-sm">{usr.fullName}</div>
                    <div className="text-[11px] text-slate-500">{usr.email}</div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-block px-2.5 py-1 rounded text-xs font-semibold border ${ROLE_COLORS[usr.role] || "bg-slate-100 text-slate-800 border-slate-200"}`}>
                      {usr.roleLabel}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-600 max-w-xs">{usr.permissions}</td>
                  <td className="px-4 py-4 text-slate-500 text-xs">{usr.lastLogin}</td>
                  <td className="px-4 py-4 text-center">
                    <Badge variant="success" className="text-[10px]">Actif</Badge>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => setDeleteConfirmId(usr.id)}
                      className="p-1.5 rounded-md text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Plus className="h-5 w-5 text-[#0B69FF]" />
                <span>Inviter un Utilisateur</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nom complet *</label>
                <Input required value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ex: Jean Dupont" className="h-10 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
                <Input required type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="email@technovolt.tn" className="h-10 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rôle</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0B69FF]"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="text-xs font-medium">Annuler</Button>
                <Button type="submit" variant="default" className="text-xs font-bold bg-[#0B69FF] hover:bg-[#094FC9]">Inviter</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">Supprimer cet utilisateur ?</h4>
              <p className="text-xs text-slate-500 mt-1">Cette action supprimera l'utilisateur de la liste.</p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirmId(null)} className="text-xs">Annuler</Button>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(deleteConfirmId)} className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white">Oui, supprimer</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}