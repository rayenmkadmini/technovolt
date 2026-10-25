"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

// --- CUSTOMERS ---
export async function createCustomerAction(data: {
  full_name: string;
  phone?: string;
  email?: string;
  company_name?: string;
  notes?: string;
}) {
  try {
    const supabase = createAdminClient();
    const ref = `CL-${new Date().getFullYear().toString().slice(-2)}${Math.floor(1000 + Math.random() * 9000)}`;
    const { data: inserted, error } = await supabase
      .from("customers")
      .insert({
        reference_number: ref,
        full_name: data.full_name,
        phone: data.phone || null,
        email: data.email || null,
        company_name: data.company_name || null,
        notes: data.notes || null,
        is_active: true,
        total_spent: 0,
        outstanding_balance: 0,
      })
      .select()
      .single();

    if (error) throw error;
    revalidatePath("/[locale]/admin/customers", "page");
    revalidatePath("/[locale]/admin", "page");
    return { success: true, data: inserted };
  } catch (err: any) {
    console.error("createCustomerAction error:", err);
    return { success: false, error: err.message || "Failed to create customer" };
  }
}

export async function deleteCustomerAction(id: string) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) throw error;
    revalidatePath("/[locale]/admin/customers", "page");
    revalidatePath("/[locale]/admin", "page");
    return { success: true };
  } catch (err: any) {
    console.error("deleteCustomerAction error:", err);
    return { success: false, error: err.message || "Failed to delete customer" };
  }
}

// --- APPOINTMENTS ---
export async function createAppointmentAction(data: {
  customer_name: string;
  customer_phone?: string;
  service_title?: string;
  scheduled_date: string;
  scheduled_time: string;
  estimated_duration?: string;
  address?: string;
  notes?: string;
  technician_name?: string;
}) {
  try {
    const supabase = createAdminClient();

    // Find or create customer
    let customerId: string | null = null;
    if (data.customer_name) {
      const { data: existingCust } = await supabase
        .from("customers")
        .select("id")
        .ilike("full_name", data.customer_name.trim())
        .limit(1)
        .maybeSingle();

      if (existingCust) {
        customerId = existingCust.id;
      } else {
        const { data: newCust } = await supabase
          .from("customers")
          .insert({
            full_name: data.customer_name.trim(),
            phone: data.customer_phone?.trim() || null,
            notes: data.address || null,
          })
          .select("id")
          .single();
        customerId = newCust?.id || null;
      }
    }

    const ref = `RDV-${new Date().getFullYear().toString().slice(-2)}${Math.floor(1000 + Math.random() * 9000)}`;
    const { data: inserted, error } = await supabase
      .from("appointments")
      .insert({
        reference_number: ref,
        customer_id: customerId,
        scheduled_date: data.scheduled_date,
        scheduled_time: data.scheduled_time.length === 5 ? `${data.scheduled_time}:00` : data.scheduled_time,
        estimated_duration: data.estimated_duration || "1h30",
        address: data.address || "Tataouine",
        notes: data.service_title ? `${data.service_title}${data.notes ? ` - ${data.notes}` : ""}` : data.notes || null,
        status: "confirmed",
      })
      .select("*, customers(full_name, phone)")
      .single();

    if (error) throw error;
    revalidatePath("/[locale]/admin/appointments", "page");
    revalidatePath("/[locale]/admin", "page");
    return { success: true, data: inserted };
  } catch (err: any) {
    console.error("createAppointmentAction error:", err);
    return { success: false, error: err.message || "Failed to create appointment" };
  }
}

export async function deleteAppointmentAction(id: string) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (error) throw error;
    revalidatePath("/[locale]/admin/appointments", "page");
    revalidatePath("/[locale]/admin", "page");
    return { success: true };
  } catch (err: any) {
    console.error("deleteAppointmentAction error:", err);
    return { success: false, error: err.message || "Failed to delete appointment" };
  }
}

