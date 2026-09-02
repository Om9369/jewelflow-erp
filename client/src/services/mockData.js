// Clean Initial Dataset for JewelFlow ERP
export const initialMockData = {
  metal_rates: [
    { id: 1, metal: "Gold", purity: "24K (999)", rate_per_gram: 7250, currency: "INR", updated_at: new Date().toISOString() },
    { id: 2, metal: "Gold", purity: "22K (916)", rate_per_gram: 6750, currency: "INR", updated_at: new Date().toISOString() },
    { id: 3, metal: "Gold", purity: "18K (750)", rate_per_gram: 5550, currency: "INR", updated_at: new Date().toISOString() },
    { id: 4, metal: "Gold", purity: "14K (585)", rate_per_gram: 4350, currency: "INR", updated_at: new Date().toISOString() },
    { id: 5, metal: "Silver", purity: "999 Fine", rate_per_gram: 88.5, currency: "INR", updated_at: new Date().toISOString() },
    { id: 6, metal: "Silver", purity: "925 Sterling", rate_per_gram: 82, currency: "INR", updated_at: new Date().toISOString() },
    { id: 7, metal: "Platinum", purity: "950 Pure", rate_per_gram: 3200, currency: "INR", updated_at: new Date().toISOString() }
  ],
  employees: [],
  customers: [],
  products: [],
  sales_invoices: [],
  sales_items: [],
  stock_ledger: [],
  karigar_orders: [],
  old_gold_transactions: [],
  tray_audits: []
};

const STORE_KEY = 'jewelflow_store_v5';

export const getLocalStore = () => {
  if (typeof window === 'undefined') return initialMockData;
  const stored = localStorage.getItem(STORE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
  }
  localStorage.setItem(STORE_KEY, JSON.stringify(initialMockData));
  return JSON.parse(JSON.stringify(initialMockData));
};

export const saveLocalStore = (data) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
  }
};
