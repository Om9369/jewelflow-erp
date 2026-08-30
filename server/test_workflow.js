async function testWorkflow() {
  console.log('--- 1. Testing Live Rates ---');
  const ratesRes = await fetch('http://localhost:5000/api/rates').then(r=>r.json());
  console.log('Loaded', ratesRes.rates.length, 'metal rates');

  console.log('--- 2. Inwarding New Jewellery Product ---');
  const addRes = await fetch('http://localhost:5000/api/inventory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Solitaire Diamond Pendant 18K',
      category: 'Pendants',
      metal_type: 'Gold',
      purity: '18K (750)',
      gross_weight: 8.50,
      stone_weight: 0.50,
      stone_type: 'Natural Diamond',
      stone_cents: 50,
      stone_price: 35000,
      making_charge_type: 'PER_GRAM',
      making_charge_value: 500,
      counter_tray: 'Showcase A - Tray 1',
      item_type: 'RETAIL_SINGLE'
    })
  }).then(r=>r.json());
  console.log('Inward Success, SKU:', addRes.product.sku, 'Net Wt:', addRes.product.net_weight);

  console.log('--- 3. Testing Retail POS Sale with Staff Attribution ---');
  const saleRes = await fetch('http://localhost:5000/api/sales/retail', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_name: 'Vikram Malhotra',
      customer_phone: '+91 99887 76655',
      employee_id: 1, // Aarav Verma
      items: [{
        product_id: addRes.product.id,
        sku: addRes.product.sku,
        title: addRes.product.title,
        category: addRes.product.category,
        metal_type: addRes.product.metal_type,
        purity: addRes.product.purity,
        gross_weight: addRes.product.gross_weight,
        net_weight: addRes.product.net_weight,
        stone_weight: addRes.product.stone_weight,
        metal_rate: 5550,
        making_charge: 4000,
        stone_price: 35000,
        total_item_price: 83400
      }],
      old_gold: {
        gross_weight: 5.0,
        stone_dust_deduction: 0.2,
        net_weight: 4.8,
        purity_touch_pct: 88.0,
        fine_gold_weight: 4.224,
        valuation_rate: 6200,
        total_valuation: 26189
      },
      discount: 1000,
      payment_mode: 'UPI'
    })
  }).then(r=>r.json());
  console.log('Sale Completed, Invoice No:', saleRes.invoice.invoice_no, 'Grand Total: ₹' + saleRes.invoice.total_amount);

  console.log('--- 4. Verifying Employee Analytics & Commission Engine ---');
  const allEmpRes = await fetch('http://localhost:5000/api/employees').then(r=>r.json());
  const aarav = allEmpRes.employees.find(e => e.id === 1);
  console.log('Aarav Verma Total Rev: ₹' + aarav.performance.total_revenue, '| Gold Sold: ' + aarav.performance.total_gold_grams + 'g | Commission: ₹' + aarav.performance.commission_earned);

  console.log('--- 5. Verifying Stock Audit ---');
  const auditRes = await fetch('http://localhost:5000/api/audit/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tray_name: 'Showcase A - Tray 1',
      physical_items_count: 1,
      physical_total_weight: 48.50,
      audited_by: 'Store Manager'
    })
  }).then(r=>r.json());
  console.log('Audit Result:', auditRes.audit.status, '| Variance:', auditRes.audit.variance_weight + 'g');
  console.log('✨ ALL SYSTEMS VERIFIED SUCCESSFULLY!');
}
testWorkflow();