// --- WORK ORDERS ---
export async function createWorkOrderAction(data: {
  job_number?: string;
  customer_name: string;
  customer_phone?: string;
  service_title?: string;
  description: string;
  status: string;
  start_date: string;
  completion_date?: string;
  labor_hours?: number;
  total_cost?: number;
  notes?: string;
}) {
  try {
    const supabase = createAdminClient();

    let customerId: string | null = null;
    if (data.customer_name) {
      const { data: existingCust } = await supabase
        .from("customers")
        .select("id")
        .ilike("full_name", data.customer_name.trim())
        .limit(1)
        .maybeSingle();

      if (existingCust) {
        customerId = existingCust.id;
      } else {
        const { data: newCust } = await supabase
          .from("customers")
          .insert({
            full_name: data.customer_name.trim(),
            phone: data.customer_phone?.trim() || null,
          })
          .select("id")
          .single();
        customerId = newCust?.id || null;
      }
    }

    const jobNum = data.job_number || `OT-${new Date().getFullYear().toString().slice(-2)}${Math.floor(1000 + Math.random() * 9000)}`;
    const { data: inserted, error } = await supabase
      .from("work_orders")
      .insert({
        job_number: jobNum,
        customer_id: customerId,
        description: data.description,
        status: data.status || "in_progress",
        start_date: data.start_date,
        completion_date: data.completion_date || null,
        labor_hours: data.labor_hours || 0,
        total_cost: data.total_cost || 0,
        notes: data.notes || (data.service_title ? `Service: ${data.service_title}` : null),
      })
      .select("*, customers(full_name, phone)")
      .single();

    if (error) throw error;
    revalidatePath("/[locale]/admin/work-orders", "page");
    revalidatePath("/[locale]/admin", "page");
    return { success: true, data: inserted };
  } catch (err: any) {
    console.error("createWorkOrderAction error:", err);
    return { success: false, error: err.message || "Failed to create work order" };
  }
}

export async function deleteWorkOrderAction(id: string) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("work_orders").delete().eq("id", id);
    if (error) throw error;
    revalidatePath("/[locale]/admin/work-orders", "page");
    revalidatePath("/[locale]/admin", "page");
    return { success: true };
  } catch (err: any) {
    console.error("deleteWorkOrderAction error:", err);
    return { success: false, error: err.message || "Failed to delete work order" };
  }
}

// --- PAYMENTS ---
export async function createPaymentAction(data: {
  customer_name: string;
  invoice_number?: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  receipt_reference?: string;
  notes?: string;
}) {
  try {
    const supabase = createAdminClient();

    let customerId: string | null = null;
    if (data.customer_name) {
      const { data: existingCust } = await supabase
        .from("customers")
        .select("id")
        .ilike("full_name", data.customer_name.trim())
        .limit(1)
        .maybeSingle();

      if (existingCust) {
        customerId = existingCust.id;
      }
    }

    const ref = `REG-${new Date().getFullYear().toString().slice(-2)}${Math.floor(1000 + Math.random() * 9000)}`;
    const { data: inserted, error } = await supabase
      .from("payments")
      .insert({
        payment_reference: ref,
        customer_id: customerId,
        amount: data.amount,
        currency: "TND",
        payment_date: data.payment_date,
        payment_method: data.payment_method.toLowerCase().includes("virement")
          ? "bank_transfer"
          : data.payment_method.toLowerCase().includes("chèque")
          ? "check"
          : "cash",
        receipt_reference: data.receipt_reference || null,
        notes: data.notes || (data.invoice_number ? `Facture ${data.invoice_number}` : null),
      })
      .select("*, customers(full_name)")
      .single();

    if (error) throw error;

    // Update invoice if matched
    if (data.invoice_number) {
      const { data: inv } = await supabase
        .from("invoices")
        .select("id, amount_paid, total")
        .eq("invoice_number", data.invoice_number)
        .maybeSingle();

      if (inv) {
        const newPaid = (Number(inv.amount_paid) || 0) + Number(data.amount);
        const total = Number(inv.total) || 0;
        const newBalance = Math.max(0, total - newPaid);
        const newStatus = newBalance === 0 ? "paid" : "partially_paid";

        await supabase
          .from("invoices")
          .update({
            amount_paid: newPaid,
            balance_due: newBalance,
            status: newStatus,
          })
          .eq("id", inv.id);
      }
    }

    revalidatePath("/[locale]/admin/payments", "page");
    revalidatePath("/[locale]/admin/invoices", "page");
    revalidatePath("/[locale]/admin", "page");
    return { success: true, data: inserted };
  } catch (err: any) {
    console.error("createPaymentAction error:", err);
    return { success: false, error: err.message || "Failed to record payment" };
  }
}

export async function deletePaymentAction(id: string) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("payments").delete().eq("id", id);
    if (error) throw error;
    revalidatePath("/[locale]/admin/payments", "page");
    revalidatePath("/[locale]/admin", "page");
    return { success: true };
  } catch (err: any) {
    console.error("deletePaymentAction error:", err);
    return { success: false, error: err.message || "Failed to delete payment" };
  }
}

