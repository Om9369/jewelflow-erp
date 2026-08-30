import React, { useState, useEffect } from 'react';
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
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

        <main className="flex-1 overflow-y-auto bg-slate-950/60 pb-16 w-full">
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
