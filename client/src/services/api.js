const getApiBase = () => {
  if (typeof window !== 'undefined') {
    return `http://${window.location.hostname}:5000/api`;
  }
  return 'http://localhost:5000/api';
};
const API_BASE = getApiBase();

export const api = {
  // Metal Rates
  getRates: async () => {
    const res = await fetch(`${API_BASE}/rates`);
    return res.json();
  },
  updateRate: async (id, rate_per_gram) => {
    const res = await fetch(`${API_BASE}/rates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rate_per_gram })
    });
    return res.json();
  },
  bulkUpdateRates: async (rates) => {
    const res = await fetch(`${API_BASE}/rates/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rates })
    });
    return res.json();
  },

  // Inventory
  getInventory: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/inventory?${query}`);
    return res.json();
  },
  getInventoryStats: async () => {
    const res = await fetch(`${API_BASE}/inventory/stats`);
    return res.json();
  },
  getProductById: async (id) => {
    const res = await fetch(`${API_BASE}/inventory/${id}`);
    return res.json();
  },
  createProduct: async (productData) => {
    const res = await fetch(`${API_BASE}/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });
    return res.json();
  },
  updateProduct: async (id, productData) => {
    const res = await fetch(`${API_BASE}/inventory/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });
    return res.json();
  },
  deleteProduct: async (id) => {
    const res = await fetch(`${API_BASE}/inventory/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  // Sales & POS
  createRetailInvoice: async (invoiceData) => {
    const res = await fetch(`${API_BASE}/sales/retail`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoiceData)
    });
    return res.json();
  },
  createWholesaleChallan: async (challanData) => {
    const res = await fetch(`${API_BASE}/sales/wholesale`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(challanData)
    });
    return res.json();
  },
  getInvoices: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/sales/invoices?${query}`);
    return res.json();
  },
  getInvoiceById: async (id) => {
    const res = await fetch(`${API_BASE}/sales/invoices/${id}`);
    return res.json();
  },

  // Employees & Analytics
  getEmployees: async () => {
    const res = await fetch(`${API_BASE}/employees`);
    return res.json();
  },
  getEmployeeById: async (id) => {
    const res = await fetch(`${API_BASE}/employees/${id}`);
    return res.json();
  },
  createEmployee: async (data) => {
    const res = await fetch(`${API_BASE}/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  updateEmployee: async (id, data) => {
    const res = await fetch(`${API_BASE}/employees/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Karigar
  getKarigarOrders: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/karigar?${query}`);
    return res.json();
  },
  createKarigarOrder: async (data) => {
    const res = await fetch(`${API_BASE}/karigar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  receiveKarigarOrder: async (id, data) => {
    const res = await fetch(`${API_BASE}/karigar/${id}/receive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Old Gold
  getOldGold: async () => {
    const res = await fetch(`${API_BASE}/old-gold`);
    return res.json();
  },
  createOldGold: async (data) => {
    const res = await fetch(`${API_BASE}/old-gold`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Audit
  getTrayList: async () => {
    const res = await fetch(`${API_BASE}/audit/trays`);
    return res.json();
  },
  getAuditHistory: async () => {
    const res = await fetch(`${API_BASE}/audit/history`);
    return res.json();
  },
  submitTrayAudit: async (data) => {
    const res = await fetch(`${API_BASE}/audit/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Customers
  getCustomers: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/customers?${query}`);
    return res.json();
  },
  createCustomer: async (data) => {
    const res = await fetch(`${API_BASE}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Analytics & Ledger
  getDashboard: async () => {
    const res = await fetch(`${API_BASE}/analytics/dashboard`);
    return res.json();
  },
  getStockLedger: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/analytics/stock-ledger?${query}`);
    return res.json();
  }
};
