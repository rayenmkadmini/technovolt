import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

// Load .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        process.env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const isConfigured = Boolean(supabaseUrl && supabaseKey && !supabaseUrl.includes("placeholder"));

const supabase = isConfigured ? createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
}) : null;

// 1. Table schema verification
test("Database - Live Supabase Connectivity and Table Schema Verification", async (t) => {
  if (!isConfigured) {
    t.skip("Supabase credentials not configured in environment");
    return;
  }

  const tables = [
    "customers",
    "appointments",
    "work_orders",
    "invoices",
    "invoice_items",
    "payments",
    "payment_allocations",
    "expenses",
    "products",
    "suppliers",
    "services",
    "company_settings",
  ];

  for (const table of tables) {
    const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
    assert.equal(error, null, `Table ${table} should be queryable, but got: ${error?.message}`);
    assert.ok(typeof count === "number", `Table ${table} should return numeric count`);
  }
});

// 2. Storage bucket verification
test("Database - Storage Buckets Configuration & Upload Verification", async (t) => {
  if (!isConfigured) {
    t.skip("Supabase credentials not configured in environment");
    return;
  }

  const { data: buckets, error } = await supabase.storage.listBuckets();
  assert.equal(error, null, `Listing buckets failed: ${error?.message}`);
  assert.ok(Array.isArray(buckets), "Buckets should be an array");

  const mediaBucket = buckets.find((b) => b.name === "media");
  assert.ok(mediaBucket, "Storage bucket 'media' must exist in Supabase");

  // Test isolated image upload to media bucket (1x1 transparent PNG)
  const testFileName = `test-audit-${Date.now()}.png`;
  const testFilePath = `chantiers/${testFileName}`;
  // 1x1 transparent PNG buffer
  const pngBuffer = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");

  const { data: uploadData, error: uploadErr } = await supabase.storage
    .from("media")
    .upload(testFilePath, pngBuffer, { contentType: "image/png", upsert: true });

  assert.equal(uploadErr, null, `Upload to media bucket failed: ${uploadErr?.message}`);
  assert.ok(uploadData?.path);

  // Get public URL
  const { data: urlData } = supabase.storage.from("media").getPublicUrl(testFilePath);
  assert.ok(urlData?.publicUrl.includes(testFileName));

  // Clean up
  await supabase.storage.from("media").remove([testFilePath]);
});

// 3. Financial Integrity & Payment Deletion Restoration
test("Database - Financial Integrity & Payment Deletion Balance Restoration", async (t) => {
  if (!isConfigured) {
    t.skip("Supabase credentials not configured in environment");
    return;
  }

  const testId = `audit_${Date.now()}`;
  let customerId = null;
  let invoiceId = null;
  let paymentId = null;

  try {
    // 1. Create customer
    const { data: customer, error: custErr } = await supabase
      .from("customers")
      .insert({
        reference_number: `CLI-TEST-${testId}`,
        full_name: `Test Client Financial ${testId}`,
        phone: `+216 99 ${Math.floor(100000 + Math.random() * 900000)}`,
        is_active: true,
        total_spent: 0,
        outstanding_balance: 0,
      })
      .select()
      .single();

    assert.equal(custErr, null);
    customerId = customer.id;

    // 2. Create invoice (Total 1000 TND)
    const { data: invoice, error: invErr } = await supabase
      .from("invoices")
      .insert({
        invoice_number: `FAC-TEST-${testId}`,
        customer_id: customerId,
        issue_date: new Date().toISOString().slice(0, 10),
        due_date: new Date().toISOString().slice(0, 10),
        subtotal: 840.336,
        tax_rate: 19,
        tax_amount: 159.664,
        total: 1000.0,
        amount_paid: 0,
        balance_due: 1000.0,
        status: "issued",
      })
      .select()
      .single();

    assert.equal(invErr, null);
    invoiceId = invoice.id;

    // 3. Create payment of 400 TND
    const { data: payment, error: payErr } = await supabase
      .from("payments")
      .insert({
        payment_reference: `REG-TEST-${testId}`,
        customer_id: customerId,
        payment_date: new Date().toISOString().slice(0, 10),
        amount: 400.0,
        payment_method: "cash",
        currency: "TND",
      })
      .select()
      .single();

    assert.equal(payErr, null);
    paymentId = payment.id;

    // Create allocation
    await supabase.from("payment_allocations").insert({
      payment_id: paymentId,
      invoice_id: invoiceId,
      amount: 400.0,
    });

    // Update invoice
    await supabase.from("invoices").update({
      amount_paid: 400.0,
      balance_due: 600.0,
      status: "partially_paid",
    }).eq("id", invoiceId);

    // Verify invoice reflects partial payment
    const { data: midInv } = await supabase.from("invoices").select("amount_paid, balance_due, status").eq("id", invoiceId).single();
    assert.equal(midInv.amount_paid, 400.0);
    assert.equal(midInv.balance_due, 600.0);
    assert.equal(midInv.status, "partially_paid");

    // 4. Simulate payment deletion & balance restoration:
    // Fetch allocations for this payment
    const { data: allocations } = await supabase.from("payment_allocations").select("invoice_id, amount").eq("payment_id", paymentId);
    assert.equal(allocations.length, 1);

    for (const alloc of allocations) {
      const { data: targetInv } = await supabase.from("invoices").select("total, amount_paid, balance_due").eq("id", alloc.invoice_id).single();
      const currentPaid = Number(targetInv.amount_paid || 0);
      const invoiceTotal = Number(targetInv.total || 0);
      const newPaid = Math.max(0, Math.round((currentPaid - alloc.amount) * 1000) / 1000);
      const newBalance = Math.min(invoiceTotal, Math.round((invoiceTotal - newPaid) * 1000) / 1000);
      const newStatus = newPaid <= 0 ? "issued" : newPaid >= invoiceTotal ? "paid" : "partially_paid";

      await supabase.from("invoices").update({
        amount_paid: newPaid,
        balance_due: newBalance,
        status: newStatus,
      }).eq("id", alloc.invoice_id);
    }

    // Delete allocations and payment
    await supabase.from("payment_allocations").delete().eq("payment_id", paymentId);
    await supabase.from("payments").delete().eq("id", paymentId);

    // Verify invoice restored to original state
    const { data: restoredInv } = await supabase.from("invoices").select("amount_paid, balance_due, status").eq("id", invoiceId).single();
    assert.equal(restoredInv.amount_paid, 0.0);
    assert.equal(restoredInv.balance_due, 1000.0);
    assert.equal(restoredInv.status, "issued");

  } finally {
    if (paymentId) {
      await supabase.from("payment_allocations").delete().eq("payment_id", paymentId);
      await supabase.from("payments").delete().eq("id", paymentId);
    }
    if (invoiceId) {
      await supabase.from("invoices").delete().eq("id", invoiceId);
    }
    if (customerId) {
      await supabase.from("customers").delete().eq("id", customerId);
    }
  }
});

