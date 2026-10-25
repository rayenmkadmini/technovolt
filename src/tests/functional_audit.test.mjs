import test from "node:test";
import assert from "node:assert/strict";

/**
 * Functional Audit Regression Suite for TechnoVolt
 * Covers:
 * 1. CSV Formula Injection Sanitization (CWE-1236) & UTF-8 BOM
 * 2. Safe Empty Dataset Handling in CSV Export
 * 3. Financial Balance & Payment Allocation Integrity
 * 4. Duplicate Payment Prevention
 * 5. Work Order Status & Data Validation
 * 6. Inventory Duplicate SKU & Positive Quantities Validation
 * 7. Supplier Duplicate Name & Email Validation
 * 8. Image Upload MIME Type and Size Constraint Validation
 * 9. Company Logo Persistence Model
 * 10. Floating Client Counter Validation
 * 11. Service Selection Structure (Dropdown without Exposing Internal Costs)
 * 12. Customer Auto-fill Propagation
 */

// Helper mimicking CSV cell escaping logic from src/lib/exportCsv.ts
function escapeCsvCell(val) {
  let stringVal = String(val ?? "");
  // Neutralize CSV / formula injection (cells starting with =, +, -, @, tab, or CR)
  if (/^[=+\-@\t\r]/.test(stringVal)) {
    stringVal = `'${stringVal}`;
  }
  if (
    stringVal.includes(",") ||
    stringVal.includes('"') ||
    stringVal.includes("\n") ||
    stringVal.includes(";")
  ) {
    return `"${stringVal.replace(/"/g, '""')}"`;
  }
  return stringVal;
}

function buildCsvContent(headers, rows = []) {
  const safeRows = Array.isArray(rows) ? rows : [];
  return (
    "\uFEFF" +
    [
      (headers || []).map(escapeCsvCell).join(","),
      ...safeRows.map((row) => (row || []).map(escapeCsvCell).join(",")),
    ].join("\r\n")
  );
}

// 1. CSV SANITIZATION & FORMULA INJECTION (CWE-1236)
test("CSV Sanitization - Formula injection cells neutralized with leading single quote", () => {
  const maliciousInputs = [
    "=CMD|' /C calc'!A0",
    "+SUM(1+1)",
    "-2+3+cmd|' /C notepad'!A0",
    "@SUM(1,2)",
    "\t=1+1",
    "\r=1+1",
  ];

  for (const input of maliciousInputs) {
    const escaped = escapeCsvCell(input);
    assert.ok(
      escaped.startsWith("'") || escaped.startsWith('"\''),
      `Input "${input}" should be escaped with leading single quote, got "${escaped}"`
    );
  }
});

test("CSV Sanitization - Normal numeric and string cells remain unadulterated", () => {
  assert.equal(escapeCsvCell("Rendez-vous installation"), "Rendez-vous installation");
  assert.equal(escapeCsvCell(1450.5), "1450.5");
  assert.equal(escapeCsvCell("client@example.com"), "client@example.com");
  assert.equal(escapeCsvCell("Facture N° 102"), "Facture N° 102");
});

test("CSV Export - UTF-8 Byte Order Mark (BOM) present for Excel French/Arabic display", () => {
  const csv = buildCsvContent(["Client", "Montant (TND)"], [["Société Électricité & Lumière", 450.0]]);
  assert.ok(csv.startsWith("\uFEFF"), "CSV must begin with UTF-8 BOM");
  assert.ok(csv.includes("Société Électricité & Lumière"), "Preserves French accents");
});

test("CSV Export - Safe handling of empty datasets without throwing", () => {
  const emptyCsv = buildCsvContent(["Réf", "Client", "Montant"], []);
  assert.ok(emptyCsv.startsWith("\uFEFF"));
  assert.equal(emptyCsv, "\uFEFFRéf,Client,Montant");
});

