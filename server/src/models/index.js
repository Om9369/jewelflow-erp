import mongoose from 'mongoose';

// ─── 1. Metal Rates Schema ──────────────────────────────────────────────────
export const MetalRateSchema = new mongoose.Schema({
  metal: { type: String, required: true },
  purity: { type: String, required: true },
  rate_per_gram: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  updated_at: { type: Date, default: Date.now }
});
export const MetalRate = mongoose.models.MetalRate || mongoose.model('MetalRate', MetalRateSchema);

// ─── 2. Employee Schema ──────────────────────────────────────────────────────
export const EmployeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, default: '' },
  phone: { type: String, required: true },
  role: { type: String, default: 'SALES_EXECUTIVE' },
  target_monthly_revenue: { type: Number, default: 2000000 },
  target_monthly_grams: { type: Number, default: 300 },
  commission_rate_pct: { type: Number, default: 1.0 },
  avatar_color: { type: String, default: '#D97706' },
  active: { type: Number, default: 1 },
  created_at: { type: Date, default: Date.now }
});
export const Employee = mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);

// ─── 3. Customer Schema ──────────────────────────────────────────────────────
export const CustomerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, default: '' },
  type: { type: String, default: 'RETAIL_CUSTOMER' },
  gst_number: { type: String, default: '' },
  pan_card: { type: String, default: '' },
  address: { type: String, default: '' },
  fine_gold_balance: { type: Number, default: 0 },
  cash_balance: { type: Number, default: 0 },
  loyalty_points: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
});
export const Customer = mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);

// ─── 4. Product Schema ──────────────────────────────────────────────────────
export const ProductSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true },
  barcode: { type: String, default: '' },
  title: { type: String, required: true },
  category: { type: String, required: true },
  metal_type: { type: String, required: true },
  purity: { type: String, required: true },
  gross_weight: { type: Number, required: true },
  net_weight: { type: Number, required: true },
  stone_weight: { type: Number, default: 0 },
  stone_type: { type: String, default: 'None' },
  stone_cents: { type: Number, default: 0 },
  stone_price: { type: Number, default: 0 },
  wastage_pct: { type: Number, default: 0 },
  making_charge_type: { type: String, default: 'PER_GRAM' },
  making_charge_value: { type: Number, default: 0 },
  huid: { type: String, default: '' },
  counter_tray: { type: String, default: '' },
  item_type: { type: String, default: 'RETAIL_SINGLE' },
  pieces: { type: Number, default: 1 },
  touch_pct: { type: Number, default: 91.6 },
  fine_metal_weight: { type: Number, default: 0 },
  status: { type: String, default: 'IN_STOCK' },
  cost_price: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  created_at: { type: Date, default: Date.now }
});
export const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

// ─── 5. Sales Invoice Schema ────────────────────────────────────────────────
export const SalesItemSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  sku: { type: String, default: '' },
  title: { type: String, required: true },
  category: { type: String, default: '' },
  metal_type: { type: String, default: 'Gold' },
  purity: { type: String, default: '22K (916)' },
  gross_weight: { type: Number, default: 0 },
  net_weight: { type: Number, default: 0 },
  stone_weight: { type: Number, default: 0 },
  metal_rate_applied: { type: Number, default: 0 },
  making_charge: { type: Number, default: 0 },
  stone_price: { type: Number, default: 0 },
  total_item_price: { type: Number, required: true },
  pieces: { type: Number, default: 1 },
  created_at: { type: Date, default: Date.now }
});

export const SalesInvoiceSchema = new mongoose.Schema({
  invoice_no: { type: String, required: true, unique: true },
  type: { type: String, default: 'RETAIL_TAX_INVOICE' },
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customer_name: { type: String, required: true },
  customer_phone: { type: String, default: '' },
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  employee_name: { type: String, required: true },
  subtotal: { type: Number, required: true },
  making_charges: { type: Number, default: 0 },
  stone_charges: { type: Number, default: 0 },
  old_gold_deduction: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  tax_amount: { type: Number, default: 0 },
  total_amount: { type: Number, required: true },
  fine_gold_settlement_grams: { type: Number, default: 0 },
  cash_paid: { type: Number, default: 0 },
  payment_mode: { type: String, default: 'CASH' },
  status: { type: String, default: 'PAID' },
  items: [SalesItemSchema],
  notes: { type: String, default: '' },
  created_at: { type: Date, default: Date.now }
});
export const SalesInvoice = mongoose.models.SalesInvoice || mongoose.model('SalesInvoice', SalesInvoiceSchema);

// ─── 6. Old Gold Transaction Schema ─────────────────────────────────────────
export const OldGoldSchema = new mongoose.Schema({
  receipt_no: { type: String, required: true, unique: true },
  customer_name: { type: String, required: true },
  customer_phone: { type: String, default: '' },
  gross_weight: { type: Number, required: true },
  stone_dust_deduction: { type: Number, default: 0 },
  net_weight: { type: Number, required: true },
  purity_touch_pct: { type: Number, required: true },
  fine_gold_weight: { type: Number, required: true },
  valuation_rate_per_gram: { type: Number, required: true },
  total_valuation: { type: Number, required: true },
  settlement_mode: { type: String, default: 'INVOICE_CREDIT' },
  linked_invoice_no: { type: String, default: '' },
  notes: { type: String, default: '' },
  created_at: { type: Date, default: Date.now }
});
export const OldGoldTransaction = mongoose.models.OldGoldTransaction || mongoose.model('OldGoldTransaction', OldGoldSchema);
