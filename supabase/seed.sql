-- ============================================================================
-- TECHNOVOLT — DATABASE SEED SCRIPT (DEMO DATA)
-- ============================================================================
-- Company: TECHNOVOLT (Tataouine, Tunisia)
-- Currency: TND (Tunisian Dinar, 3 decimal places)
-- All demo records are marked and realistic for Tataouine, Tunisia.
-- ============================================================================

-- 1. Update Company Settings
UPDATE public.company_settings
SET settings = '{
    "company_name": "TECHNOVOLT",
    "tagline": "Électricité générale | Domotique",
    "tagline_ar": "كهرباء عامة | أنظمة تحكم ذكي",
    "tagline_en": "General Electrical | Smart Home Automation",
    "phone": "+216 75 000 000",
    "whatsapp": "+216 90 000 000",
    "email": "contact@technovolt.tn",
    "address": "Centre Ville, Route de Remada",
    "city": "Tataouine",
    "governorate": "Tataouine",
    "country": "Tunisie",
    "opening_hours_fr": "Lundi - Samedi : 08h00 - 18h00",
    "opening_hours_ar": "الإثنين - السبت : 08:00 - 18:00",
    "opening_hours_en": "Monday - Saturday: 8:00 AM - 6:00 PM",
    "logo_url": "/logo.jpg",
    "default_tax_rate": 19.0,
    "currency": "TND"
  }'::jsonb;

-- 2. Expense Categories
INSERT INTO public.expense_categories (name, name_fr, name_ar, name_en, icon, is_system, is_active)
VALUES
  ('Matériel & Câblage', 'Matériel & Câblage', 'مواد وكابلات كهربائية', 'Materials & Wiring', 'Layers', true, true),
  ('Outillage & Équipements', 'Outillage & Équipements', 'معدات وأدوات السلامة', 'Tools & Equipment', 'Wrench', true, true),
  ('Carburant & Transport', 'Carburant & Transport', 'وقود وتنقلات', 'Fuel & Transport', 'Truck', true, true),
  ('Climatisation & Fluides', 'Climatisation & Fluides', 'غاز ومعدات تبريد', 'HVAC & Refrigerants', 'Wind', true, true),
  ('Téléphone & Internet', 'Téléphone & Internet', 'هاتف وإنترنت', 'Phone & Internet', 'Phone', true, true),
  ('Frais Administratifs', 'Frais Administratifs', 'مصاريف إدارية', 'Administrative Expenses', 'FileText', true, true)
ON CONFLICT DO NOTHING;