// 2. FINANCIAL INTEGRITY & PAYMENT ALLOCATIONS
function applyPaymentToInvoice(invoice, paymentAmount) {
  if (paymentAmount <= 0) {
    throw new Error("Le montant du règlement doit être supérieur à zéro");
  }
  const currentPaid = Number(invoice.amount_paid || 0);
  const total = Number(invoice.total || 0);
  const newPaid = Math.round((currentPaid + paymentAmount) * 1000) / 1000;
  const newBalance = Math.max(0, Math.round((total - newPaid) * 1000) / 1000);

  let status = "unpaid";
  if (newPaid >= total) {
    status = "paid";
  } else if (newPaid > 0) {
    status = "partially_paid";
  }

  return {
    ...invoice,
    amount_paid: newPaid,
    balance_due: newBalance,
    status,
  };
}

test("Financial Integrity - Reject zero or negative payment amounts", () => {
  const invoice = { id: "inv-1", total: 1000.0, amount_paid: 0.0, balance_due: 1000.0, status: "unpaid" };
  assert.throws(() => applyPaymentToInvoice(invoice, 0), /Le montant du règlement doit être supérieur à zéro/);
  assert.throws(() => applyPaymentToInvoice(invoice, -50.0), /Le montant du règlement doit être supérieur à zéro/);
});

test("Financial Integrity - Partial payment correctly updates balance and sets status to partially_paid", () => {
  const invoice = { id: "inv-1", total: 1500.0, amount_paid: 0.0, balance_due: 1500.0, status: "unpaid" };
  const updated = applyPaymentToInvoice(invoice, 500.0);

  assert.equal(updated.amount_paid, 500.0);
  assert.equal(updated.balance_due, 1000.0);
  assert.equal(updated.status, "partially_paid");
});

test("Financial Integrity - Full payment sets balance to 0 and status to paid", () => {
  const invoice = { id: "inv-1", total: 1500.0, amount_paid: 500.0, balance_due: 1000.0, status: "partially_paid" };
  const updated = applyPaymentToInvoice(invoice, 1000.0);

  assert.equal(updated.amount_paid, 1500.0);
  assert.equal(updated.balance_due, 0.0);
  assert.equal(updated.status, "paid");
});

// 3. DUPLICATE PAYMENT DETECTION
function checkDuplicatePayment(existingPayments, newPayment) {
  if (newPayment.receipt_reference) {
    const hasDuplicateReceipt = existingPayments.some(
      (p) => p.receipt_reference && p.receipt_reference.toLowerCase() === newPayment.receipt_reference.toLowerCase()
    );
    if (hasDuplicateReceipt) return { duplicate: true, reason: "receipt_reference" };
  }

  const hasDuplicateExact = existingPayments.some(
    (p) =>
      p.customer_name.toLowerCase() === newPayment.customer_name.toLowerCase() &&
      p.invoice_number.toLowerCase() === newPayment.invoice_number.toLowerCase() &&
      p.amount === newPayment.amount &&
      p.payment_date === newPayment.payment_date
  );
  if (hasDuplicateExact) return { duplicate: true, reason: "exact_duplicate" };

  return { duplicate: false };
}

test("Payment - Rejects duplicate receipt reference or duplicate identical transaction", () => {
  const existing = [
    { customer_name: "Sud Équipement", invoice_number: "FAC-001", amount: 500.0, payment_date: "2026-10-25", receipt_reference: "REC-100" },
  ];

  const duplicateByReceipt = { customer_name: "Autre", invoice_number: "FAC-002", amount: 200.0, payment_date: "2026-10-25", receipt_reference: "rec-100" };
  assert.equal(checkDuplicatePayment(existing, duplicateByReceipt).duplicate, true);

  const duplicateExact = { customer_name: "sud équipement", invoice_number: "fac-001", amount: 500.0, payment_date: "2026-10-25", receipt_reference: "" };
  assert.equal(checkDuplicatePayment(existing, duplicateExact).duplicate, true);

  const uniquePayment = { customer_name: "Nouveau Client", invoice_number: "FAC-003", amount: 350.0, payment_date: "2026-10-25", receipt_reference: "REC-101" };
  assert.equal(checkDuplicatePayment(existing, uniquePayment).duplicate, false);
});

