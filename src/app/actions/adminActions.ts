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
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    let customerUuid: string | null = null;
    if (isUuid) {
      customerUuid = id;
    } else {
      const { data: matched } = await supabase
        .from("customers")
        .select("id")
        .or(`reference.eq.${id},reference_number.eq.${id}`)
        .maybeSingle();
      if (matched?.id) {
        customerUuid = matched.id;
      }
    }

    if (customerUuid) {
      // Check for dependent invoices or quotations
      const { data: linkedInvoices } = await supabase
        .from("invoices")
        .select("id, invoice_number")
        .eq("customer_id", customerUuid)
        .limit(1);

      if (linkedInvoices && linkedInvoices.length > 0) {
        return {
          success: false,
          error: `Impossible de supprimer ce client car la facture ${linkedInvoices[0].invoice_number} lui est rattachée.`,
        };
      }

      const { data: linkedQuotes } = await supabase
        .from("quotations")
        .select("id, quotation_number")
        .eq("customer_id", customerUuid)
        .limit(1);

      if (linkedQuotes && linkedQuotes.length > 0) {
        return {
          success: false,
          error: `Impossible de supprimer ce client car le devis ${linkedQuotes[0].quotation_number} lui est rattaché.`,
        };
      }

      // Clean appointments, work orders, and payments
      await supabase.from("appointments").delete().eq("customer_id", customerUuid);
      await supabase.from("work_orders").delete().eq("customer_id", customerUuid);
      await supabase.from("payments").delete().eq("customer_id", customerUuid);

      const { error } = await supabase.from("customers").delete().eq("id", customerUuid);
      if (error) throw error;
    }

    revalidatePath("/[locale]/admin/customers", "page");
    revalidatePath("/[locale]/admin", "page");
    revalidatePath("/", "layout");
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
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    let aptUuid: string | null = null;
    if (isUuid) {
      aptUuid = id;
    } else {
      const { data: matched } = await supabase
        .from("appointments")
        .select("id")
        .eq("reference_number", id)
        .maybeSingle();
      if (matched?.id) {
        aptUuid = matched.id;
      }
    }

    if (aptUuid) {
      const { error } = await supabase.from("appointments").delete().eq("id", aptUuid);
      if (error) throw error;
    }

    revalidatePath("/[locale]/admin/appointments", "page");
    revalidatePath("/[locale]/admin", "page");
    revalidatePath("/", "layout");
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
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    let woUuid: string | null = null;
    if (isUuid) {
      woUuid = id;
    } else {
      const { data: matched } = await supabase
        .from("work_orders")
        .select("id")
        .eq("job_number", id)
        .maybeSingle();
      if (matched?.id) {
        woUuid = matched.id;
      }
    }

    if (woUuid) {
      await supabase.from("invoices").update({ work_order_id: null }).eq("work_order_id", woUuid);
      const { error } = await supabase.from("work_orders").delete().eq("id", woUuid);
      if (error) throw error;
    }

    revalidatePath("/[locale]/admin/work-orders", "page");
    revalidatePath("/[locale]/admin", "page");
    revalidatePath("/", "layout");
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
          : data.payment_method.toLowerCase().includes("carte") || data.payment_method.toLowerCase().includes("card")
          ? "card"
          : data.payment_method.toLowerCase().includes("chèque") || data.payment_method.toLowerCase().includes("traite")
          ? "other"
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

        // Record payment allocation
        await supabase.from("payment_allocations").insert({
          payment_id: inserted.id,
          invoice_id: inv.id,
          amount: data.amount,
        });
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
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    let payUuid: string | null = null;
    let paymentData: any = null;

    if (isUuid) {
      payUuid = id;
      const { data } = await supabase.from("payments").select("*").eq("id", id).maybeSingle();
      paymentData = data;
    } else {
      const { data: matched } = await supabase
        .from("payments")
        .select("*")
        .eq("payment_reference", id)
        .maybeSingle();
      if (matched) {
        payUuid = matched.id;
        paymentData = matched;
      }
    }

    if (payUuid && paymentData) {
      // 1. Restore invoice balance if linked
      let invoiceNumber: string | null = null;
      if (paymentData.notes && paymentData.notes.startsWith("Facture ")) {
        invoiceNumber = paymentData.notes.replace("Facture ", "").trim();
      }

      // Check payment allocations
      const { data: allocations } = await supabase
        .from("payment_allocations")
        .select("invoice_id, amount")
        .eq("payment_id", payUuid);

      if (allocations && allocations.length > 0) {
        for (const alloc of allocations) {
          const { data: inv } = await supabase
            .from("invoices")
            .select("id, amount_paid, total")
            .eq("id", alloc.invoice_id)
            .maybeSingle();

          if (inv) {
            const newPaid = Math.max(0, (Number(inv.amount_paid) || 0) - Number(alloc.amount));
            const total = Number(inv.total) || 0;
            const newBalance = Math.max(0, total - newPaid);
            const newStatus = newBalance === 0 ? "paid" : newPaid > 0 ? "partially_paid" : "issued";

            await supabase
              .from("invoices")
              .update({ amount_paid: newPaid, balance_due: newBalance, status: newStatus })
              .eq("id", inv.id);
          }
        }
      } else if (invoiceNumber) {
        const { data: inv } = await supabase
          .from("invoices")
          .select("id, amount_paid, total")
          .eq("invoice_number", invoiceNumber)
          .maybeSingle();

        if (inv) {
          const newPaid = Math.max(0, (Number(inv.amount_paid) || 0) - Number(paymentData.amount));
          const total = Number(inv.total) || 0;
          const newBalance = Math.max(0, total - newPaid);
          const newStatus = newBalance === 0 ? "paid" : newPaid > 0 ? "partially_paid" : "issued";

          await supabase
            .from("invoices")
            .update({ amount_paid: newPaid, balance_due: newBalance, status: newStatus })
            .eq("id", inv.id);
        }
      }

      // 2. Delete payment (cascades allocations)
      await supabase.from("payment_allocations").delete().eq("payment_id", payUuid);
      const { error } = await supabase.from("payments").delete().eq("id", payUuid);
      if (error) throw error;
    }

    revalidatePath("/[locale]/admin/payments", "page");
    revalidatePath("/[locale]/admin/invoices", "page");
    revalidatePath("/[locale]/admin", "page");
    revalidatePath("/", "layout");
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
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    let expUuid: string | null = null;
    if (isUuid) {
      expUuid = id;
    } else {
      const { data: matched } = await supabase
        .from("expenses")
        .select("id")
        .eq("reference", id)
        .maybeSingle();
      if (matched?.id) {
        expUuid = matched.id;
      }
    }

    if (expUuid) {
      const { error } = await supabase.from("expenses").delete().eq("id", expUuid);
      if (error) throw error;
    }

    revalidatePath("/[locale]/admin/expenses", "page");
    revalidatePath("/[locale]/admin", "page");
    revalidatePath("/", "layout");
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
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    let prodUuid: string | null = null;
    if (isUuid) {
      prodUuid = id;
    } else {
      const { data: matched } = await supabase
        .from("products")
        .select("id")
        .eq("sku", id)
        .maybeSingle();
      if (matched?.id) {
        prodUuid = matched.id;
      }
    }

    if (prodUuid) {
      await supabase.from("invoice_items").update({ product_id: null }).eq("product_id", prodUuid);
      const { error } = await supabase.from("products").delete().eq("id", prodUuid);
      if (error) throw error;
    }

    revalidatePath("/[locale]/admin/inventory", "page");
    revalidatePath("/", "layout");
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
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    let supUuid: string | null = null;
    if (isUuid) {
      supUuid = id;
    } else {
      const { data: matched } = await supabase
        .from("suppliers")
        .select("id")
        .ilike("name", id)
        .maybeSingle();
      if (matched?.id) {
        supUuid = matched.id;
      }
    }

    if (supUuid) {
      await supabase.from("expenses").update({ supplier_id: null }).eq("supplier_id", supUuid);
      const { error } = await supabase.from("suppliers").delete().eq("id", supUuid);
      if (error) throw error;
    }

    revalidatePath("/[locale]/admin/suppliers", "page");
    revalidatePath("/[locale]/admin", "page");
    revalidatePath("/", "layout");
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
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let srvUuid: string | null = null;
    if (isUuid) {
      srvUuid = id;
    } else {
      const { data: matched } = await supabase.from("services").select("id").eq("slug", id).maybeSingle();
      if (matched?.id) srvUuid = matched.id;
    }

    if (srvUuid) {
      await supabase.from("service_translations").delete().eq("service_id", srvUuid);
      const { error } = await supabase.from("services").delete().eq("id", srvUuid);
      if (error) throw error;
    }

    revalidatePath("/[locale]/admin/services", "page");
    revalidatePath("/[locale]/services", "page");
    revalidatePath("/", "layout");
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
export async function createInvoiceAction(data: {
  invoice_number?: string;
  customer_name: string;
  customer_phone?: string;
  customer_address?: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_rate?: number;
  tax_amount: number;
  total: number;
  amount_paid?: number;
  balance_due?: number;
  status?: string;
  payment_terms?: string;
  items?: Array<{
    description: string;
    quantity: number;
    unit?: string;
    unit_price: number;
  }>;
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
        const custRef = `CL-${new Date().getFullYear().toString().slice(-2)}${Math.floor(10 + Math.random() * 90)}-${Math.floor(10 + Math.random() * 90)}`;
        const { data: newCust } = await supabase
          .from("customers")
          .insert({
            reference: custRef,
            full_name: data.customer_name.trim(),
            phone: data.customer_phone || "+216 75 000 000",
            notes: data.customer_address || "Tataouine",
          })
          .select("id")
          .single();
        customerId = newCust?.id || null;
      }
    }

    if (!customerId) {
      const { data: anyCust } = await supabase.from("customers").select("id").limit(1).single();
      customerId = anyCust?.id;
    }

    const ref = data.invoice_number || `FAC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const { data: inserted, error } = await supabase
      .from("invoices")
      .insert({
        invoice_number: ref,
        customer_id: customerId,
        issue_date: data.issue_date || new Date().toISOString().slice(0, 10),
        due_date: data.due_date || new Date().toISOString().slice(0, 10),
        subtotal: data.subtotal || 0,
        tax_rate: data.tax_rate ?? 19,
        tax_amount: data.tax_amount || 0,
        discount_amount: 0,
        total: data.total || 0,
        amount_paid: data.amount_paid || 0,
        balance_due: data.balance_due ?? data.total ?? 0,
        currency: "TND",
        payment_terms: data.payment_terms || null,
        status: data.status || "issued",
      })
      .select("*, customers(full_name, phone, notes)")
      .single();

    if (error) throw error;

    if (data.items && data.items.length > 0 && inserted?.id) {
      const lineItems = data.items.map((it) => ({
        invoice_id: inserted.id,
        description: it.description,
        quantity: it.quantity,
        unit: it.unit || "pièce",
        unit_price: it.unit_price,
        tax_rate: data.tax_rate ?? 19,
      }));
      await supabase.from("invoice_items").insert(lineItems);
    }

    revalidatePath("/[locale]/admin/invoices", "page");
    revalidatePath("/[locale]/admin", "page");
    revalidatePath("/[locale]/admin/payments", "page");
    revalidatePath("/", "layout");
    return { success: true, data: inserted };
  } catch (err: any) {
    console.error("createInvoiceAction error:", err);
    return { success: false, error: err.message || "Failed to create invoice" };
  }
}

export async function deleteInvoiceAction(id: string) {
  try {
    const supabase = createAdminClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    let invoiceUuid: string | null = null;
    if (isUuid) {
      invoiceUuid = id;
    } else {
      const { data: matched } = await supabase
        .from("invoices")
        .select("id")
        .eq("invoice_number", id)
        .maybeSingle();
      if (matched?.id) {
        invoiceUuid = matched.id;
      }
    }

    if (invoiceUuid) {
      // Clean dependent allocations and items first so ON DELETE RESTRICT constraint is never violated
      await supabase.from("payment_allocations").delete().eq("invoice_id", invoiceUuid);
      await supabase.from("invoice_items").delete().eq("invoice_id", invoiceUuid);
      const { error } = await supabase.from("invoices").delete().eq("id", invoiceUuid);
      if (error) throw error;
    }

    revalidatePath("/[locale]/admin/invoices", "page");
    revalidatePath("/[locale]/admin", "page");
    revalidatePath("/[locale]/admin/payments", "page");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (err: any) {
    console.error("deleteInvoiceAction error:", err);
    return { success: false, error: err.message || "Failed to delete invoice" };
  }
}

export async function createQuotationAction(data: {
  quotation_number?: string;
  customer_name: string;
  customer_phone?: string;
  customer_address?: string;
  issue_date: string;
  valid_until: string;
  subtotal: number;
  discount_amount?: number;
  tax_rate?: number;
  tax_amount: number;
  total: number;
  status?: string;
  terms?: string;
  items?: Array<{
    description: string;
    quantity: number;
    unit?: string;
    unit_price: number;
  }>;
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
        const custRef = `CL-${new Date().getFullYear().toString().slice(-2)}${Math.floor(10 + Math.random() * 90)}-${Math.floor(10 + Math.random() * 90)}`;
        const { data: newCust } = await supabase
          .from("customers")
          .insert({
            reference: custRef,
            full_name: data.customer_name.trim(),
            phone: data.customer_phone || "+216 75 000 000",
            notes: data.customer_address || "Tataouine",
          })
          .select("id")
          .single();
        customerId = newCust?.id || null;
      }
    }

    if (!customerId) {
      const { data: anyCust } = await supabase.from("customers").select("id").limit(1).single();
      customerId = anyCust?.id;
    }

    const ref = data.quotation_number || `DEV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const { data: inserted, error } = await supabase
      .from("quotations")
      .insert({
        quotation_number: ref,
        customer_id: customerId,
        issue_date: data.issue_date || new Date().toISOString().slice(0, 10),
        valid_until: data.valid_until || new Date().toISOString().slice(0, 10),
        subtotal: data.subtotal || 0,
        discount_amount: data.discount_amount || 0,
        tax_rate: data.tax_rate ?? 19,
        tax_amount: data.tax_amount || 0,
        total: data.total || 0,
        currency: "TND",
        terms: data.terms || null,
        status: data.status || "sent",
      })
      .select("*, customers(full_name, phone, notes)")
      .single();

    if (error) throw error;

    if (data.items && data.items.length > 0 && inserted?.id) {
      const lineItems = data.items.map((it) => ({
        quotation_id: inserted.id,
        description: it.description,
        quantity: it.quantity,
        unit: it.unit || "pièce",
        unit_price: it.unit_price,
        tax_rate: data.tax_rate ?? 19,
      }));
      await supabase.from("quotation_items").insert(lineItems);
    }

    revalidatePath("/[locale]/admin/quotations", "page");
    revalidatePath("/[locale]/admin", "page");
    revalidatePath("/", "layout");
    return { success: true, data: inserted };
  } catch (err: any) {
    console.error("createQuotationAction error:", err);
    return { success: false, error: err.message || "Failed to create quotation" };
  }
}

