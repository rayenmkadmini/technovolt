import { setRequestLocale } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminInventoryClient, ProductItem } from "./AdminInventoryClient";

export default async function AdminInventoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  let initialProducts: ProductItem[] = [];

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      initialProducts = data.map((prod: any) => ({
        id: prod.id,
        sku: prod.sku || `SKU-${prod.id.slice(0, 8)}`,
        name: prod.name || prod.name_fr || "Article",
        category: prod.category || "Tableaux & Protections",
        purchase_cost: Number(prod.purchase_cost) || 0,
        sale_price: Number(prod.sale_price) || 0,
        quantity: Number(prod.quantity) || 0,
        low_stock_threshold: Number(prod.low_stock_threshold) || 5,
        unit: prod.unit || "pièce",
        is_active: prod.is_active ?? true,
        created_at: prod.created_at,
      }));
    }
  } catch (err) {
    console.error("Failed to load products from Supabase:", err);
  }

  return <AdminInventoryClient initialProducts={initialProducts} />;
}
