import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Layers,
  Users,
  Menu
} from 'lucide-react';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import RateEditModal from './components/modals/RateEditModal';
import PrintTagModal from './components/modals/PrintTagModal';
import PrintInvoiceModal from './components/modals/PrintInvoiceModal';
import AddProductModal from './components/modals/AddProductModal';
import ShareModal from './components/modals/ShareModal';

import Dashboard from './pages/Dashboard';
import RetailPOS from './pages/RetailPOS';
import WholesalePOS from './pages/WholesalePOS';
import InventoryPage from './pages/InventoryPage';
import EmployeeAnalytics from './pages/EmployeeAnalytics';
import KarigarLedger from './pages/KarigarLedger';
import StockAudit from './pages/StockAudit';
import OldGoldPage from './pages/OldGoldPage';
import ReportsPage from './pages/ReportsPage';

import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeMode, setActiveMode] = useState('RETAIL'); // RETAIL | WHOLESALE
  const [rates, setRates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modals state
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedTagProduct, setSelectedTagProduct] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    loadRates();
  }, []);

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
        onOpenRateModal={() => setIsRateModalOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        onOpenShareModal={() => setIsShareModalOpen(true)}
      />

      {/* Main Container: Sidebar + Page Content */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Responsive Sidebar (Desktop Static + Mobile Drawer) */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          activeMode={activeMode}
          setActiveMode={(mode) => {
            setActiveMode(mode);
            if (mode === 'RETAIL') setActiveTab('retail-pos');
            else setActiveTab('wholesale-pos');
          }}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />

        <main className="flex-1 overflow-y-auto bg-slate-950/60 pb-24 lg:pb-12 w-full max-w-full">
          {activeTab === 'dashboard' && (
            <Dashboard
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenAddModal={() => setIsAddProductOpen(true)}
              onOpenRateModal={() => setIsRateModalOpen(true)}
            />
          )}

          {activeTab === 'retail-pos' && (
            <RetailPOS
              rates={rates}
              onInvoiceCreated={handleInvoiceCreated}
            />
          )}

          {activeTab === 'wholesale-pos' && (
            <WholesalePOS
              rates={rates}
              onInvoiceCreated={handleInvoiceCreated}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryPage
              rates={rates}
              onOpenAddModal={() => setIsAddProductOpen(true)}
              onPrintTag={(product) => setSelectedTagProduct(product)}
            />
          )}

          {activeTab === 'employee-hub' && (
            <EmployeeAnalytics
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'karigar' && (
            <KarigarLedger />
          )}

          {activeTab === 'stock-audit' && (
            <StockAudit />
          )}

          {activeTab === 'old-gold' && (
            <OldGoldPage rates={rates} />
          )}

          {activeTab === 'reports' && (
            <ReportsPage
              onPrintInvoice={(inv) => setSelectedInvoice(inv)}
            />
          )}
        </main>

      </div>

      {/* Mobile Bottom Quick Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-2 py-1.5 flex items-center justify-around text-[10px] font-medium shadow-2xl">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
            activeTab === 'dashboard' ? 'text-amber-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('retail-pos')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
            activeTab === 'retail-pos' ? 'text-amber-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShoppingCart className="w-5 h-5" />
          <span>Billing</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
            activeTab === 'inventory' ? 'text-amber-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span>Catalog</span>
        </button>

        <button
          onClick={() => setActiveTab('employee-hub')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
            activeTab === 'employee-hub' ? 'text-amber-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-5 h-5" />
          <span>Staff</span>
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

    </div>
  );
}