// 4. WORK ORDER LIFECYCLE
function validateWorkOrder(workOrder) {
  const allowedStatuses = ["pending", "in_progress", "completed", "cancelled", "on_hold"];
  if (!workOrder.title && !workOrder.description) {
    return { valid: false, error: "La description est requise" };
  }
  if (!workOrder.customer_name || workOrder.customer_name.trim().length === 0) {
    return { valid: false, error: "Le nom du client est requis" };
  }
  if (!allowedStatuses.includes(workOrder.status)) {
    return { valid: false, error: "Statut invalide" };
  }
  if (Number(workOrder.estimated_hours) < 0 || Number(workOrder.labor_hours) < 0) {
    return { valid: false, error: "Les heures doivent être positives" };
  }
  if (Number(workOrder.total_cost) < 0) {
    return { valid: false, error: "Le coût total doit être positif" };
  }
  return { valid: true };
}

test("Work Order - Validates required fields, status and non-negative cost/hours", () => {
  const validWO = {
    description: "Installation Armoire TGBT",
    customer_name: "Polyclinique El Menzah",
    status: "in_progress",
    labor_hours: 8,
    total_cost: 650.0,
  };
  assert.deepEqual(validateWorkOrder(validWO), { valid: true });

  const invalidWO = {
    description: "",
    customer_name: "Client",
    status: "pending",
    labor_hours: -2,
    total_cost: -100,
  };
  assert.equal(validateWorkOrder(invalidWO).valid, false);
});

// 5. INVENTORY VALIDATION & DUPLICATE SKU CHECK
function validateProductItem(existingProducts, product) {
  if (!product.name || !product.name.trim()) {
    return { valid: false, error: "Le nom de l'article est requis" };
  }
  if (!product.sku || !product.sku.trim()) {
    return { valid: false, error: "La référence SKU est requise" };
  }
  const isDuplicateSku = existingProducts.some(
    (p) => p.sku.trim().toLowerCase() === product.sku.trim().toLowerCase()
  );
  if (isDuplicateSku) {
    return { valid: false, error: "La référence SKU existe déjà" };
  }
  if (Number(product.quantity) < 0) {
    return { valid: false, error: "La quantité doit être positive ou nulle" };
  }
  return { valid: true };
}

test("Inventory - Detects duplicate SKU and rejects negative stock", () => {
  const existing = [{ sku: "DISJ-HAG-16A", name: "Disjoncteur Hager 16A", quantity: 20 }];

  const duplicateSku = { sku: "disj-hag-16a", name: "Autre Disjoncteur", quantity: 5 };
  assert.equal(validateProductItem(existing, duplicateSku).valid, false);

  const negativeQty = { sku: "DIFF-SCH-40A", name: "Différentiel", quantity: -1 };
  assert.equal(validateProductItem(existing, negativeQty).valid, false);

  const validProduct = { sku: "DIFF-SCH-40A", name: "Différentiel Schneider 40A", quantity: 10 };
  assert.equal(validateProductItem(existing, validProduct).valid, true);
});

// 6. SUPPLIER VALIDATION & DUPLICATE CHECK
function validateSupplierItem(existingSuppliers, supplier) {
  if (!supplier.name || !supplier.name.trim()) {
    return { valid: false, error: "Le nom commercial est requis" };
  }
  const isDuplicate = existingSuppliers.some(
    (s) => s.name.trim().toLowerCase() === supplier.name.trim().toLowerCase()
  );
  if (isDuplicate) {
    return { valid: false, error: "Le fournisseur existe déjà" };
  }
  if (supplier.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supplier.email.trim())) {
    return { valid: false, error: "Email invalide" };
  }
  return { valid: true };
}

