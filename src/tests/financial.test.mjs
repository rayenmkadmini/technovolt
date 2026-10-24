import test from "node:test";
import assert from "node:assert/strict";

const money = {
  add(...amounts) {
    return amounts.reduce((sum, amount) => {
      return Math.round((sum + amount) * 1000) / 1000;
    }, 0);
  },
  subtract(a, b) {
    return Math.round((a - b) * 1000) / 1000;
  },
  multiply(a, b) {
    return Math.round(a * b * 1000) / 1000;
  },
  tax(amount, rate) {
    return Math.round(amount * (rate / 100) * 1000) / 1000;
  },
  discount(amount, discount, type) {
    if (type === "percentage") {
      return Math.round(amount * (discount / 100) * 1000) / 1000;
    }
    return discount;
  },
};

function isRTL(locale) {
  return locale === "ar";
}

function isLowStock(quantity, threshold) {
  return quantity <= threshold;
}

function isValidInvoiceNumber(invNum) {
  return /^FAC-\d{4}-\d{4}$/.test(invNum);
}

test("Financial calculations - Subtotal addition", () => {
  const line1 = money.multiply(3, 14.5); // 43.500
  const line2 = money.multiply(2, 58.0); // 116.000
  const line3 = money.multiply(1, 140.0); // 140.000
  const subtotal = money.add(line1, line2, line3);

  assert.equal(line1, 43.5);
  assert.equal(line2, 116.0);
  assert.equal(line3, 140.0);
  assert.equal(subtotal, 299.5);
});

test("Financial calculations - Tax at 19% (Tunisian standard VAT)", () => {
  const subtotal = 1000.0;
  const tax = money.tax(subtotal, 19.0);
  const total = money.add(subtotal, tax);

  assert.equal(tax, 190.0);
  assert.equal(total, 1190.0);
});

test("Financial calculations - Precision with millimes (3 decimals)", () => {
  const item = money.multiply(3, 33.333);
  assert.equal(item, 99.999);
});

test("Financial calculations - Payment allocation and balance due", () => {
  const invoiceTotal = 1280.0;
  const partialPayment = 900.0;
  const remaining = money.subtract(invoiceTotal, partialPayment);

  assert.equal(remaining, 380.0);

  const secondPayment = 380.0;
  const finalBalance = money.subtract(remaining, secondPayment);
  assert.equal(finalBalance, 0.0);
});

test("Financial calculations - Discount percentage & fixed", () => {
  const base = 500.0;
  const discPct = money.discount(base, 10, "percentage");
  assert.equal(discPct, 50.0);

  const discFixed = money.discount(base, 75.0, "fixed");
  assert.equal(discFixed, 75.0);
});

test("i18n - RTL detection for Arabic", () => {
  assert.equal(isRTL("ar"), true);
  assert.equal(isRTL("fr"), false);
  assert.equal(isRTL("en"), false);
});

test("Inventory - Low stock threshold detection", () => {
  assert.equal(isLowStock(3, 5), true); // low stock
  assert.equal(isLowStock(5, 5), true); // exact threshold
  assert.equal(isLowStock(12, 5), false); // healthy stock
});

test("Invoicing - Format validation (FAC-YYYY-XXXX)", () => {
  assert.equal(isValidInvoiceNumber("FAC-2026-0038"), true);
  assert.equal(isValidInvoiceNumber("FAC-2026-0039"), true);
  assert.equal(isValidInvoiceNumber("INV-123"), false);
});

test("Quotation conversion - Line items sum equals subtotal", () => {
  const items = [
    { qty: 1, price: 240.0 },
    { qty: 18, price: 22.0 },
    { qty: 3, price: 85.0 },
  ];
  const subtotal = items.reduce((acc, it) => money.add(acc, money.multiply(it.qty, it.price)), 0);
  assert.equal(subtotal, 891.0);

  const tva = money.tax(subtotal, 19.0); // 169.290
  assert.equal(tva, 169.29);

  const total = money.add(subtotal, tva);
  assert.equal(total, 1060.29);
});
