"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import {
  Package,
  Plus,
  Tag,
  Trash2,
  X,
  CheckCircle2,
} from "lucide-react";

export interface ProductItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  purchase_cost: number;
  sale_price: number;
  quantity: number;
  low_stock_threshold: number;
  unit: string;
  is_active: boolean;
  created_at: string;
}

const STORAGE_KEY = "technovolt_admin_products";

interface Props {
  initialProducts: ProductItem[];
}

export function AdminInventoryClient({ initialProducts }: Props) {
  const [products, setProducts] = useState<ProductItem[]>(initialProducts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formPurchase, setFormPurchase] = useState("");
  const [formSale, setFormSale] = useState("");
  const [formQty, setFormQty] = useState("");
  const [formThreshold, setFormThreshold] = useState("");
  const [formUnit, setFormUnit] = useState("pièce");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) setTimeout(() => setProducts(parsed), 0);
      }
    } catch {}
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const save = (next: ProductItem[]) => {
    setProducts(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.error("save products failed", e);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSku.trim()) {
      alert("Veuillez saisir le nom et la référence SKU.");
      return;
    }
    const newProd: ProductItem = {
      id: `prod-${Date.now()}`,
      sku: formSku.trim(),
      name: formName.trim(),
      category: formCategory.trim() || "Général",
      purchase_cost: Number(formPurchase) || 0,
      sale_price: Number(formSale) || 0,
      quantity: Number(formQty) || 0,
      low_stock_threshold: Number(formThreshold) || 0,
      unit: formUnit,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    save([newProd, ...products]);
    showToast("Article ajouté avec succès !");
    setIsModalOpen(false);
    setFormName("");
    setFormSku("");
    setFormCategory("");
    setFormPurchase("");
    setFormSale("");
    setFormQty("");
    setFormThreshold("");
    setFormUnit("pièce");
  };

  const handleDelete = (id: string) => {
    save(products.filter((p) => p.id !== id));
    setDeleteConfirmId(null);
    showToast("Article supprimé.");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {toastMessage && (
        <div className="fixed bottom-5 end-5 z-50 bg-[#0B69FF] text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 text-sm font-semibold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Package className="h-6 w-6 text-[#0B69FF]" />
            <span>Stock & Matériel</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">Inventaire des fournitures électriques, outillage et fluides frigorigènes</p>
        </div>
        <Button variant="default" size="sm" className="gap-1.5 font-semibold text-xs" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4" />
          <span>Ajouter un Article</span>
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3.5 text-start">Code SKU</th>
                <th className="px-4 py-3.5 text-start">Désignation</th>
                <th className="px-4 py-3.5 text-start">Catégorie</th>
                <th className="px-4 py-3.5 text-end">Prix Achat</th>
                <th className="px-4 py-3.5 text-end">Prix Vente</th>
                <th className="px-4 py-3.5 text-center">Quantité</th>
                <th className="px-4 py-3.5 text-center">Seuil</th>
                <th className="px-4 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((prod) => (
                <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-4 font-mono text-[11px] text-slate-500">{prod.sku}</td>
                  <td className="px-4 py-4 font-bold text-slate-900 text-sm">{prod.name}</td>
                  <td className="px-4 py-4 text-slate-600">{prod.category}</td>
                  <td className="px-4 py-4 text-end font-mono">{formatCurrency(prod.purchase_cost, "fr")}</td>
                  <td className="px-4 py-4 text-end font-mono">{formatCurrency(prod.sale_price, "fr")}</td>
                  <td className="px-4 py-4 text-center font-bold">{prod.quantity}</td>
                  <td className="px-4 py-4 text-center text-slate-500">{prod.low_stock_threshold}</td>
                  <td className="px-4 py-4 text-center">
                    <button onClick={() => setDeleteConfirmId(prod.id)} className="p-1.5 rounded-md text-rose-600 hover:bg-rose-50 transition-colors" title="Supprimer">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400 text-xs">Aucun article.</td>
                </tr>
              )}
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
                <span>Ajouter un Article</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nom *</label>
                <Input required value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ex: Disjoncteur 16A" className="h-10 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Référence SKU *</label>
                <Input required value={formSku} onChange={(e) => setFormSku(e.target.value)} placeholder="Ex: DISJ-16A" className="h-10 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catégorie</label>
                <Input value={formCategory} onChange={(e) => setFormCategory(e.target.value)} placeholder="Tableau & Protection" className="h-10 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Prix achat (TND)</label>
                  <Input type="number" step="0.001" value={formPurchase} onChange={(e) => setFormPurchase(e.target.value)} placeholder="0.000" className="h-10 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Prix vente (TND)</label>
                  <Input type="number" step="0.001" value={formSale} onChange={(e) => setFormSale(e.target.value)} placeholder="0.000" className="h-10 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantité</label>
                  <Input type="number" value={formQty} onChange={(e) => setFormQty(e.target.value)} placeholder="0" className="h-10 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Seuil d'alerte</label>
                  <Input type="number" value={formThreshold} onChange={(e) => setFormThreshold(e.target.value)} placeholder="0" className="h-10 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Unité</label>
                <Input value={formUnit} onChange={(e) => setFormUnit(e.target.value)} placeholder="pièce" className="h-10 text-sm" />
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="text-xs font-medium">Annuler</Button>
                <Button type="submit" variant="default" className="text-xs font-bold bg-[#0B69FF] hover:bg-[#094FC9]">Enregistrer</Button>
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
              <h4 className="font-bold text-slate-900 text-base">Supprimer cet article ?</h4>
              <p className="text-xs text-slate-500 mt-1">Cette action supprimera l'article.</p>
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