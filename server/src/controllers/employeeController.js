import db from '../database.js';

export const getEmployeesWithAnalytics = (req, res) => {
  try {
    const employees = db.prepare('SELECT * FROM employees ORDER BY id ASC').all();
    const invoices = db.prepare('SELECT * FROM sales_invoices').all();
    const salesItems = db.prepare('SELECT * FROM sales_items').all();

    // Map sales items to invoices
    const invoiceItemsMap = {};
    salesItems.forEach(item => {
      if (!invoiceItemsMap[item.invoice_id]) {
        invoiceItemsMap[item.invoice_id] = [];
      }
      invoiceItemsMap[item.invoice_id].push(item);
    });

    const analytics = employees.map(emp => {
      const empInvoices = invoices.filter(inv => inv.employee_id === emp.id);

      let totalRevenue = 0;
      let retailRevenue = 0;
      let wholesaleRevenue = 0;
      let totalGoldGrams = 0;
      let totalSilverGrams = 0;
      let totalDiamondCarats = 0;
      let totalItemsCount = 0;

      const categorySales = {};

      empInvoices.forEach(inv => {
        totalRevenue += inv.total_amount || 0;
        if (inv.type === 'WHOLESALE_CHALLAN') {
          wholesaleRevenue += inv.total_amount || 0;
        } else {
          retailRevenue += inv.total_amount || 0;
        }

        const items = invoiceItemsMap[inv.id] || [];
        items.forEach(it => {
          totalItemsCount += (it.pieces || 1);
          if (it.metal_type === 'Gold') {
            totalGoldGrams += (it.gross_weight || 0);
          } else if (it.metal_type === 'Silver') {
            totalSilverGrams += (it.gross_weight || 0);
          }

          if (it.category === 'Diamonds' || (it.purity && it.purity.includes('18K'))) {
            // Estimate or check stone weight
            totalDiamondCarats += ((it.stone_weight || 0) * 5); // grams to cts approx if stone wt present
          }

          categorySales[it.category] = (categorySales[it.category] || 0) + (it.total_item_price || 0);
        });
      });

      // Targets and achievements
      const targetRev = emp.target_monthly_revenue || 2000000;
      const targetGrams = emp.target_monthly_grams || 300;

      const revAchievementPct = targetRev > 0 ? Math.min(200, parseFloat(((totalRevenue / targetRev) * 100).toFixed(1))) : 0;
      const gramsAchievementPct = targetGrams > 0 ? Math.min(200, parseFloat(((totalGoldGrams / targetGrams) * 100).toFixed(1))) : 0;

      // Base commission calculation
      const commRate = emp.commission_rate_pct || 1.0;
      const baseCommission = (totalRevenue * commRate) / 100;
      // Bonus incentive for exceeding 100% target
      const bonus = revAchievementPct >= 100 ? ((totalRevenue - targetRev) * (commRate * 0.5)) / 100 : 0;
      const totalCommission = Math.round(baseCommission + Math.max(0, bonus));

      // Find top selling category
      let topCategory = 'None';
      let maxCatRevenue = 0;
      for (const [cat, val] of Object.entries(categorySales)) {
        if (val > maxCatRevenue) {
          maxCatRevenue = val;
          topCategory = cat;
        }
      }

      const avgOrderValue = empInvoices.length > 0 ? Math.round(totalRevenue / empInvoices.length) : 0;

      return {
        id: emp.id,
        name: emp.name,
        email: emp.email,
        phone: emp.phone,
        role: emp.role,
        avatar_color: emp.avatar_color,
        active: emp.active,
        targets: {
          monthly_revenue: targetRev,
          monthly_grams: targetGrams
        },
        performance: {
          total_revenue: Math.round(totalRevenue),
          retail_revenue: Math.round(retailRevenue),
          wholesale_revenue: Math.round(wholesaleRevenue),
          total_gold_grams: parseFloat(totalGoldGrams.toFixed(2)),
          total_silver_grams: parseFloat(totalSilverGrams.toFixed(2)),
          total_diamond_carats: parseFloat(totalDiamondCarats.toFixed(2)),
          total_tickets: empInvoices.length,
          total_items_sold: totalItemsCount,
          average_ticket_size: avgOrderValue,
          top_category: topCategory,
          revenue_achievement_pct: revAchievementPct,
          grams_achievement_pct: gramsAchievementPct,
          commission_earned: totalCommission,
          commission_rate_pct: commRate,
          performance_grade: revAchievementPct >= 110 ? 'A+' : (revAchievementPct >= 80 ? 'A' : (revAchievementPct >= 50 ? 'B' : 'Needs Focus'))
        },
        recent_sales: empInvoices.slice(0, 5)
      };
    });

    // Rank employees by revenue for leaderboard
    analytics.sort((a, b) => b.performance.total_revenue - a.performance.total_revenue);

    const enrichedWithRank = analytics.map((emp, index) => ({
      ...emp,
      rank: index + 1
    }));

    res.json({ success: true, count: enrichedWithRank.length, employees: enrichedWithRank });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getEmployeeById = (req, res) => {
  try {
    const { id } = req.params;
    const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
    if (!emp) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    const invoices = db.prepare('SELECT * FROM sales_invoices WHERE employee_id = ? ORDER BY created_at DESC').all(id);
    const enrichedInvoices = invoices.map(inv => {
      const items = db.prepare('SELECT * FROM sales_items WHERE invoice_id = ?').all(inv.id);
      return { ...inv, items };
    });

    res.json({ success: true, employee: emp, sales_history: enrichedInvoices });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createEmployee = (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      role = 'SALES_EXECUTIVE',
      target_monthly_revenue = 2000000,
      target_monthly_grams = 300,
      commission_rate_pct = 1.0,
      avatar_color = '#D97706'
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, error: 'Employee name and phone are required' });
    }

    const result = db.prepare(`
      INSERT INTO employees (name, email, phone, role, target_monthly_revenue, target_monthly_grams, commission_rate_pct, avatar_color)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name, email || '', phone, role,
      parseFloat(target_monthly_revenue) || 2000000,
      parseFloat(target_monthly_grams) || 300,
      parseFloat(commission_rate_pct) || 1.0,
      avatar_color
    );

    const created = db.prepare('SELECT * FROM employees WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, employee: created });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateEmployee = (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      role,
      target_monthly_revenue,
      target_monthly_grams,
      commission_rate_pct,
      avatar_color,
      active
    } = req.body;

    const stmt = db.prepare(`
      UPDATE employees SET
        name = COALESCE(?, name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        role = COALESCE(?, role),
        target_monthly_revenue = COALESCE(?, target_monthly_revenue),
        target_monthly_grams = COALESCE(?, target_monthly_grams),
        commission_rate_pct = COALESCE(?, commission_rate_pct),
        avatar_color = COALESCE(?, avatar_color),
        active = COALESCE(?, active)
      WHERE id = ?
    `);

    stmt.run(
      name, email, phone, role,
      target_monthly_revenue !== undefined ? parseFloat(target_monthly_revenue) : null,
      target_monthly_grams !== undefined ? parseFloat(target_monthly_grams) : null,
      commission_rate_pct !== undefined ? parseFloat(commission_rate_pct) : null,
      avatar_color,
      active !== undefined ? (active ? 1 : 0) : null,
      id
    );

    const updated = db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
    res.json({ success: true, employee: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