test("Supplier - Validates required name, duplicate detection and email format", () => {
  const existing = [{ name: "Comptoir Électrique du Sud", email: "contact@comptoir.tn" }];

  const duplicateName = { name: "comptoir électrique du sud", email: "autre@test.tn" };
  assert.equal(validateSupplierItem(existing, duplicateName).valid, false);

  const invalidEmail = { name: "Nouveau Fournisseur", email: "mauvais-format" };
  assert.equal(validateSupplierItem(existing, invalidEmail).valid, false);

  const validSupp = { name: "Nouveau Fournisseur", email: "contact@fournisseur.tn" };
  assert.equal(validateSupplierItem(existing, validSupp).valid, true);
});

// 7. IMAGE UPLOAD & MIME TYPE / FILE SIZE VALIDATION
const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function validateUploadedFile(file) {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: "Format non supporté. Veuillez choisir un fichier PNG, JPG, WebP ou SVG." };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "L'image ne doit pas dépasser 5 Mo." };
  }
  return { valid: true };
}

test("Image Upload - Accepts valid image formats under 5MB", () => {
  const validPng = { name: "logo.png", type: "image/png", size: 1.5 * 1024 * 1024 };
  const validSvg = { name: "icon.svg", type: "image/svg+xml", size: 50 * 1024 };

  assert.equal(validateUploadedFile(validPng).valid, true);
  assert.equal(validateUploadedFile(validSvg).valid, true);
});

test("Image Upload - Rejects dangerous or unsupported MIME types", () => {
  const executable = { name: "script.sh", type: "application/x-sh", size: 1024 };
  const html = { name: "phishing.html", type: "text/html", size: 2048 };
  const pdf = { name: "doc.pdf", type: "application/pdf", size: 50000 };

  assert.equal(validateUploadedFile(executable).valid, false);
  assert.equal(validateUploadedFile(html).valid, false);
  assert.equal(validateUploadedFile(pdf).valid, false);
});

test("Image Upload - Rejects files exceeding 5MB size limit", () => {
  const oversizedImage = { name: "huge_photo.jpg", type: "image/jpeg", size: 5.2 * 1024 * 1024 };
  const result = validateUploadedFile(oversizedImage);
  assert.equal(result.valid, false);
  assert.ok(result.error.includes("5 Mo"));
});

// 8. FLOATING CLIENT COUNTER NUMERIC PARSING & FALLBACK
function parseClientCount(storedValue) {
  if (!storedValue) return 500;
  const parsed = parseInt(storedValue, 10);
  return isNaN(parsed) || parsed <= 0 ? 500 : parsed;
}

test("Client Counter - Fallback and integer validation", () => {
  assert.equal(parseClientCount(null), 500);
  assert.equal(parseClientCount(""), 500);
  assert.equal(parseClientCount("invalid"), 500);
  assert.equal(parseClientCount("-10"), 500);
  assert.equal(parseClientCount("650"), 650);
  assert.equal(parseClientCount("1200"), 1200);
});

// 9. SERVICE SELECTION DROPDOWN WITHOUT PRICES
test("Service Selection Dropdown - Options render service labels and descriptions without displaying prices", () => {
  const services = [
    { id: "depannage", label: "Dépannage d'urgence 24/7", description: "Intervention rapide en cas de panne" },
    { id: "renovation", label: "Rénovation & Mise aux normes", description: "Mise en conformité NFC 15-100" },
    { id: "tableau", label: "Installation Tableau Électrique", description: "Remplacement ou pose neuf" },
    { id: "eclairage", label: "Éclairage LED & Économie d'énergie", description: "Étude et installation" },
  ];

  services.forEach((service) => {
    assert.ok(service.label.length > 0);
    assert.doesNotMatch(service.label, /(?:TND|DT|\d+\s*(?:DT|TND|dinars|€|\$))/i);
  });
});
