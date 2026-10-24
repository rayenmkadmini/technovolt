import { setRequestLocale } from "next-intl/server";
import { initialProducts } from "@/lib/data/adminStore";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Package,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Tag,
} from "lucide-react";

export default async function AdminInventoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Package className="h-6 w-6 text-[#1B3A6B]" />
            <span>Matériel, Produits & Gestion de Stock</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Inventaire des fournitures électriques, outillage et fluides frigorigènes
          </p>
        </div>

        <Button variant="default" size="sm" className="gap-1.5 font-semibold text-xs">
          <Plus className="h-4 w-4" />
          <span>Ajouter un Article</span>
        </Button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3.5 text-start">Code SKU</th>
                <th className="px-4 py-3.5 text-start">Désignation</th>
                <th className="px-4 py-3.5 text-start">Catégorie</th>
                <th className="px-4 py-3.5 text-end">Coût Achat HT</th>
                <th className="px-4 py-3.5 text-end">Prix Vente HT</th>
                <th className="px-4 py-3.5 text-center">Stock Actuel</th>
                <th className="px-4 py-3.5 text-start">Fournisseur</th>
                <th className="px-4 py-3.5 text-center">Alerte Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {initialProducts.map((prod) => {
                const isLowStock = prod.quantity <= prod.low_stock_threshold;
                return (
                  <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-4 font-mono font-bold text-[#1B3A6B]">
                      {prod.sku}
                    </td>

                    <td className="px-4 py-4 font-bold text-slate-900 text-sm">
                      {prod.name}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {prod.category}
                    </td>

                    <td className="px-4 py-4 text-end text-slate-500 font-mono">
                      {formatCurrency(prod.purchase_cost, locale)}
                    </td>

                    <td className="px-4 py-4 text-end font-bold text-slate-900 font-mono">
                      {formatCurrency(prod.sale_price, locale)}
                    </td>

                    <td className="px-4 py-4 text-center font-bold text-sm">
                      <span className={isLowStock ? "text-amber-600" : "text-slate-900"}>
                        {prod.quantity} {prod.unit}s
                      </span>
                    </td>

                    <td className="px-4 py-4 text-slate-600 text-xs">
                      {prod.supplier_name}
                    </td>

                    <td className="px-4 py-4 text-center">
                      {isLowStock ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Stock Bas (&le; {prod.low_stock_threshold})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-600 text-[10px] font-semibold">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Normal</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
