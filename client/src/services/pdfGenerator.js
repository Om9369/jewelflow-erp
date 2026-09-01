import { jsPDF } from 'jspdf';
import { getStoreConfig } from './storeConfig';

export const generateInvoicePDF = async (invoice) => {
  const cfg = getStoreConfig();
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const isWholesale = invoice.type === 'WHOLESALE_CHALLAN';
  const isCash = invoice.payment_mode === 'CASH' || invoice.tax_rate === 0 || invoice.gst_amount === 0;

  // 1. Top Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 32, 'F');

  // Gold accent line
  doc.setFillColor(217, 119, 6); // amber-600
  doc.rect(0, 32, 210, 2, 'F');

  // Brand Name & Subtitle
  doc.setTextColor(254, 243, 199); // amber-100
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(cfg.store_name, 14, 12);

  doc.setTextColor(148, 163, 184); // slate-400
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(cfg.address, 14, 17.5);
  doc.text(`Phone: ${cfg.phone} | Email: ${cfg.email}`, 14, 22.5);
  doc.text(`GSTIN: ${cfg.gstin} | BIS Hallmark License: ${cfg.bis_hallmark}`, 14, 27.5);

  // Invoice Title Badge
  doc.setFillColor(217, 119, 6);
  doc.roundedRect(138, 6, 58, 8, 1.5, 1.5, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(isWholesale ? 'B2B DELIVERY CHALLAN' : (isCash ? 'RETAIL CASH ESTIMATE BILL' : 'GST TAX INVOICE & RECEIPT'), 167, 11.5, { align: 'center' });

  // Invoice Number & Date
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.text(`Invoice: ${invoice.invoice_no || 'INV-DRAFT'}`, 196, 19, { align: 'right' });
  doc.setTextColor(148, 163, 184);
  doc.text(`Date: ${new Date(invoice.created_at || Date.now()).toLocaleDateString('en-IN')}`, 196, 24, { align: 'right' });
  doc.text(`Sales Staff: ${invoice.employee_name || 'Store Executive'}`, 196, 28.5, { align: 'right' });

  // 2. Customer Details & Settlement Box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(14, 38, 182, 20, 2, 2, 'FD');

  doc.setTextColor(100, 116, 139); // slate-500
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('BILLED TO / CUSTOMER DETAILS:', 18, 43.5);
  doc.text('PAYMENT & SETTLEMENT:', 110, 43.5);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.text(invoice.customer_name || 'Walk-in Customer', 18, 48.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  if (invoice.customer_phone) doc.text(`Phone: ${invoice.customer_phone}`, 18, 53);

  doc.setFont('helvetica', 'bold');
  doc.text(`Mode: ${invoice.payment_mode || (isCash ? 'CASH' : 'UPI')}`, 110, 48.5);
  doc.setTextColor(16, 185, 129); // emerald-600
  doc.text('Status: PAID & SETTLED', 110, 53);

  // 3. Table Header
  const tableTop = 63;
  doc.setFillColor(15, 23, 42);
  doc.rect(14, tableTop, 182, 7.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);

  doc.text('Sr.', 17, tableTop + 5);
  doc.text('Description / Item Name', 27, tableTop + 5);
  doc.text('HSN', 80, tableTop + 5);
  doc.text('Purity', 94, tableTop + 5);
  doc.text('Gross Wt', 110, tableTop + 5, { align: 'right' });
  doc.text('Net Wt', 128, tableTop + 5, { align: 'right' });
  doc.text('Gold Rate', 148, tableTop + 5, { align: 'right' });
  doc.text('Making', 165, tableTop + 5, { align: 'right' });
  doc.text('Total (Rs.)', 192, tableTop + 5, { align: 'right' });

  // 4. Table Rows
  let currentY = tableTop + 7.5;
  const items = invoice.items && invoice.items.length > 0 ? invoice.items : [invoice];

  items.forEach((item, idx) => {
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.rect(14, currentY, 182, 7.5, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(14, currentY + 7.5, 196, currentY + 7.5);

    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);

    doc.text(`${idx + 1}`, 17, currentY + 5);
    const itemTitle = (item.title || 'Gold Jewellery').slice(0, 28);
    doc.text(itemTitle, 27, currentY + 5);
    doc.text(item.hsn || (item.metal_type === 'Silver' ? '711311' : '711319'), 80, currentY + 5);
    doc.text(item.purity || '22K (916)', 94, currentY + 5);
    doc.text(`${Number(item.gross_weight || item.net_weight || 0).toFixed(3)}g`, 110, currentY + 5, { align: 'right' });
    doc.text(`${Number(item.net_weight || 0).toFixed(3)}g`, 128, currentY + 5, { align: 'right' });
    doc.text(`Rs. ${Number(item.metal_rate_applied || item.rate || 0).toLocaleString('en-IN')}`, 148, currentY + 5, { align: 'right' });
    doc.text(`Rs. ${Number(item.making_charge || 0).toLocaleString('en-IN')}`, 165, currentY + 5, { align: 'right' });
    
    doc.setFont('helvetica', 'bold');
    doc.text(`Rs. ${Number(item.total_item_price || item.total_amount || 0).toLocaleString('en-IN')}`, 192, currentY + 5, { align: 'right' });

    currentY += 7.5;
  });

  // Old Gold Exchange Credit Row (if applicable)
  if (invoice.old_gold_deduction > 0 || (invoice.old_gold && invoice.old_gold.total_valuation > 0)) {
    const ogVal = Number(invoice.old_gold_deduction || invoice.old_gold?.total_valuation || 0);
    const ogWt = Number(invoice.old_gold?.net_weight || 0).toFixed(3);
    
    doc.setFillColor(254, 242, 242); // rose-50
    doc.rect(14, currentY, 182, 7.5, 'F');
    doc.setTextColor(225, 29, 72);
    doc.setFont('helvetica', 'bold');
    doc.text('OLD GOLD SCRAP EXCHANGE DEDUCTION', 27, currentY + 5);
    doc.text(`${ogWt}g`, 128, currentY + 5, { align: 'right' });
    doc.text(`- Rs. ${ogVal.toLocaleString('en-IN')}`, 192, currentY + 5, { align: 'right' });
    currentY += 7.5;
  }

  // 5. Bottom Financial Summary Box
  const summaryBoxY = Math.max(currentY + 6, 120);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(120, summaryBoxY, 76, 38, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(120, summaryBoxY, 76, 38, 2, 2, 'S');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  const taxableVal = Number(invoice.subtotal || invoice.taxable_amount || (invoice.total_amount / (isCash ? 1 : 1.03)));
  const cgstVal = isCash ? 0 : Number(invoice.cgst_amount || ((invoice.total_amount - taxableVal) / 2));
  const sgstVal = isCash ? 0 : Number(invoice.sgst_amount || ((invoice.total_amount - taxableVal) / 2));

  doc.text('Taxable Subtotal:', 124, summaryBoxY + 6);
  doc.text(`Rs. ${Math.round(taxableVal).toLocaleString('en-IN')}`, 192, summaryBoxY + 6, { align: 'right' });

  doc.text(isCash ? 'GST (Cash Exempt - 0%):' : 'CGST (1.5%):', 124, summaryBoxY + 12);
  doc.text(isCash ? 'Rs. 0 (0%)' : `Rs. ${Math.round(cgstVal).toLocaleString('en-IN')}`, 192, summaryBoxY + 12, { align: 'right' });

  doc.text(isCash ? 'Total Taxes:' : 'SGST (1.5%):', 124, summaryBoxY + 18);
  doc.text(isCash ? 'Rs. 0' : `Rs. ${Math.round(sgstVal).toLocaleString('en-IN')}`, 192, summaryBoxY + 18, { align: 'right' });

  // Grand Total Line
  doc.setFillColor(15, 23, 42);
  doc.rect(120, summaryBoxY + 24, 76, 14, 'F');
  doc.setTextColor(254, 243, 199);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('NET PAYABLE:', 124, summaryBoxY + 33);
  doc.text(`Rs. ${Number(invoice.total_amount || 0).toLocaleString('en-IN')}`, 192, summaryBoxY + 33, { align: 'right' });

  // 6. Bank & Payment Info Box on Left
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, summaryBoxY, 100, 38, 2, 2, 'F');
  doc.roundedRect(14, summaryBoxY, 100, 38, 2, 2, 'S');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('SHOWROOM BANK & UPI DETAILS:', 18, summaryBoxY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Bank: ${cfg.bank_name || 'HDFC Bank'}`, 18, summaryBoxY + 13);
  doc.text(`Account No: ${cfg.bank_account_no || '50200012345678'}`, 18, summaryBoxY + 19);
  doc.text(`IFSC Code: ${cfg.bank_ifsc || 'HDFC0000128'}`, 18, summaryBoxY + 25);
  doc.text(`UPI ID (VPA): ${cfg.upi_id || 'jewelflow@upi'}`, 18, summaryBoxY + 31);

  // 7. Terms & Signature
  const termsY = summaryBoxY + 44;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('TERMS & CONDITIONS:', 14, termsY);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('1. 100% Certified Authentic Gold & Silver certified under BIS Hallmarking Scheme.', 14, termsY + 4);
  doc.text('2. Lifetime buyback/exchange facility available at prevalent daily bullion market rates.', 14, termsY + 7.5);
  doc.text('3. Making charges, stone settings, and statutory taxes are non-refundable upon exchange.', 14, termsY + 11);

  // Signature lines
  const sigY = termsY + 22;
  doc.setDrawColor(148, 163, 184);
  doc.line(18, sigY, 68, sigY);
  doc.line(138, sigY, 188, sigY);

  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Customer Signature', 43, sigY + 4, { align: 'center' });
  doc.text(`For ${cfg.store_name}`, 163, sigY + 4, { align: 'center' });
  doc.setFontSize(6.5);
  doc.text('(Authorized Signatory)', 163, sigY + 7.5, { align: 'center' });

  return doc;
};

// 1-Click Direct Download PDF
export const downloadInvoicePDF = async (invoice) => {
  const cfg = getStoreConfig();
  const doc = await generateInvoicePDF(invoice);
  const fileName = `${cfg.store_name.replace(/[^a-zA-Z0-9]/g, '_')}_Invoice_${invoice.invoice_no || 'BILL'}.pdf`;
  doc.save(fileName);
  return fileName;
};

// 1-Click WhatsApp PDF Sharing Engine
export const shareInvoicePDFOnWhatsApp = async (invoice, customPhone = '') => {
  const cfg = getStoreConfig();
  const doc = await generateInvoicePDF(invoice);
  const fileName = `${cfg.store_name.replace(/[^a-zA-Z0-9]/g, '_')}_Invoice_${invoice.invoice_no || 'BILL'}.pdf`;
  
  // 1. Output real PDF Blob & File
  const pdfBlob = doc.output('blob');
  const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

  let phone = (customPhone || invoice.customer_phone || '').replace(/[^0-9]/g, '');
  if (phone.length === 10) phone = '91' + phone;

  const isCash = invoice.payment_mode === 'CASH' || invoice.tax_rate === 0 || invoice.gst_amount === 0;
  const summaryText = `✨ *${cfg.store_name}* ✨\n💎 *${isCash ? 'Retail Cash Estimate Bill' : 'GST Tax Invoice & Receipt'}:* ${invoice.invoice_no}\n📅 *Date:* ${new Date(invoice.created_at || Date.now()).toLocaleDateString('en-IN')}\n👤 *Customer:* ${invoice.customer_name || 'Valued Customer'}\n💰 *Net Total Paid:* Rs. ${Number(invoice.total_amount || 0).toLocaleString('en-IN')} (${invoice.payment_mode || 'Cash'})\n🛡️ *BIS Hallmark License:* ${cfg.bis_hallmark}\n\n📄 *Your Official PDF Bill is attached.* Thank you for shopping with us!`;

  // 2. Native Web Share with direct File Attachment (Works on iOS Safari, Android Chrome, Windows & Mac)
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: `${cfg.store_name} Invoice ${invoice.invoice_no}`,
        text: summaryText,
        files: [file]
      });
      return { success: true, method: 'NATIVE_SHARE' };
    } catch (err) {
      if (err.name === 'AbortError') return { success: false, cancelled: true };
    }
  }

  // 3. Universal Fallback: Download PDF to device + Open WhatsApp with pre-filled summary
  doc.save(fileName);
  const encodedText = encodeURIComponent(`${summaryText}\n\n(Official PDF Bill downloaded to your device)`);
  const waUrl = phone ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodedText}` : `https://api.whatsapp.com/send?text=${encodedText}`;
  window.open(waUrl, '_blank');
  return { success: true, method: 'DOWNLOAD_AND_CHAT' };
};

// ─── Purchase & Inward Settlement Voucher PDF ────────────────────────────────
export const generatePurchaseVoucherPDF = (purchase) => {
  const cfg = getStoreConfig();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const s = purchase.settlement || {};

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 32, 'F');
  doc.setFillColor(217, 119, 6);
  doc.rect(0, 32, 210, 2, 'F');

  doc.setTextColor(254, 243, 199);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(cfg.store_name, 14, 12);

  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(cfg.address, 14, 17.5);
  doc.text(`Phone: ${cfg.phone} | Email: ${cfg.email}`, 14, 22.5);
  doc.text(`GSTIN: ${cfg.gstin}`, 14, 27.5);

  doc.setFillColor(217, 119, 6);
  doc.roundedRect(130, 6, 66, 8, 1.5, 1.5, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('INWARD PURCHASE VOUCHER', 163, 11.5, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.text(`Voucher: ${purchase.voucher_no || purchase.id}`, 196, 19, { align: 'right' });
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);
  doc.text(`Ref ID: ${purchase.id}`, 196, 24, { align: 'right' });
  doc.text(`Date: ${purchase.date}`, 196, 28.5, { align: 'right' });

  // Supplier Info
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 38, 182, 18, 2, 2, 'FD');
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('SUPPLIER / VENDOR DETAILS:', 18, 43.5);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9.5);
  doc.text(purchase.supplier_name || 'Supplier', 18, 49);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Inward Date: ${purchase.date}`, 18, 54);

  const isSettled = purchase.status === 'SETTLED';
  doc.setFillColor(isSettled ? 16 : 185, isSettled ? 185 : 28, isSettled ? 129 : 28);
  doc.roundedRect(152, 39, 40, 8, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(isSettled ? 'FULLY SETTLED' : 'PARTIAL DUE', 172, 44.2, { align: 'center' });

  // Items Table
  let y = 62;
  doc.setFillColor(15, 23, 42);
  doc.rect(14, y, 182, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('ITEMS INWARDED', 18, y + 5);
  doc.text('GROSS WT', 102, y + 5, { align: 'right' });
  doc.text('NET WT', 127, y + 5, { align: 'right' });
  doc.text('FINE GOLD', 155, y + 5, { align: 'right' });
  doc.text('AMOUNT (Rs.)', 194, y + 5, { align: 'right' });

  y += 7;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(14, y, 182, 10, 'FD');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(purchase.items_summary || 'Jewellery Inward', 18, y + 7);
  doc.text(`${Number(purchase.total_gross_weight || 0).toFixed(3)}g`, 102, y + 7, { align: 'right' });
  doc.text(`${Number(purchase.total_net_weight || 0).toFixed(3)}g`, 127, y + 7, { align: 'right' });
  doc.text(`${Number(purchase.total_fine_gold_grams || 0).toFixed(3)}g`, 155, y + 7, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.text(`Rs.${Number(purchase.subtotal_inr || 0).toLocaleString('en-IN')}`, 194, y + 7, { align: 'right' });

  y += 10;
  doc.setFillColor(255, 255, 255);
  doc.rect(14, y, 182, 8, 'FD');
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Making / Labour Charges:', 18, y + 5.5);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(`Rs.${Number(purchase.making_charges_inr || 0).toLocaleString('en-IN')}`, 194, y + 5.5, { align: 'right' });

  y += 8;
  doc.setFillColor(217, 119, 6);
  doc.rect(14, y, 182, 9, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('TOTAL PURCHASE BILL:', 18, y + 6.5);
  doc.text(`Rs.${Number(purchase.total_amount_inr || 0).toLocaleString('en-IN')}`, 194, y + 6.5, { align: 'right' });

  // Settlement Breakdown
  y += 16;
  doc.setFillColor(15, 23, 42);
  doc.rect(14, y, 182, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('MULTI-SPLIT PAYMENT SETTLEMENT BREAKDOWN', 18, y + 5);

  const rows = [
    ['Cash Paid:', `Rs.${Number(s.cash_paid || 0).toLocaleString('en-IN')}`],
    ['RTGS / Bank Transfer:', `Rs.${Number(s.rtgs_paid || 0).toLocaleString('en-IN')}${s.rtgs_ref ? '  UTR: ' + s.rtgs_ref : ''}`],
    ['Pure Fine Metal Given:', `${Number(s.fine_metal_grams_given || 0).toFixed(3)}g  =  Rs.${Number(s.fine_metal_valuation_inr || 0).toLocaleString('en-IN')}`],
    ['Old Gold / Scrap Given:', `${Number(s.old_gold_grams_given || 0).toFixed(3)}g  =  Rs.${Number(s.old_gold_valuation_inr || 0).toLocaleString('en-IN')}`],
    ['Advance / Credit Adjusted:', `Rs.${Number(s.advance_adjusted || 0).toLocaleString('en-IN')}`],
  ];

  y += 7;
  rows.forEach((row, i) => {
    doc.setFillColor(i % 2 === 0 ? 248 : 255, i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 252 : 255);
    doc.setDrawColor(226, 232, 240);
    doc.rect(14, y, 182, 8, 'FD');
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(row[0], 18, y + 5.5);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(row[1], 194, y + 5.5, { align: 'right' });
    y += 8;
  });

  const pending = Number(s.remaining_balance_due || 0);
  if (pending > 0) {
    doc.setFillColor(254, 226, 226);
    doc.setDrawColor(239, 68, 68);
  } else {
    doc.setFillColor(220, 252, 231);
    doc.setDrawColor(34, 197, 94);
  }
  doc.rect(14, y, 182, 10, 'FD');
  doc.setTextColor(pending > 0 ? 185 : 22, pending > 0 ? 28 : 163, pending > 0 ? 28 : 74);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  if (pending > 0) {
    doc.text('BALANCE DUE TO SUPPLIER:', 18, y + 7);
    doc.text(`Rs.${pending.toLocaleString('en-IN')}`, 194, y + 7, { align: 'right' });
  } else {
    doc.text('FULLY SETTLED — NO BALANCE DUE', 105, y + 7, { align: 'center' });
  }

  // Footer
  y += 18;
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('This voucher is an internal stock inward and payment settlement record.', 14, y);
  doc.text('Weights weighed at time of inward. Discrepancy must be raised within 24 hours.', 14, y + 4.5);

  const sigY = y + 16;
  doc.setDrawColor(148, 163, 184);
  doc.line(18, sigY, 68, sigY);
  doc.line(138, sigY, 188, sigY);
  doc.setFontSize(7);
  doc.text('Supplier / Vendor Signature', 43, sigY + 4, { align: 'center' });
  doc.text(`For ${cfg.store_name}`, 163, sigY + 4, { align: 'center' });
  doc.setFontSize(6.5);
  doc.text('(Authorized Signatory)', 163, sigY + 7.5, { align: 'center' });

  return doc;
};

export const downloadPurchaseVoucherPDF = (purchase) => {
  const cfg = getStoreConfig();
  const doc = generatePurchaseVoucherPDF(purchase);
  const fileName = `${cfg.store_name.replace(/[^a-zA-Z0-9]/g, '_')}_PurchaseVoucher_${purchase.voucher_no || purchase.id}.pdf`;
  doc.save(fileName);
  return fileName;
};

export const sharePurchaseVoucherOnWhatsApp = async (purchase, supplierPhone = '') => {
  const cfg = getStoreConfig();
  const doc = generatePurchaseVoucherPDF(purchase);
  const s = purchase.settlement || {};
  const fileName = `${cfg.store_name.replace(/[^a-zA-Z0-9]/g, '_')}_PurchaseVoucher_${purchase.voucher_no || purchase.id}.pdf`;

  const pdfBlob = doc.output('blob');
  const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

  let phone = (supplierPhone || '').replace(/[^0-9]/g, '');
  if (phone.length === 10) phone = '91' + phone;

  const pending = Number(s.remaining_balance_due || 0);
  const summaryText =
    `📦 *${cfg.store_name}* — Purchase Voucher\n` +
    `📄 Voucher: *${purchase.voucher_no}* | Ref: ${purchase.id}\n` +
    `📅 Date: ${purchase.date}\n` +
    `🏢 Supplier: ${purchase.supplier_name}\n` +
    `💍 Items: ${purchase.items_summary}\n` +
    `⚖️ Gross: ${purchase.total_gross_weight}g | Net: ${purchase.total_net_weight}g | Fine: ${purchase.total_fine_gold_grams}g\n` +
    `💰 Total Bill: Rs.${Number(purchase.total_amount_inr || 0).toLocaleString('en-IN')}\n\n` +
    `--- Settlement ---\n` +
    `💵 Cash: Rs.${Number(s.cash_paid || 0).toLocaleString('en-IN')}\n` +
    `🏦 RTGS: Rs.${Number(s.rtgs_paid || 0).toLocaleString('en-IN')}${s.rtgs_ref ? ' (' + s.rtgs_ref + ')' : ''}\n` +
    `🪙 Fine Metal: ${Number(s.fine_metal_grams_given || 0).toFixed(3)}g = Rs.${Number(s.fine_metal_valuation_inr || 0).toLocaleString('en-IN')}\n` +
    `♻️ Old Gold: ${Number(s.old_gold_grams_given || 0).toFixed(3)}g = Rs.${Number(s.old_gold_valuation_inr || 0).toLocaleString('en-IN')}\n` +
    (pending > 0 ? `⚠️ *Balance Due: Rs.${pending.toLocaleString('en-IN')}*` : `✅ *Fully Settled — No Balance Due*`);

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ title: `Purchase Voucher — ${purchase.voucher_no}`, text: summaryText, files: [file] });
      return { success: true, method: 'NATIVE_SHARE' };
    } catch (err) {
      if (err.name === 'AbortError') return { success: false, cancelled: true };
    }
  }

  doc.save(fileName);
  const encoded = encodeURIComponent(`${summaryText}\n\n(Official PDF Voucher downloaded to your device)`);
  const waUrl = phone
    ? `https://api.whatsapp.com/send?phone=${phone}&text=${encoded}`
    : `https://api.whatsapp.com/send?text=${encoded}`;
  window.open(waUrl, '_blank');
  return { success: true, method: 'DOWNLOAD_AND_CHAT' };
};
