import express from 'express';
import { getRates, updateRate, bulkUpdateRates } from '../controllers/ratesController.js';
import {
  getInventory,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getInventoryStats
} from '../controllers/inventoryController.js';
import {
  createRetailInvoice,
  createWholesaleChallan,
  getInvoices,
  getInvoiceById
} from '../controllers/salesController.js';
import {
  getEmployeesWithAnalytics,
  getEmployeeById,
  createEmployee,
  updateEmployee
} from '../controllers/employeeController.js';
import {
  getKarigarOrders,
  createKarigarOrder,
  receiveKarigarOrder
} from '../controllers/karigarController.js';
import {
  getOldGoldTransactions,
  createOldGoldEntry
} from '../controllers/oldGoldController.js';
import {
  getTrayList,
  getAuditHistory,
  submitTrayAudit
} from '../controllers/auditController.js';
import {
  getCustomers,
  createCustomer,
  updateDealerLedger
} from '../controllers/customerController.js';
import {
  getDashboardOverview,
  getStockLedger
} from '../controllers/analyticsController.js';

const router = express.Router();

// Metal Rates
router.get('/rates', getRates);
router.put('/rates/:id', updateRate);
router.post('/rates/bulk', bulkUpdateRates);

// Inventory & Products
router.get('/inventory', getInventory);
router.get('/inventory/stats', getInventoryStats);
router.get('/inventory/:id', getProductById);
router.post('/inventory', createProduct);
router.put('/inventory/:id', updateProduct);
router.delete('/inventory/:id', deleteProduct);

// Sales & POS
router.post('/sales/retail', createRetailInvoice);
router.post('/sales/wholesale', createWholesaleChallan);
router.get('/sales/invoices', getInvoices);
router.get('/sales/invoices/:id', getInvoiceById);

// Employee Hub & Analytics
router.get('/employees', getEmployeesWithAnalytics);
router.get('/employees/:id', getEmployeeById);
router.post('/employees', createEmployee);
router.put('/employees/:id', updateEmployee);

// Karigar / Artisans
router.get('/karigar', getKarigarOrders);
router.post('/karigar', createKarigarOrder);
router.post('/karigar/:id/receive', receiveKarigarOrder);

// Old Gold Exchange
router.get('/old-gold', getOldGoldTransactions);
router.post('/old-gold', createOldGoldEntry);

// Tray & Counter Stock Audit
router.get('/audit/trays', getTrayList);
router.get('/audit/history', getAuditHistory);
router.post('/audit/submit', submitTrayAudit);

// Customers & B2B Dealers
router.get('/customers', getCustomers);
router.post('/customers', createCustomer);
router.put('/customers/:id/ledger', updateDealerLedger);

// Analytics & Dashboard & Ledger
router.get('/analytics/dashboard', getDashboardOverview);
router.get('/analytics/stock-ledger', getStockLedger);

export default router;