export async function deleteQuotationAction(id: string) {
  try {
    const supabase = createAdminClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    let quotationUuid: string | null = null;
    if (isUuid) {
      quotationUuid = id;
    } else {
      const { data: matched } = await supabase
        .from("quotations")
        .select("id")
        .eq("quotation_number", id)
        .maybeSingle();
      if (matched?.id) {
        quotationUuid = matched.id;
      }
    }

    if (quotationUuid) {
      await supabase.from("quotation_items").delete().eq("quotation_id", quotationUuid);
      const { error } = await supabase.from("quotations").delete().eq("id", quotationUuid);
      if (error) throw error;
    }

    revalidatePath("/[locale]/admin/quotations", "page");
    revalidatePath("/[locale]/admin", "page");
    revalidatePath("/", "layout");
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

// --- MEDIA UPLOAD ---
export async function uploadMediaAction(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "Chantiers";
    const altFr = (formData.get("altFr") as string) || "";

    if (!file) {
      return { success: false, error: "Aucun fichier fourni." };
    }

    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];
    if (!validTypes.includes(file.type)) {
      return { success: false, error: "Type de fichier non supporté. Utilisez PNG, JPG, WebP ou SVG." };
    }

    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: "Le fichier dépasse la taille maximale autorisée de 5 Mo." };
    }

    const supabase = createAdminClient();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeName = `${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}.${ext}`;
    const filePath = `${folder.toLowerCase()}/${safeName}`;

    let publicUrl = `/images/projects/${safeName}`;

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const bucketName = "media";
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from(bucketName)
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: true,
        });

      if (!uploadErr && uploadData) {
        const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);
        if (urlData?.publicUrl) {
          publicUrl = urlData.publicUrl;
        }
      }
    } catch (storageErr) {
      console.warn("Supabase storage upload fallback:", storageErr);
    }

    return {
      success: true,
      data: {
        id: `med-${Date.now()}`,
        name: file.name,
        url: publicUrl,
        size: Math.round(file.size / 1024) + " KB",
        folder,
        altTextFr: altFr || file.name,
        altTextAr: "",
        uploadedAt: new Date().toISOString().slice(0, 10),
      },
    };
  } catch (err: any) {
    console.error("uploadMediaAction error:", err);
    return { success: false, error: err.message || "Erreur lors du téléversement du média" };
  }
}
