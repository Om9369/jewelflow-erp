import { Employee, SalesInvoice } from '../models/index.js';

export const getEmployeesWithAnalytics = async (req, res) => {
  try {
    const rawEmployees = await Employee.find({ active: 1 }).sort({ _id: 1 });
    const invoices = await SalesInvoice.find();

    const employees = rawEmployees.map((emp, index) => {
      const empInvoices = invoices.filter(inv =>
        (inv.employee_id && inv.employee_id.toString() === emp._id.toString()) ||
        (inv.employee_name && inv.employee_name === emp.name)
      );

      const totalRevenue = empInvoices.reduce((sum, i) => sum + (Number(i.total_amount) || 0), 0);
      const targetRev = emp.target_monthly_revenue || 2000000;
      const targetGrams = emp.target_monthly_grams || 300;
      const revPct = targetRev > 0 ? parseFloat(((totalRevenue / targetRev) * 100).toFixed(1)) : 0;
      const commRate = emp.commission_rate_pct || 1.0;
      const commEarned = Math.round((totalRevenue * commRate) / 100);

      return {
        ...emp.toObject(),
        id: emp._id,
        rank: index + 1,
        targets: {
          monthly_revenue: targetRev,
          monthly_grams: targetGrams
        },
        performance: {
          total_tickets: empInvoices.length,
          total_sales_count: empInvoices.length,
          total_revenue: totalRevenue,
          total_gold_grams: 0,
          commission_rate_pct: commRate,
          commission_earned: commEarned,
          revenue_achievement_pct: revPct,
          grams_achievement_pct: 0,
          performance_grade: revPct >= 100 ? 'A+' : revPct >= 75 ? 'A' : 'B',
          average_ticket_size: empInvoices.length > 0 ? Math.round(totalRevenue / empInvoices.length) : 0,
          top_category: 'Necklaces & Bangles'
        }
      };
    });

    res.json({ success: true, count: employees.length, employees });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findOne({ $or: [{ _id: id }, { phone: id }] });
    if (!employee) return res.status(404).json({ success: false, error: 'Employee not found' });
    res.json({ success: true, employee });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createEmployee = async (req, res) => {
  try {
    const data = req.body;
    const employee = await Employee.create(data);
    res.status(201).json({ success: true, employee });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const updated = await Employee.findByIdAndUpdate(id, data, { new: true });
    res.json({ success: true, employee: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