-- 3. Demo Suppliers
INSERT INTO public.suppliers (id, name, contact_person, phone, email, address, notes, outstanding_amount, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000010', 'Comptoir Électrique du Sud', 'Mr. Hichem', '+216 75 750 200', 'comptoir.sud@planet.tn', 'Zone Industrielle, Tataouine', 'Fournisseur principal Schneider Electric & Legrand', 0.000, true),
  ('00000000-0000-0000-0000-000000000011', 'Froid & Climatisation Tunisie', 'Mr. Bilel', '+216 71 890 123', 'commercial@froid-tunisie.com', 'Avenue de l''Indépendance, Gabès', 'Distributeur outillage frigorifique et bouteilles R410A / R32', 0.000, true)
ON CONFLICT (id) DO NOTHING;

-- 4. Demo Products & Inventory
INSERT INTO public.products (id, sku, name, name_fr, name_ar, name_en, category, purchase_cost, sale_price, quantity, low_stock_threshold, unit, supplier_id, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000020', 'DISJ-SCHN-16A', 'Disjoncteur modulaire 16A Schneider', 'Disjoncteur modulaire 16A Schneider', 'قاطع تفاضلي 16 أمبير شنايدر', 'Modular Circuit Breaker 16A Schneider', 'Tableau & Protection', 14.500, 22.000, 36.000, 10.000, 'pièce', '00000000-0000-0000-0000-000000000010', true),
  ('00000000-0000-0000-0000-000000000021', 'DIFF-HAG-40A', 'Interrupteur différentiel 40A 30mA Hager', 'Interrupteur différentiel 40A 30mA Hager', 'فاصل تفاضلي 40 أمبير 30 ميلي هاجر', 'Residual Current Device 40A 30mA Hager', 'Tableau & Protection', 58.000, 85.000, 8.000, 4.000, 'pièce', '00000000-0000-0000-0000-000000000010', true),
  ('00000000-0000-0000-0000-000000000022', 'CAB-3G25-100M', 'Câble cuivre 3G 2.5mm² (couronne 100m)', 'Câble cuivre 3G 2.5mm² (couronne 100m)', 'كابل نحاس 3G 2.5 مم² (لفة 100 متر)', 'Copper Cable 3G 2.5mm² 100m', 'Câbles & Conducteurs', 140.000, 195.000, 6.000, 2.000, 'rouleau', '00000000-0000-0000-0000-000000000010', true),
  ('00000000-0000-0000-0000-000000000023', 'GAZ-R410A-11KG', 'Fluide frigorigène R410A bouteille 11.3 kg', 'Fluide frigorigène R410A bouteille 11.3 kg', 'غاز تكييف R410A قارورة 11.3 كغ', 'Refrigerant Gas R410A Cylinder 11.3kg', 'Climatisation', 290.000, 450.000, 3.000, 2.000, 'bouteille', '00000000-0000-0000-0000-000000000011', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Demo Customers
INSERT INTO public.customers (id, reference_number, full_name, phone, email, company_name, tax_id, notes, is_active, total_spent, outstanding_balance)
VALUES
  ('00000000-0000-0000-0000-000000000030', 'CL-2601-A1', 'Youssef Ben Salem', '+216 98 123 456', 'youssef.bensalem@gmail.com', 'Résidence Ennour', '1234567/A/M/000', 'Client fidèle. Installation villa achevée à Cité Ennour.', true, 3450.000, 0.000),
  ('00000000-0000-0000-0000-000000000031', 'CL-2602-B2', 'Société Sud Équipement', '+216 75 760 111', 'contact@sud-equipement.tn', 'Sud Équipement SARL', '0987654/B/C/001', 'Entretien climatisation et armoire électrique magasin central.', true, 1280.000, 380.000),
  ('00000000-0000-0000-0000-000000000032', 'CL-2603-C3', 'Monia Trabelsi', '+216 22 456 789', 'monia.tr@topnet.tn', NULL, NULL, 'Remplacement chauffe-eau électrique 100L et contrôle différentiel.', true, 420.000, 0.000)
ON CONFLICT (id) DO NOTHING;

-- 6. Demo Leads
INSERT INTO public.leads (id, reference_number, full_name, phone, email, message, address, source, status, preferred_contact)
VALUES
  ('00000000-0000-0000-0000-000000000040', 'DEV-QT-2604-9X', 'Ali Dridi', '+216 95 333 444', 'ali.dridi@yahoo.fr', 'Installation tableau divisionnaire et 12 points lumineux pour villa neuve.', 'Tataouine — Cité El Mahrajane', 'website', 'new', 'phone'),
  ('00000000-0000-0000-0000-000000000041', 'DEV-CT-2604-4K', 'Fatma Gheriani', '+216 50 112 233', 'fatma.gh@outlook.com', 'Panne générale suite orage hier soir. Disjoncteur principal refuse de remonter.', 'Tataouine Centre', 'website', 'contacted', 'whatsapp')
ON CONFLICT (id) DO NOTHING;

-- 7. Demo Appointments
INSERT INTO public.appointments (id, reference_number, customer_id, scheduled_date, scheduled_time, address, status, notes)
VALUES
  ('00000000-0000-0000-0000-000000000050', 'RDV-2610-01', '00000000-0000-0000-0000-000000000030', '2026-10-26', '09:30:00', 'Villa Cité Ennour, Tataouine', 'confirmed', 'Contrôle annuel et test différentiel 30mA'),
  ('00000000-0000-0000-0000-000000000051', 'RDV-2610-02', '00000000-0000-0000-0000-000000000031', '2026-10-27', '14:00:00', 'Magasin Central, Rue Habib Bourguiba, Tataouine', 'confirmed', 'Nettoyage des échangeurs et recharge gaz R410A')
ON CONFLICT (id) DO NOTHING;

-- 8. Demo Work Orders
INSERT INTO public.work_orders (id, job_number, customer_id, description, status, start_date, completion_date, labor_hours, labor_rate, additional_costs, total_cost, notes)
VALUES
  ('00000000-0000-0000-0000-000000000060', 'OT-2604-001', '00000000-0000-0000-0000-000000000030', 'Câblage tableau principal et parafoudre monophasé.', 'completed', '2026-03-01', '2026-03-03', 14.00, 25.000, 80.000, 1450.000, 'Travaux réceptionnés et testés avec le client.'),
  ('00000000-0000-0000-0000-000000000061', 'OT-2604-002', '00000000-0000-0000-0000-000000000031', 'Remplacement contacteurs de puissance et révision gaines.', 'in_progress', '2026-10-22', NULL, 6.00, 25.000, 40.000, 380.000, 'Phase 1 terminée, livraison des contacteurs complémentaires attendue.')
ON CONFLICT (id) DO NOTHING;

-- 9. Demo Quotations
INSERT INTO public.quotations (id, quotation_number, customer_id, issue_date, valid_until, subtotal, tax_rate, tax_amount, discount_amount, total, currency, terms, status)
VALUES
  ('00000000-0000-0000-0000-000000000070', 'DEV-2026-0042', '00000000-0000-0000-0000-000000000030', '2026-02-18', '2026-03-18', 2899.160, 19.00, 550.840, 0.000, 3450.000, 'TND', 'Acompte de 40% à la commande, solde à la réception des travaux.', 'accepted'),
  ('00000000-0000-0000-0000-000000000071', 'DEV-2026-0043', '00000000-0000-0000-0000-000000000031', '2026-10-15', '2026-11-15', 1075.630, 19.00, 204.370, 0.000, 1280.000, 'TND', 'Paiement à 30 jours fin de mois.', 'sent')
ON CONFLICT (id) DO NOTHING;

-- 10. Demo Invoices
INSERT INTO public.invoices (id, invoice_number, quotation_id, customer_id, issue_date, due_date, subtotal, tax_rate, tax_amount, discount_amount, total, amount_paid, balance_due, currency, payment_terms, status)
VALUES
  ('00000000-0000-0000-0000-000000000080', 'FAC-2026-0038', '00000000-0000-0000-0000-000000000070', '00000000-0000-0000-0000-000000000030', '2026-03-05', '2026-03-20', 2899.160, 19.00, 550.840, 0.000, 3450.000, 3450.000, 0.000, 'TND', 'Payé en totalité', 'paid'),
  ('00000000-0000-0000-0000-000000000081', 'FAC-2026-0039', '00000000-0000-0000-0000-000000000071', '00000000-0000-0000-0000-000000000031', '2026-10-18', '2026-11-02', 1075.630, 19.00, 204.370, 0.000, 1280.000, 900.000, 380.000, 'TND', 'Acompte reçu, solde dû à 15 jours', 'partially_paid')
ON CONFLICT (id) DO NOTHING;

-- 11. Demo Payments
INSERT INTO public.payments (id, payment_reference, customer_id, amount, currency, payment_date, payment_method, receipt_reference, notes)
VALUES
  ('00000000-0000-0000-0000-000000000090', 'REG-2603-01', '00000000-0000-0000-0000-000000000030', 3450.000, 'TND', '2026-03-10', 'bank_transfer', 'VIR-BIAT-88741', 'Règlement complet facture FAC-2026-0038'),
  ('00000000-0000-0000-0000-000000000091', 'REG-2610-02', '00000000-0000-0000-0000-000000000031', 900.000, 'TND', '2026-10-19', 'cash', 'RC-CASH-102', 'Acompte en espèces ouverture chantier')
ON CONFLICT (id) DO NOTHING;

-- 12. Demo Expenses
INSERT INTO public.expenses (id, reference, expense_date, supplier_id, description, amount, currency, tax_amount, payment_method, payment_status, notes)
VALUES
  ('00000000-0000-0000-0000-000000000100', 'DEP-2603-01', '2026-03-02', '00000000-0000-0000-0000-000000000010', 'Achat bobines de câble cuivre, disjoncteurs et coffrets', 1450.000, 'TND', 275.500, 'bank_transfer', 'paid', 'Approvisionnement chantier villa Ben Salem'),
  ('00000000-0000-0000-0000-000000000101', 'DEP-2603-02', '2026-03-15', NULL, 'Carburant camionnette d''intervention Tataouine & Ghomrassen', 160.000, 'TND', 0.000, 'cash', 'paid', 'Station Agil Tataouine'),
  ('00000000-0000-0000-0000-000000000102', 'DEP-2610-03', '2026-10-12', NULL, 'Nouveau multimètre numérique CAT IV et jeu de tournevis 1000V', 320.000, 'TND', 60.800, 'cash', 'paid', 'Renouvellement équipement sécurité électrique')
ON CONFLICT (id) DO NOTHING;
