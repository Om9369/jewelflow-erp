import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Layers,
  Truck,
  FileSpreadsheet,
  Menu
} from 'lucide-react';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import RateEditModal from './components/modals/RateEditModal';
import PrintTagModal from './components/modals/PrintTagModal';
import PrintInvoiceModal from './components/modals/PrintInvoiceModal';
import AddProductModal from './components/modals/AddProductModal';
import ShareModal from './components/modals/ShareModal';
import VerifyPassportModal from './components/modals/VerifyPassportModal';
import PinAuthModal from './components/modals/PinAuthModal';

import Dashboard from './pages/Dashboard';
import RetailPOS from './pages/RetailPOS';
import InventoryPage from './pages/InventoryPage';
import PurchasesPage from './pages/PurchasesPage';
import EmployeeAnalytics from './pages/EmployeeAnalytics';
import StockAudit from './pages/StockAudit';
import OldGoldPage from './pages/OldGoldPage';
import ReportsPage from './pages/ReportsPage';
import CustomersPage from './pages/CustomersPage';
import StoreSettings from './pages/StoreSettings';

import { api } from './services/api';
import { getStoreConfig } from './services/storeConfig';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [rates, setRates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [storeConfig, setStoreConfig] = useState(getStoreConfig());

  // Modals state
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedTagProduct, setSelectedTagProduct] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [verifiedProduct, setVerifiedProduct] = useState(null);

  useEffect(() => {
    loadRates();
    checkUrlVerification();
    const handleStoreUpdate = () => setStoreConfig(getStoreConfig());
    window.addEventListener('store_config_updated', handleStoreUpdate);
    return () => window.removeEventListener('store_config_updated', handleStoreUpdate);
  }, []);

  // Handle instant Digital Passport lookup when scanning tag QR code with phone
  const checkUrlVerification = async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const verifySku = params.get('verify');
      if (verifySku) {
        const invRes = await api.getInventory({ search: verifySku });
        if (invRes && invRes.success && invRes.products && invRes.products.length > 0) {
          const matched = invRes.products.find(
            p => p.sku.toLowerCase() === verifySku.toLowerCase() || p.barcode === verifySku || String(p.id) === verifySku
          ) || invRes.products[0];
          setVerifiedProduct(matched);
        }
      }
    } catch (e) {
      console.warn('Verification check note:', e);
    }
  };

  const loadRates = async () => {
    try {
      const res = await api.getRates();
      if (res.success) {
        setRates(res.rates);
      }
    } catch (err) {
      console.error('Failed to load rates:', err);
    }
  };

  const handleInvoiceCreated = (invoice) => {
    setSelectedInvoice(invoice);
    loadRates();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-amber-500 selection:text-slate-950">
      
      {/* Top Navigation Bar with Live Bullion Ticker & Mobile Menu Button */}
      <Navbar
        rates={rates}
        onOpenRateModal={() => setIsPinModalOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        storeConfig={storeConfig}
      />

      {/* Main Container: Sidebar + Page Content */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Responsive Sidebar (Desktop Static + Mobile Drawer) */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />

        <main className="flex-1 overflow-y-auto bg-slate-950/60 pb-24 lg:pb-12 w-full max-w-full">
          {activeTab === 'dashboard' && (
            <Dashboard
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenAddModal={() => setIsAddProductOpen(true)}
              onOpenRateModal={() => setIsPinModalOpen(true)}
            />
          )}

          {/* Pillar 1: Sales & Counter Billing */}
          {activeTab === 'retail-pos' && (
            <RetailPOS
              rates={rates}
              onInvoiceCreated={handleInvoiceCreated}
            />
          )}

          {/* Pillar 2: Showroom Stock & Inventory */}
          {activeTab === 'inventory' && (
            <InventoryPage
              rates={rates}
              onOpenAddModal={() => setIsAddProductOpen(true)}
              onPrintTag={(product) => setSelectedTagProduct(product)}
            />
          )}

          {/* Pillar 3: Stock Purchases & Multi-Split Settlements */}
          {activeTab === 'purchases' && (
            <PurchasesPage rates={rates} />
          )}

          {/* Sales Records & Tax Registers */}
          {activeTab === 'reports' && (
            <ReportsPage
              onPrintInvoice={(inv) => setSelectedInvoice(inv)}
            />
          )}

          {activeTab === 'customers' && (
            <CustomersPage />
          )}

          {activeTab === 'employee-hub' && (
            <EmployeeAnalytics
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}



          {activeTab === 'stock-audit' && (
            <StockAudit />
          )}

          {activeTab === 'old-gold' && (
            <OldGoldPage rates={rates} />
          )}

          {activeTab === 'store-settings' && (
            <StoreSettings />
          )}
        </main>

      </div>

      {/* Mobile Bottom Quick Navigation Bar (Core 3 Pillars + Records) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-2 py-1.5 flex items-center justify-around text-[10px] font-medium shadow-2xl">
        <button
          onClick={() => setActiveTab('retail-pos')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
            activeTab === 'retail-pos' ? 'text-amber-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShoppingCart className="w-5 h-5" />
          <span>1. Sales</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
            activeTab === 'inventory' ? 'text-amber-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span>2. Inventory</span>
        </button>

        <button
          onClick={() => setActiveTab('purchases')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
            activeTab === 'purchases' ? 'text-amber-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Truck className="w-5 h-5" />
          <span>3. Purchases</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
            activeTab === 'reports' ? 'text-amber-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-5 h-5" />
          <span>Records</span>
        </button>

        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-slate-400 hover:text-amber-400 transition-all"
        >
          <Menu className="w-5 h-5" />
          <span>Menu</span>
        </button>
      </nav>

      {/* Global Modals */}
      <RateEditModal
        isOpen={isRateModalOpen}
        onClose={() => setIsRateModalOpen(false)}
        rates={rates}
        onRatesUpdated={(newRates) => setRates(newRates)}
      />

      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        rates={rates}
        onProductAdded={() => {
          loadRates();
        }}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />

      <PrintTagModal
        isOpen={!!selectedTagProduct}
        onClose={() => setSelectedTagProduct(null)}
        product={selectedTagProduct}
      />

      <PrintInvoiceModal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        invoice={selectedInvoice}
      />

      <VerifyPassportModal
        isOpen={!!verifiedProduct}
        onClose={() => setVerifiedProduct(null)}
        product={verifiedProduct}
        rates={rates}
      />

      <PinAuthModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={() => setIsRateModalOpen(true)}
        title="Owner Rate Update PIN"
        description="Enter your 4-digit Master PIN to update today's live showroom gold & silver rates."
      />

    </div>
  );
}
