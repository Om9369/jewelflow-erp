// Store configuration with local storage persistence and defaults
const DEFAULT_STORE_CONFIG = {
  store_name: 'JEWELFLOW FINE JEWELLERS',
  tagline: 'Jewellery & Bullion Management',
  address: '108, Diamond Heritage Plaza, Zaveri Bazaar, Mumbai - 400002',
  phone: '+91 22 2845 9900',
  email: 'billing@jewelflow.com',
  gstin: '27AAACS1234M1Z5',
  bis_hallmark: 'HM-IND-916001',
  currency_symbol: '₹',
  currency_code: 'INR',
  bank_name: 'HDFC Bank',
  bank_account_no: '50200012345678',
  bank_ifsc: 'HDFC0000128',
  upi_id: 'jewelflow@hdfcbank',
  default_making_charge_pct: 10,
  default_making_charge_min: 450,
  invoice_terms: [
    '1. 100% Certified Authentic Gold & Silver certified under BIS Hallmarking Scheme.',
    '2. Lifetime buyback/exchange facility available at prevalent daily bullion market rates.',
    '3. Making charges, stone settings, and statutory taxes are non-refundable upon exchange.'
  ]
};

const STORAGE_KEY = 'jewelflow_store_config_v1';

export const getStoreConfig = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_STORE_CONFIG, ...JSON.parse(saved) };
    }
  } catch (err) {
    console.error('Error reading store config:', err);
  }
  return DEFAULT_STORE_CONFIG;
};

export const saveStoreConfig = (newConfig) => {
  try {
    const merged = { ...getStoreConfig(), ...newConfig };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    window.dispatchEvent(new Event('store_config_updated'));
    return merged;
  } catch (err) {
    console.error('Error saving store config:', err);
    return DEFAULT_STORE_CONFIG;
  }
};
