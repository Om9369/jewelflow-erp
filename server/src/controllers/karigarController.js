import { KarigarOrder } from '../models/index.js';

export const getKarigarOrders = async (req, res) => {
  try {
    const orders = await KarigarOrder.find().sort({ created_at: -1 });
    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createKarigarOrder = async (req, res) => {
  try {
    const data = req.body;
    const orderNo = `KG-2026-${Math.floor(100 + Math.random() * 900)}`;
    const order = await KarigarOrder.create({
      ...data,
      order_no: orderNo,
      status: 'IN_PROGRESS'
    });
    res.status(201).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const receiveKarigarOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { received_weight, received_pieces, notes } = req.body;

    const order = await KarigarOrder.findById(id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    const recWeight = parseFloat(received_weight) || 0;
    const recPieces = parseInt(received_pieces) || 0;
    const diff = parseFloat((recWeight - (order.raw_metal_weight || 0)).toFixed(3));

    order.received_weight = recWeight;
    order.received_pieces = recPieces;
    order.fine_gold_balance_diff = diff;
    order.status = 'COMPLETED';
    if (notes) order.notes = notes;

    await order.save();
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
