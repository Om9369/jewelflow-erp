// Dynamic CDN loader for jsPDF - zero bundle overhead and 100% build stability
let jsPdfLoader = null;

export const loadJsPDF = () => {
  if (typeof window !== 'undefined' && window.jspdf && window.jspdf.jsPDF) {
    return Promise.resolve(window.jspdf.jsPDF);
  }
  if (!jsPdfLoader) {
    jsPdfLoader = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.async = true;
      script.onload = () => {
        if (window.jspdf && window.jspdf.jsPDF) {
          resolve(window.jspdf.jsPDF);
        } else {
          reject(new Error('jsPDF loaded but constructor not found'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load jsPDF library'));
      document.head.appendChild(script);
    });
  }
  return jsPdfLoader;
};

export const generateInvoicePDF = async (invoice) => {
  const JsPDFConstructor = await loadJsPDF();
  const doc = new JsPDFConstructor({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const isWholesale = invoice.type === 'WHOLESALE_CHALLAN';

  // 1. Top Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 32, 'F');

  // Gold accent line
  doc.setFillColor(217, 119, 6); // amber-600
  doc.rect(0, 32, 210, 2, 'F');

  // Brand Name & Subtitle
  doc.setTextColor(254, 243, 199); // amber-100
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('JEWELFLOW FINE JEWELLERS', 14, 12);

  doc.setTextColor(148, 163, 184); // slate-400
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('108, Diamond Heritage Plaza, Zaveri Bazaar, Mumbai - 400002', 14, 18);
  doc.text('Phone: +91 22 2845 9900 | Email: billing@jewelflow.com', 14, 23);
  doc.text('GSTIN: 27AAACS1234M1Z5 | BIS Hallmark No: HM-IND-916001', 14, 28);

  // Invoice Title Badge
  doc.setFillColor(217, 119, 6);
  doc.roundedRect(138, 6, 58, 8, 1.5, 1.5, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(isWholesale ? 'B2B DELIVERY CHALLAN' : 'GST TAX INVOICE & RECEIPT', 167, 11.5, { align: 'center' });

  // Invoice Number & Date
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.text(`Invoice: ${invoice.invoice_no || 'INV-DRAFT'}`, 196, 19, { align: 'right' });
  doc.setTextColor(148, 163, 184);
  doc.text(`Date: ${new Date(invoice.created_at || Date.now()).toLocaleDateString('en-IN')}`, 196, 24, { align: 'right' });
  doc.text(`Sales Exec: ${invoice.employee_name || 'Store Executive'}`, 196, 28.5, { align: 'right' });

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
  doc.text(`Mode: ${invoice.payment_mode || 'UPI / Cash'}`, 110, 48.5);
  doc.setTextColor(16, 185, 129); // emerald-600
  doc.text('Status: PAID & SETTLED', 110, 53);

  // 3. Custom Pure Vector Table
  let curY = 64;
  const startX = 14;
  const tableW = 182;

  // Table Header Row
  doc.setFillColor(15, 23, 42);
  doc.rect(startX, curY, tableW, 8, 'F');
  doc.setTextColor(254, 243, 199);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);

  doc.text('#', startX + 3, curY + 5.5);
  doc.text('Item Description', startX + 12, curY + 5.5);
  doc.text('Purity', startX + 78, curY + 5.5);
  doc.text('Gross Wt', startX + 104, curY + 5.5, { align: 'right' });
  doc.text('Net Wt', startX + 124, curY + 5.5, { align: 'right' });
  doc.text('Rate/g', startX + 144, curY + 5.5, { align: 'right' });
  doc.text('Making', startX + 162, curY + 5.5, { align: 'right' });
  doc.text('Total (Rs)', startX + tableW - 3, curY + 5.5, { align: 'right' });

  curY += 8;

  // Table Body Rows
  const items = (invoice.items && invoice.items.length > 0) ? invoice.items : [
    { title: '22K Gold Jewellery Item', purity: '22K (916)', gross_weight: 15.0, net_weight: 15.0, metal_rate_applied: 6750, making_charge: 6000, total_item_price: 107250 }
  ];

  items.forEach((item, idx) => {
    const rowH = item.huid ? 10 : 7.5;
    
    // Alternating zebra fill
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(startX, curY, tableW, rowH, 'F');
    }

    doc.setDrawColor(226, 232, 240);
    doc.line(startX, curY + rowH, startX + tableW, curY + rowH);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);

    doc.text(String(idx + 1), startX + 3, curY + 5);
    
    doc.setFont('helvetica', 'bold');
    doc.text(item.title.slice(0, 36), startX + 12, curY + (item.huid ? 4 : 5));
    if (item.huid) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`[HUID: ${item.huid}]`, startX + 12, curY + 7.5);
      doc.setFontSize(7.5);
    }

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    doc.text(item.purity || '22K (916)', startX + 78, curY + 5);
    doc.text(`${Number(item.gross_weight || 0).toFixed(3)}g`, startX + 104, curY + 5, { align: 'right' });
    doc.text(`${Number(item.net_weight || 0).toFixed(3)}g`, startX + 124, curY + 5, { align: 'right' });
    doc.text(`${Number(item.metal_rate_applied || 6750).toLocaleString('en-IN')}`, startX + 144, curY + 5, { align: 'right' });
    doc.text(`${Number(item.making_charge || 0).toLocaleString('en-IN')}`, startX + 162, curY + 5, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.text(`Rs. ${Number(item.total_item_price || item.price || 0).toLocaleString('en-IN')}`, startX + tableW - 3, curY + 5, { align: 'right' });

    curY += rowH;
  });

  curY += 4;

  // 4. Old Gold Deduction (if present)
  if (invoice.old_gold && (invoice.old_gold.total_valuation > 0 || invoice.old_gold_deduction > 0)) {
    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(245, 158, 11);
    doc.roundedRect(14, curY, 96, 15, 1.5, 1.5, 'FD');

    doc.setTextColor(146, 64, 14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('OLD GOLD SCRAP EXCHANGE CREDIT', 18, curY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    const ogVal = Number(invoice.old_gold.total_valuation || invoice.old_gold_deduction || 0).toLocaleString('en-IN');
    doc.text(`Received ${invoice.old_gold.net_weight || 0}g (${invoice.old_gold.purity_touch_pct || 87.5}%) @ Rs. ${invoice.old_gold.valuation_rate || 6250}/g`, 18, curY + 8.5);

    doc.setTextColor(16, 185, 129);
    doc.setFont('helvetica', 'bold');
    doc.text(`Deduction Applied: -Rs. ${ogVal}`, 18, curY + 12.5);

    curY += 19;
  }

  // 5. Price Calculations Summary Box
  const calcBoxX = 118;
  const calcBoxW = 78;
  const startCalcY = curY;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(calcBoxX, startCalcY, calcBoxW, 36, 2, 2, 'FD');

  const subtotal = Number(invoice.subtotal || invoice.total_amount || 0).toLocaleString('en-IN');
  const makingCharges = Number(invoice.making_charges_total || invoice.making_charges || 0).toLocaleString('en-IN');
  const gstAmount = Number(invoice.gst_amount || invoice.tax_amount || 0).toLocaleString('en-IN');
  const discount = Number(invoice.discount || 0).toLocaleString('en-IN');
  const netTotal = Number(invoice.total_amount || 0).toLocaleString('en-IN');

  let boxY = startCalcY + 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);

  doc.text('Subtotal (Metal + Stones):', calcBoxX + 4, boxY);
  doc.text(`Rs. ${subtotal}`, calcBoxX + calcBoxW - 4, boxY, { align: 'right' });

  boxY += 5;
  doc.text('Total Making Charges:', calcBoxX + 4, boxY);
  doc.text(`Rs. ${makingCharges}`, calcBoxX + calcBoxW - 4, boxY, { align: 'right' });

  boxY += 5;
  doc.text('GST (3% - 1.5% CGST + 1.5% SGST):', calcBoxX + 4, boxY);
  doc.text(`Rs. ${gstAmount}`, calcBoxX + calcBoxW - 4, boxY, { align: 'right' });

  if (Number(invoice.discount || 0) > 0) {
    boxY += 5;
    doc.setTextColor(225, 29, 72);
    doc.text('Special Discount:', calcBoxX + 4, boxY);
    doc.text(`-Rs. ${discount}`, calcBoxX + calcBoxW - 4, boxY, { align: 'right' });
  }

  // Net Total Bar
  boxY += 7;
  doc.setFillColor(15, 23, 42);
  doc.rect(calcBoxX, boxY - 4, calcBoxW, 9, 'F');
  doc.setTextColor(254, 243, 199);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('NET AMOUNT PAID:', calcBoxX + 4, boxY + 2);
  doc.text(`Rs. ${netTotal}`, calcBoxX + calcBoxW - 4, boxY + 2, { align: 'right' });

  // 6. Guarantee & Signatures
  const termsY = Math.max(startCalcY + 42, boxY + 16);

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('HALLMARK GUARANTEE & TERMS:', 14, termsY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('1. 100% Certified Authentic Gold & Silver certified under BIS Hallmarking Scheme.', 14, termsY + 4);
  doc.text('2. Lifetime buyback/exchange facility available at prevalent daily bullion market rates.', 14, termsY + 7.5);
  doc.text('3. Making charges, stone settings, and statutory taxes are non-refundable upon exchange.', 14, termsY + 11);

  // Signature lines
  const sigY = termsY + 24;
  doc.setDrawColor(148, 163, 184);
  doc.line(18, sigY, 68, sigY);
  doc.line(138, sigY, 188, sigY);

  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Customer Signature', 43, sigY + 4, { align: 'center' });
  doc.text('For JEWELFLOW FINE JEWELLERS', 163, sigY + 4, { align: 'center' });
  doc.setFontSize(6.5);
  doc.text('(Authorized Signatory)', 163, sigY + 7.5, { align: 'center' });

  return doc;
};

// 1-Click Download PDF
export const downloadInvoicePDF = async (invoice) => {
  const doc = await generateInvoicePDF(invoice);
  const fileName = `JewelFlow_Invoice_${invoice.invoice_no || 'BILL'}.pdf`;
  doc.save(fileName);
  return fileName;
};

// 1-Click WhatsApp PDF Sharing Engine
export const shareInvoicePDFOnWhatsApp = async (invoice, customPhone = '') => {
  const doc = await generateInvoicePDF(invoice);
  const fileName = `JewelFlow_Invoice_${invoice.invoice_no || 'BILL'}.pdf`;
  const pdfBlob = doc.output('blob');
  const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

  let phone = (customPhone || invoice.customer_phone || '').replace(/[^0-9]/g, '');
  if (phone.length === 10) phone = '91' + phone;

  const summaryText = `✨ *JEWELFLOW FINE JEWELLERS* ✨\n💎 *Tax Invoice:* ${invoice.invoice_no}\n👤 *Customer:* ${invoice.customer_name}\n💰 *Net Total:* Rs. ${Number(invoice.total_amount || 0).toLocaleString('en-IN')}\n\n📄 *Official GST Tax Invoice PDF attached.*`;

  // Native Web Share with File Attachment (Supported on Android Chrome, iOS Safari, macOS, Windows)
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: `JewelFlow Invoice ${invoice.invoice_no}`,
        text: summaryText,
        files: [file]
      });
      return { success: true, method: 'NATIVE_SHARE' };
    } catch (err) {
      if (err.name === 'AbortError') return { success: false, cancelled: true };
    }
  }

  // Fallback: Download PDF & Open WhatsApp chat
  doc.save(fileName);
  const encodedText = encodeURIComponent(`${summaryText}\n\n(Please find the official PDF downloaded and ready to attach)`);
  const waUrl = phone ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodedText}` : `https://api.whatsapp.com/send?text=${encodedText}`;
  window.open(waUrl, '_blank');
  return { success: true, method: 'DOWNLOAD_AND_CHAT' };
};
