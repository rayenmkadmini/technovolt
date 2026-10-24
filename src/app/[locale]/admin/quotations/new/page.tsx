"use client";

import { useState } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { initialCustomers } from "@/lib/data/adminStore";
import { formatCurrency, generateReference } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import {
  FileText,
  Plus,
  Trash2,
  Printer,
  ArrowLeft,
  CheckCircle2,
  Calculator,
} from "lucide-react";

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
}

export default function NewQuotationPage() {
  const router = useRouter();

  const [customerName, setCustomerName] = useState("Youssef Ben Salem");
  const [customerPhone, setCustomerPhone] = useState("+216 98 123 456");
  const [customerAddress, setCustomerAddress] = useState("Tataouine — Cité Ennour");
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [validUntil, setValidUntil] = useState(() =>
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [taxRate, setTaxRate] = useState(19.0);
  const [discountAmount, setDiscountAmount] = useState(0.0);
  const [terms, setTerms] = useState(
    "Devis valable 30 jours. Acompte de 40% à la commande, solde à la réception des travaux."
  );

  const [items, setItems] = useState<LineItem[]>([
    {
      id: "item-1",
      description: "Installation tableau divisionnaire et disjoncteurs différentiels 30mA",
      quantity: 1,
      unit: "forfait",
      unit_price: 380.0,
    },
    {
      id: "item-2",
      description: "Câblage cuivre 3G 2.5mm² et pose prises renforcées",
      quantity: 6,
      unit: "point",
      unit_price: 35.0,
    },
  ]);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const addItem = () => {
    setItems([
      ...items,
      {
        id: `item-${Date.now()}`,
        description: "",
        quantity: 1,
        unit: "pièce",
        unit_price: 0,
      },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof LineItem, value: any) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  // Monetary calculations
  const subtotalHT = items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0),
    0
  );
  const taxableBase = Math.max(0, subtotalHT - discountAmount);
  const taxAmount = (taxableBase * taxRate) / 100;
  const totalTTC = taxableBase + taxAmount;

  const quotationNumber = "DEV-2026-0044";

  const handlePrint = () => {
    window.print();
  };

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => {
      router.push("/admin/quotations");
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/admin/quotations">
            <Button variant="outline" size="sm" className="h-9 w-9 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">
              Création d'un Nouveau Devis
            </h1>
            <p className="text-xs text-slate-500">
              Numérotation séquentielle automatique : {quotationNumber}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            <span>Imprimer / PDF</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            disabled={savedSuccess}
            className="gap-2"
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Devis Enregistré !</span>
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                <span>Enregistrer le Devis</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Quotation Document Paper View */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 shadow-sm space-y-8 print:p-0 print:border-none print:shadow-none">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-200 pb-8">
          <div>
            <div className="text-2xl font-black text-[#1B3A6B] tracking-tight">
              TECHNOVOLT
            </div>
            <div className="text-xs font-semibold text-[#F5A623] uppercase tracking-wider">
              Électricité Générale &bull; Domotique
            </div>
            <div className="text-xs text-slate-500 mt-2 space-y-0.5">
              <p>Centre Ville, Route de Remada</p>
              <p>Tataouine, Tunisie</p>
              <p>Tél : +216 75 000 000 &bull; WhatsApp : +216 90 000 000</p>
              <p>Email : contact@technovolt.tn</p>
            </div>
          </div>

          <div className="text-start sm:text-end space-y-1">
            <span className="inline-block px-3 py-1 rounded bg-[#1B3A6B] text-white font-mono text-sm font-bold">
              DEVIS N° {quotationNumber}
            </span>
            <div className="text-xs text-slate-600 pt-2 space-y-1">
              <div>
                Date d'émission : <strong>{issueDate}</strong>
              </div>
              <div>
                Valable jusqu'au : <strong>{validUntil}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Information Block */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-200/80">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Destinataire (Client)
            </h3>
            <div className="space-y-2">
              <Input
                placeholder="Nom du Client ou Société"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="font-bold text-sm bg-white"
              />
              <Input
                placeholder="Téléphone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="text-xs bg-white font-mono"
              />
              <Input
                placeholder="Adresse d'intervention"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="text-xs bg-white"
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Dates du Devis
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Émis le</label>
                <Input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="text-xs bg-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Validité</label>
                <Input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="text-xs bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Désignation des Prestations & Fournitures
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItem}
              className="gap-1.5 text-xs print:hidden"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Ajouter une ligne</span>
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-100 text-slate-600 font-semibold border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 text-start w-1/2">Description des travaux ou matériel</th>
                  <th className="py-2.5 px-2 text-center w-20">Qté</th>
                  <th className="py-2.5 px-2 text-center w-24">Unité</th>
                  <th className="py-2.5 px-3 text-end w-32">Prix Unitaire HT</th>
                  <th className="py-2.5 px-3 text-end w-32">Total HT</th>
                  <th className="py-2.5 px-2 text-center w-12 print:hidden"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => {
                  const lineTotal = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
                  return (
                    <tr key={item.id} className="align-top">
                      <td className="py-2.5 px-3">
                        <Input
                          placeholder="Description de la prestation ou matériel..."
                          value={item.description}
                          onChange={(e) => updateItem(item.id, "description", e.target.value)}
                          className="text-xs h-8"
                        />
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <Input
                          type="number"
                          min="0.01"
                          step="any"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                          className="text-xs h-8 text-center"
                        />
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <select
                          value={item.unit}
                          onChange={(e) => updateItem(item.id, "unit", e.target.value)}
                          className="h-8 rounded-lg border border-slate-300 text-xs px-2 bg-white"
                        >
                          <option value="pièce">pièce</option>
                          <option value="forfait">forfait</option>
                          <option value="mètre">mètre</option>
                          <option value="point">point</option>
                          <option value="heure">heure</option>
                        </select>
                      </td>
                      <td className="py-2.5 px-3 text-end">
                        <Input
                          type="number"
                          min="0"
                          step="0.001"
                          value={item.unit_price}
                          onChange={(e) => updateItem(item.id, "unit_price", parseFloat(e.target.value) || 0)}
                          className="text-xs h-8 text-end font-mono"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-end font-bold text-slate-900 font-mono pt-3">
                        {formatCurrency(lineTotal, "fr")}
                      </td>
                      <td className="py-2.5 px-2 text-center print:hidden pt-2">
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals & Calculations Block */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-8 pt-6 border-t border-slate-200">
          <div className="w-full sm:w-1/2 space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">
              Conditions de Règlement & Notes
            </label>
            <Textarea
              rows={3}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="w-full sm:w-80 space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span>Total Brut HT :</span>
              <span className="font-mono font-bold">{formatCurrency(subtotalHT, "fr")}</span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span>Remise (TND) :</span>
              <span className="font-mono">{formatCurrency(discountAmount, "fr")}</span>
            </div>

            <div className="flex items-center justify-between text-slate-600 border-t border-slate-200 pt-2">
              <span>Taux TVA applicable :</span>
              <span className="font-bold">{taxRate}%</span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span>Montant TVA :</span>
              <span className="font-mono font-bold text-slate-800">
                {formatCurrency(taxAmount, "fr")}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-900 font-black text-sm border-t-2 border-slate-300 pt-2 text-[#1B3A6B]">
              <span>NET À PAYER TTC :</span>
              <span className="text-base font-mono">
                {formatCurrency(totalTTC, "fr")}
              </span>
            </div>
          </div>
        </div>

        {/* Signatures Block for Print */}
        <div className="hidden print:grid grid-cols-2 gap-10 pt-16 mt-8 border-t border-slate-200 text-xs">
          <div className="space-y-12">
            <p className="font-bold">Pour le Client (Mention "Bon pour accord") :</p>
            <div className="border-b border-slate-400 w-48" />
          </div>
          <div className="space-y-12 text-end">
            <p className="font-bold">Pour TECHNOVOLT :</p>
            <div className="border-b border-slate-400 w-48 ms-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}