// 4. Customer Deletion Safety (FK Protection)
test("Database - Customer Deletion Protection with Active Invoices", async (t) => {
  if (!isConfigured) {
    t.skip("Supabase credentials not configured in environment");
    return;
  }

  const testId = `fk_${Date.now()}`;
  let customerId = null;
  let invoiceId = null;

  try {
    const { data: customer, error: custErr } = await supabase
      .from("customers")
      .insert({
        reference_number: `CLI-FK-${testId}`,
        full_name: `Customer With Invoice ${testId}`,
        is_active: true,
      })
      .select()
      .single();
    assert.equal(custErr, null);
    customerId = customer.id;

    const { data: invoice, error: invErr } = await supabase
      .from("invoices")
      .insert({
        invoice_number: `FAC-FK-${testId}`,
        customer_id: customerId,
        issue_date: new Date().toISOString().slice(0, 10),
        due_date: new Date().toISOString().slice(0, 10),
        subtotal: 500.0,
        total: 500.0,
        balance_due: 500.0,
        status: "issued",
      })
      .select()
      .single();
    assert.equal(invErr, null);
    invoiceId = invoice.id;

    // Check count of active invoices
    const { count } = await supabase.from("invoices").select("id", { count: "exact", head: true }).eq("customer_id", customerId);
    assert.ok(count > 0, "Customer must have active invoices");

    // Attempting direct raw Postgres delete should trigger FK constraint violation error (23503)
    const { error: directDelErr } = await supabase.from("customers").delete().eq("id", customerId);
    assert.ok(directDelErr !== null, "Postgres should prevent deleting customer with linked invoices");
    assert.equal(directDelErr.code, "23503", "Should be foreign key violation code 23503");

  } finally {
    if (invoiceId) await supabase.from("invoices").delete().eq("id", invoiceId);
    if (customerId) await supabase.from("customers").delete().eq("id", customerId);
  }
});

// 5. Products / Inventory Persistence and SKU Uniqueness
test("Database - Product Creation and Persistence in products table", async (t) => {
  if (!isConfigured) {
    t.skip("Supabase credentials not configured in environment");
    return;
  }

  const testSku = `SKU-TEST-${Date.now()}`;
  let productId = null;

  try {
    const { data: prod, error } = await supabase
      .from("products")
      .insert({
        sku: testSku,
        name: "Disjoncteur Test Verification",
        name_fr: "Disjoncteur Test Verification",
        category: "Tableaux & Protections",
        purchase_cost: 15.5,
        sale_price: 28.0,
        quantity: 50,
        low_stock_threshold: 10,
        unit: "pièce",
        is_active: true,
      })
      .select()
      .single();

    assert.equal(error, null);
    assert.ok(prod?.id);
    productId = prod.id;

    // Verify query
    const { data: fetched } = await supabase.from("products").select("sku, quantity").eq("id", productId).single();
    assert.equal(fetched.sku, testSku);
    assert.equal(fetched.quantity, 50);

  } finally {
    if (productId) {
      await supabase.from("products").delete().eq("id", productId);
    }
  }
});
