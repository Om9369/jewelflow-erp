import { Customer, SalesInvoice } from '../models/index.js';

export const getCustomers = async (req, res) => {
  try {
    const { search, type } = req.query;
    const filter = {};
    if (type && type !== 'ALL') filter.type = type;
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { name: regex },
        { phone: regex },
        { pan_card: regex },
        { gst_number: regex }
      ];
    }

    const rawCustomers = await Customer.find(filter).sort({ created_at: -1 });
    const invoices = await SalesInvoice.find();

    const customers = rawCustomers.map(cust => {
      const custInvoices = invoices.filter(inv =>
        (inv.customer_id && inv.customer_id.toString() === cust._id.toString()) ||
        (inv.customer_phone && inv.customer_phone === cust.phone)
      );

      const totalPurchases = custInvoices.reduce((sum, i) => sum + (Number(i.total_amount) || 0), 0);
      let totalGoldGrams = 0;
      custInvoices.forEach(inv => {
        (inv.items || []).forEach(it => {
          totalGoldGrams += (Number(it.gross_weight) || 0);
        });
      });

      let vipTier = 'SILVER';
      if (totalPurchases >= 1000000 || totalGoldGrams >= 100) vipTier = 'DIAMOND_VIP';
      else if (totalPurchases >= 500000 || totalGoldGrams >= 50) vipTier = 'PLATINUM';
      else if (totalPurchases >= 200000 || totalGoldGrams >= 20) vipTier = 'GOLD';

      return {
        ...cust.toObject(),
        id: cust._id,
        total_purchases: totalPurchases,
        total_gold_grams: parseFloat(totalGoldGrams.toFixed(3)),
        invoices_count: custInvoices.length,
        vip_tier: vipTier,
        is_kyc_verified: Boolean(cust.pan_card && cust.pan_card.length >= 10)
      };
    });

    res.json({ success: true, count: customers.length, customers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createCustomer = async (req, res) => {
  try {
    const data = req.body;
    const customer = await Customer.create(data);
    res.status(201).json({ success: true, customer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateDealerLedger = async (req, res) => {
  try {
    const { id } = req.params;
    const { fine_gold_delta = 0, cash_delta = 0 } = req.body;

    const updated = await Customer.findByIdAndUpdate(
      id,
      {
        $inc: {
          fine_gold_balance: parseFloat(fine_gold_delta),
          cash_balance: parseFloat(cash_delta)
        }
      },
      { new: true }
    );

    res.json({ success: true, customer: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
