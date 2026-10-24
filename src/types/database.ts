export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole =
  | "owner"
  | "admin"
  | "manager"
  | "technician"
  | "accountant"
  | "content_editor";

export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "quotation_sent"
  | "won"
  | "lost";

export type AppointmentStatus =
  | "requested"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "rescheduled";

export type WorkOrderStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "on_hold"
  | "cancelled";

export type QuotationStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "rejected"
  | "expired"
  | "converted";

export type InvoiceStatus =
  | "draft"
  | "issued"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "cancelled"
  | "credited";

export type PaymentMethod = "cash" | "bank_transfer" | "card" | "other";

export interface CompanySettings {
  company_name: string;
  tagline: string;
  tagline_ar: string;
  tagline_en: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  governorate: string;
  country: string;
  opening_hours_fr: string;
  opening_hours_ar: string;
  opening_hours_en: string;
  logo_url: string;
  tax_number?: string;
  commercial_register?: string;
  default_tax_rate: number;
  currency: string;
}

export interface Service {
  id: string;
  slug: string;
  category: string;
  cover_image: string;
  gallery?: string[];
  icon?: string;
  sort_order: number;
  is_active: boolean;
  price_from?: number;
  price_to?: number;
  show_price: boolean;
  estimated_duration?: string;
  status: "draft" | "published" | "archived";
  created_at: string;
  updated_at: string;
  // Join translation:
  title?: string;
  short_description?: string;
  full_description?: string;
  scope_of_work?: string[];
  benefits?: string[];
}

export interface Project {
  id: string;
  service_id?: string;
  cover_image: string;
  gallery?: string[];
  before_images?: string[];
  after_images?: string[];
  completion_date?: string;
  location?: string;
  is_featured: boolean;
  status: "draft" | "published";
  sort_order: number;
  created_at: string;
  title?: string;
  description?: string;
  category?: string;
}

export interface Customer {
  id: string;
  reference_number: string;
  full_name: string;
  phone: string;
  email?: string;
  company_name?: string;
  tax_id?: string;
  notes?: string;
  is_active: boolean;
  total_spent: number;
  outstanding_balance: number;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  reference_number: string;
  full_name: string;
  phone: string;
  email?: string;
  service_id?: string;
  source: string;
  message?: string;
  address?: string;
  preferred_date?: string;
  preferred_time?: string;
  preferred_contact: "phone" | "whatsapp" | "email";
  photos?: string[];
  status: LeadStatus;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  reference_number: string;
  customer_id: string;
  customer_name?: string;
  customer_phone?: string;
  service_title?: string;
  scheduled_date: string;
  scheduled_time: string;
  estimated_duration?: string;
  address: string;
  assigned_to?: string;
  technician_name?: string;
  status: AppointmentStatus;
  notes?: string;
  created_at: string;
}

export interface WorkOrder {
  id: string;
  job_number: string;
  customer_id: string;
  customer_name?: string;
  description: string;
  status: WorkOrderStatus;
  start_date?: string;
  completion_date?: string;
  labor_hours?: number;
  labor_rate?: number;
  additional_costs?: number;
  total_cost: number;
  notes?: string;
  completion_notes?: string;
  completion_photos?: string[];
  created_at: string;
}

export interface QuotationItem {
  id?: string;
  description: string;
  quantity: number;
  unit?: string;
  unit_price: number;
  discount?: number;
  tax_rate?: number;
  total: number;
}

export interface Quotation {
  id: string;
  quotation_number: string;
  customer_id: string;
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  issue_date: string;
  valid_until: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  currency: string;
  terms?: string;
  customer_notes?: string;
  status: QuotationStatus;
  items?: QuotationItem[];
  created_at: string;
}

export interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unit?: string;
  unit_price: number;
  discount?: number;
  tax_rate?: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  amount_paid: number;
  balance_due: number;
  currency: string;
  payment_terms?: string;
  status: InvoiceStatus;
  items?: InvoiceItem[];
  created_at: string;
}

export interface Payment {
  id: string;
  payment_reference: string;
  customer_id?: string;
  customer_name?: string;
  invoice_id?: string;
  invoice_number?: string;
  amount: number;
  currency: string;
  payment_date: string;
  payment_method: PaymentMethod;
  receipt_reference?: string;
  notes?: string;
  created_at: string;
}

export interface Expense {
  id: string;
  reference: string;
  expense_date: string;
  category_id?: string;
  category_name?: string;
  supplier_name?: string;
  description: string;
  amount: number;
  currency: string;
  tax_amount: number;
  payment_method: PaymentMethod;
  payment_status: "pending" | "paid";
  receipt_url?: string;
  notes?: string;
  created_at: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  purchase_cost: number;
  sale_price: number;
  quantity: number;
  low_stock_threshold: number;
  unit: string;
  supplier_name?: string;
  is_active: boolean;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  outstanding_amount: number;
  is_active: boolean;
  created_at: string;
}