// --- EXPENSES ---
export async function createExpenseAction(data: {
  description: string;
  amount: number;
  expense_date: string;
  category_name?: string;
  supplier_name?: string;
  payment_method?: string;
  notes?: string;
}) {
  try {
    const supabase = createAdminClient();

    let supplierId: string | null = null;
    if (data.supplier_name) {
      const { data: sup } = await supabase
        .from("suppliers")
        .select("id")
        .ilike("name", data.supplier_name.trim())
        .limit(1)
        .maybeSingle();
      if (sup) supplierId = sup.id;
    }

    const ref = `DEP-${new Date().getFullYear().toString().slice(-2)}${Math.floor(1000 + Math.random() * 9000)}`;
    const { data: inserted, error } = await supabase
      .from("expenses")
      .insert({
        reference: ref,
        expense_date: data.expense_date,
        supplier_id: supplierId,
        description: data.description,
        amount: data.amount,
        currency: "TND",
        tax_amount: 0,
        payment_method: data.payment_method?.toLowerCase().includes("virement")
          ? "bank_transfer"
          : "cash",
        payment_status: "paid",
        notes: data.notes || (data.category_name ? `Catégorie: ${data.category_name}` : null),
      })
      .select("*, suppliers(name)")
      .single();

    if (error) throw error;
    revalidatePath("/[locale]/admin/expenses", "page");
    revalidatePath("/[locale]/admin", "page");
    return { success: true, data: inserted };
  } catch (err: any) {
    console.error("createExpenseAction error:", err);
    return { success: false, error: err.message || "Failed to record expense" };
  }
}

export async function deleteExpenseAction(id: string) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) throw error;
    revalidatePath("/[locale]/admin/expenses", "page");
    revalidatePath("/[locale]/admin", "page");
    return { success: true };
  } catch (err: any) {
    console.error("deleteExpenseAction error:", err);
    return { success: false, error: err.message || "Failed to delete expense" };
  }
}

// --- PRODUCTS / INVENTORY ---
export async function createProductAction(data: {
  name: string;
  sku: string;
  category?: string;
  purchase_cost: number;
  sale_price: number;
  quantity: number;
  low_stock_threshold?: number;
  unit?: string;
}) {
  try {
    const supabase = createAdminClient();
    const { data: inserted, error } = await supabase
      .from("products")
      .insert({
        name: data.name,
        name_fr: data.name,
        sku: data.sku,
        category: data.category || "Tableaux & Protections",
        purchase_cost: data.purchase_cost,
        sale_price: data.sale_price,
        quantity: data.quantity,
        low_stock_threshold: data.low_stock_threshold ?? 5,
        unit: data.unit || "pièce",
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    revalidatePath("/[locale]/admin/inventory", "page");
    return { success: true, data: inserted };
  } catch (err: any) {
    console.error("createProductAction error:", err);
    return { success: false, error: err.message || "Failed to create product" };
  }
}

export async function deleteProductAction(id: string) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;
    revalidatePath("/[locale]/admin/inventory", "page");
    return { success: true };
  } catch (err: any) {
    console.error("deleteProductAction error:", err);
    return { success: false, error: err.message || "Failed to delete product" };
  }
}

// --- SUPPLIERS ---
export async function createSupplierAction(data: {
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}) {
  try {
    const supabase = createAdminClient();
    const { data: inserted, error } = await supabase
      .from("suppliers")
      .insert({
        name: data.name,
        contact_person: data.contact_person || null,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        notes: data.notes || null,
        outstanding_amount: 0,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    revalidatePath("/[locale]/admin/suppliers", "page");
    return { success: true, data: inserted };
  } catch (err: any) {
    console.error("createSupplierAction error:", err);
    return { success: false, error: err.message || "Failed to create supplier" };
  }
}

export async function deleteSupplierAction(id: string) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("suppliers").delete().eq("id", id);
    if (error) throw error;
    revalidatePath("/[locale]/admin/suppliers", "page");
    return { success: true };
  } catch (err: any) {
    console.error("deleteSupplierAction error:", err);
    return { success: false, error: err.message || "Failed to delete supplier" };
  }
}

// --- SERVICES ---
export async function createServiceAction(data: {
  title: string;
  short_description: string;
  category?: string;
  service_type?: string;
  price_from?: number;
  show_price?: boolean;
  estimated_duration?: string;
  status?: string;
}) {
  try {
    const supabase = createAdminClient();
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const { data: inserted, error } = await supabase
      .from("services")
      .insert({
        slug: `${slug}-${Math.floor(100 + Math.random() * 900)}`,
        category: data.category || "Électricité Générale",
        price_from: data.price_from || null,
        show_price: data.show_price ?? false,
        estimated_duration: data.estimated_duration || null,
        status: data.status || "published",
        is_active: true,
        sort_order: 10,
      })
      .select()
      .single();

    if (error) throw error;

    // Insert translation
    await supabase.from("service_translations").insert([
      {
        service_id: inserted.id,
        locale: "fr",
        title: data.title,
        short_description: data.short_description,
        full_description: data.short_description,
      },
      {
        service_id: inserted.id,
        locale: "ar",
        title: data.title,
        short_description: data.short_description,
        full_description: data.short_description,
      },
      {
        service_id: inserted.id,
        locale: "en",
        title: data.title,
        short_description: data.short_description,
        full_description: data.short_description,
      },
    ]);

    revalidatePath("/[locale]/admin/services", "page");
    revalidatePath("/[locale]/services", "page");
    return { success: true, data: inserted };
  } catch (err: any) {
    console.error("createServiceAction error:", err);
    return { success: false, error: err.message || "Failed to create service" };
  }
}

