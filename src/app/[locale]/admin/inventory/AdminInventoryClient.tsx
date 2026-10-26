"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatCurrency } from "@/lib/utils";
import { ExportCsvButton } from "@/components/admin/ExportCsvButton";
import { createProductAction, deleteProductAction } from "@/app/actions/adminActions";
import {
  Package,
  Plus,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Search,
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

function generateProductId(): string {
  return `prod-${Date.now()}`;
}

interface Props {
  initialProducts: ProductItem[];
}

export function AdminInventoryClient({ initialProducts }: Props) {
  const router = useRouter();
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [addedProducts, setAddedProducts] = useState<ProductItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formCategory, setFormCategory] = useState("Tableaux & Protections");
  const [formPurchase, setFormPurchase] = useState("");
  const [formSale, setFormSale] = useState("");
  const [formQty, setFormQty] = useState("");
  const [formThreshold, setFormThreshold] = useState("5");
  const [formUnit, setFormUnit] = useState("pièce");
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const baseList = [...addedProducts, ...initialProducts];
  const products = baseList.filter(
    (p) => !deletedIds.includes(p.id) && !deletedIds.includes(p.sku)
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim() || !formSku.trim()) {
      setFormError("Veuillez saisir le nom de l'article et sa référence SKU.");
      return;
    }

    // Check duplicate SKU
    const isDuplicate = products.some(
      (p) => p.sku.trim().toLowerCase() === formSku.trim().toLowerCase()
    );
    if (isDuplicate) {
      setFormError(`La référence SKU "${formSku.trim()}" existe déjà dans votre inventaire.`);
      return;
    }

    const qty = parseInt(formQty, 10);
    const purchase = parseFloat(formPurchase);
    const sale = parseFloat(formSale);
    const threshold = parseInt(formThreshold, 10);

    if (isNaN(qty) || qty < 0) {
      setFormError("La quantité en stock doit être un entier positif ou nul.");
      return;
    }

    setIsSubmitting(true);
    let createdId = generateProductId();

    try {
      const res = await createProductAction({
        name: formName.trim(),
        sku: formSku.trim(),
        category: formCategory.trim() || "Tableaux & Protections",
        purchase_cost: !isNaN(purchase) && purchase >= 0 ? purchase : 0,
        sale_price: !isNaN(sale) && sale >= 0 ? sale : 0,
        quantity: qty,
        low_stock_threshold: !isNaN(threshold) && threshold >= 0 ? threshold : 5,
        unit: formUnit,
      });
      if (res.success && res.data?.id) {
        createdId = res.data.id;
      }
    } catch (err) {
      console.error("Failed to sync product to database:", err);
    }

    const newProd: ProductItem = {
      id: createdId,
      sku: formSku.trim(),
      name: formName.trim(),
      category: formCategory.trim() || "Général",
      purchase_cost: !isNaN(purchase) && purchase >= 0 ? purchase : 0,
      sale_price: !isNaN(sale) && sale >= 0 ? sale : 0,
      quantity: qty,
      low_stock_threshold: !isNaN(threshold) && threshold >= 0 ? threshold : 0,
      unit: formUnit,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    setAddedProducts((prev) => [newProd, ...prev]);
    router.refresh();
    setIsSubmitting(false);
    showToast(`Article "${newProd.name}" (${newProd.sku}) ajouté au stock !`);
    setIsModalOpen(false);
    setFormName("");
    setFormSku("");
    setFormCategory("Tableaux & Protections");
    setFormPurchase("");
    setFormSale("");
    setFormQty("");
    setFormThreshold("5");
    setFormUnit("pièce");
    setFormError(null);
  };

  const handleDelete = async (id: string) => {
    setDeletedIds((prev) => [...prev, id]);
    setAddedProducts((prev) => prev.filter((p) => p.id !== id && p.sku !== id));
    try {
      await deleteProductAction(id);
    } catch (err) {
      console.error("Failed to delete product from database:", err);
    }
    router.refresh();
    setDeleteConfirmId(null);
    showToast("Article supprimé.");
  };

  const filteredProducts = products.filter((prod) => {
    return (
      prod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prod.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prod.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {toastMessage && (
        <div className="fixed bottom-5 end-5 z-50 bg-[#0B69FF] text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 text-sm font-semibold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Package className="h-6 w-6 text-[#0B69FF]" />
            <span>Stock & Fournitures Matériel</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Inventaire des fournitures électriques, outillage et fluides à Tataouine
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ExportCsvButton
            filename="stock-inventaire-technovolt"
            label="Exporter CSV"
            headers={["Code SKU", "Désignation", "Catégorie", "Prix Achat (TND)", "Prix Vente (TND)", "Quantité", "Unité", "Seuil Alerte"]}
            rows={filteredProducts.map((p) => [
              p.sku,
              p.name,
              p.category,
              p.purchase_cost,
              p.sale_price,
              p.quantity,
              p.unit,
              p.low_stock_threshold,
            ])}
          />

          <Button
            variant="default"
            size="sm"
            className="gap-1.5 font-semibold text-xs bg-[#0B69FF] hover:bg-[#094FC9]"
            onClick={() => {
              setFormError(null);
              setIsModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            <span>Ajouter un Article</span>
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="absolute start-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Rechercher article, SKU ou catégorie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="ps-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* Inventory Table */}
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
                <th className="px-4 py-3.5 text-center">Seuil Alerte</th>
                <th className="px-4 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((prod) => (
                <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-4 font-mono text-[11px] text-[#0B69FF] font-semibold">{prod.sku}</td>
                  <td className="px-4 py-4 font-bold text-slate-900 text-sm">{prod.name}</td>
                  <td className="px-4 py-4 text-slate-600">{prod.category}</td>
                  <td className="px-4 py-4 text-end font-mono">{formatCurrency(prod.purchase_cost, "fr")}</td>
                  <td className="px-4 py-4 text-end font-mono font-semibold">{formatCurrency(prod.sale_price, "fr")}</td>
                  <td className="px-4 py-4 text-center font-bold">
                    <span
                      className={`inline-block px-2 py-0.5 rounded ${
                        prod.quantity <= prod.low_stock_threshold
                          ? "bg-rose-100 text-rose-800"
                          : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      {prod.quantity} {prod.unit}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center text-slate-500 font-mono">{prod.low_stock_threshold}</td>
                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => setDeleteConfirmId(prod.id)}
                      className="p-1.5 rounded-md text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400 text-xs">Aucun article trouvé.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Plus className="h-5 w-5 text-[#0B69FF]" />
                <span>Ajouter un Article au Stock</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nom / Désignation *</label>
                <Input
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Disjoncteur modulaire 16A"
                  className="h-10 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Référence SKU *</label>
                <Input
                  required
                  value={formSku}
                  onChange={(e) => setFormSku(e.target.value)}
                  placeholder="Ex: DISJ-16A-SCHN"
                  className="h-10 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catégorie</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white"
                >
                  <option value="Tableaux & Protections">Tableaux & Protections</option>
                  <option value="Câbles & Conducteurs">Câbles & Conducteurs</option>
                  <option value="Appareillage Mural">Appareillage Mural</option>
                  <option value="Éclairage LED">Éclairage LED</option>
                  <option value="Climatisation">Climatisation</option>
                  <option value="Outillage">Outillage</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Prix Achat HT (TND)</label>
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    value={formPurchase}
                    onChange={(e) => setFormPurchase(e.target.value)}
                    placeholder="0.000"
                    className="h-10 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Prix Vente HT (TND)</label>
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    value={formSale}
                    onChange={(e) => setFormSale(e.target.value)}
                    placeholder="0.000"
                    className="h-10 text-sm font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantité *</label>
                  <Input
                    required
                    type="number"
                    min="0"
                    value={formQty}
                    onChange={(e) => setFormQty(e.target.value)}
                    placeholder="0"
                    className="h-10 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unité</label>
                  <Input
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    placeholder="pièce"
                    className="h-10 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Seuil Alerte</label>
                  <Input
                    type="number"
                    min="0"
                    value={formThreshold}
                    onChange={(e) => setFormThreshold(e.target.value)}
                    placeholder="5"
                    className="h-10 text-sm font-mono"
                  />
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs font-medium"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  disabled={isSubmitting}
                  className="text-xs font-bold bg-[#0B69FF] hover:bg-[#094FC9]"
                >
                  {isSubmitting ? "Enregistrement..." : "Enregistrer l'article"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">Supprimer cet article ?</h4>
              <p className="text-xs text-slate-500 mt-1">Cette action supprimera l'article de l'inventaire.</p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmId(null)}
                className="text-xs"
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(deleteConfirmId)}
                className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
              >
                Oui, supprimer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