export async function deleteServiceAction(id: string) {
  try {
    const supabase = createAdminClient();
    await supabase.from("service_translations").delete().eq("service_id", id);
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) throw error;
    revalidatePath("/[locale]/admin/services", "page");
    revalidatePath("/[locale]/services", "page");
    return { success: true };
  } catch (err: any) {
    console.error("deleteServiceAction error:", err);
    return { success: false, error: err.message || "Failed to delete service" };
  }
}

// --- PROJECTS ---
export async function createProjectAction(data: {
  title: string;
  category: string;
  location: string;
  description: string;
  cover_image?: string;
  completion_date?: string;
  is_featured?: boolean;
}) {
  try {
    const supabase = createAdminClient();
    const { data: inserted, error } = await supabase
      .from("projects")
      .insert({
        location: data.location || "Tataouine, Tunisie",
        completion_date: data.completion_date || new Date().toISOString().slice(0, 10),
        cover_image: data.cover_image || "/images/projects/technovolt-chantier-01.jpg",
        is_featured: data.is_featured ?? true,
        status: "published",
        sort_order: 10,
      })
      .select()
      .single();

    if (error) throw error;

    await supabase.from("project_translations").insert([
      {
        project_id: inserted.id,
        locale: "fr",
        title: data.title,
        description: data.description,
      },
      {
        project_id: inserted.id,
        locale: "ar",
        title: data.title,
        description: data.description,
      },
      {
        project_id: inserted.id,
        locale: "en",
        title: data.title,
        description: data.description,
      },
    ]);

    revalidatePath("/[locale]/admin/projects", "page");
    revalidatePath("/[locale]/projects", "page");
    return { success: true, data: inserted };
  } catch (err: any) {
    console.error("createProjectAction error:", err);
    return { success: false, error: err.message || "Failed to create project" };
  }
}

export async function deleteProjectAction(id: string) {
  try {
    const supabase = createAdminClient();
    await supabase.from("project_translations").delete().eq("project_id", id);
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) throw error;
    revalidatePath("/[locale]/admin/projects", "page");
    revalidatePath("/[locale]/projects", "page");
    return { success: true };
  } catch (err: any) {
    console.error("deleteProjectAction error:", err);
    return { success: false, error: err.message || "Failed to delete project" };
  }
}

// --- INVOICES & QUOTATIONS ---
export async function deleteInvoiceAction(id: string) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("invoices").delete().eq("id", id);
    if (error) throw error;
    revalidatePath("/[locale]/admin/invoices", "page");
    revalidatePath("/[locale]/admin", "page");
    return { success: true };
  } catch (err: any) {
    console.error("deleteInvoiceAction error:", err);
    return { success: false, error: err.message || "Failed to delete invoice" };
  }
}

export async function deleteQuotationAction(id: string) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("quotations").delete().eq("id", id);
    if (error) throw error;
    revalidatePath("/[locale]/admin/quotations", "page");
    return { success: true };
  } catch (err: any) {
    console.error("deleteQuotationAction error:", err);
    return { success: false, error: err.message || "Failed to delete quotation" };
  }
}

// --- LEADS ---
export async function deleteLeadAction(id: string) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) throw error;
    revalidatePath("/[locale]/admin/leads", "page");
    revalidatePath("/[locale]/admin", "page");
    return { success: true };
  } catch (err: any) {
    console.error("deleteLeadAction error:", err);
    return { success: false, error: err.message || "Failed to delete lead" };
  }
}

// --- COMPANY SETTINGS ---
export async function updateCompanySettingsAction(settings: Record<string, any>) {
  try {
    const supabase = createAdminClient();
    const { data: existing } = await supabase.from("company_settings").select("id, settings").limit(1).maybeSingle();
    if (existing) {
      const merged = { ...existing.settings, ...settings };
      const { error } = await supabase
        .from("company_settings")
        .update({ settings: merged, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("company_settings")
        .insert({ settings, updated_at: new Date().toISOString() });
      if (error) throw error;
    }
    revalidatePath("/", "layout");
    return { success: true };
  } catch (err: any) {
    console.error("updateCompanySettingsAction error:", err);
    return { success: false, error: err.message || "Failed to update company settings" };
  }
}
