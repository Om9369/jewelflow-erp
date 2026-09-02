import mongoose from 'mongoose';
import { MetalRate } from '../models/index.js';

export const getRates = async (req, res) => {
  try {
    const rates = await MetalRate.find().sort({ _id: 1 });
    res.json({ success: true, rates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateRate = async (req, res) => {
  try {
    const { id } = req.params;
    const { rate_per_gram } = req.body;

    if (!rate_per_gram) {
      return res.status(400).json({ success: false, error: 'rate_per_gram is required' });
    }

    const query = mongoose.isValidObjectId(id) ? { _id: id } : { id: parseInt(id) || 0 };
    const updated = await MetalRate.findOneAndUpdate(
      query,
      { rate_per_gram: parseFloat(rate_per_gram), updated_at: new Date() },
      { new: true }
    );

    res.json({ success: true, rate: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const bulkUpdateRates = async (req, res) => {
  try {
    const { rates } = req.body;
    if (!Array.isArray(rates)) {
      return res.status(400).json({ success: false, error: 'Rates array is required' });
    }

    for (const r of rates) {
      const filter = [];
      if (r._id && mongoose.isValidObjectId(r._id)) filter.push({ _id: r._id });
      if (r.id) filter.push({ id: r.id });
      if (r.metal && r.purity) filter.push({ metal: r.metal, purity: r.purity });

      if (filter.length > 0) {
        await MetalRate.updateOne(
          { $or: filter },
          { rate_per_gram: parseFloat(r.rate_per_gram) || 0, updated_at: new Date() }
        );
      }
    }

    const updatedRates = await MetalRate.find().sort({ _id: 1 });
    res.json({ success: true, count: rates.length, rates: updatedRates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
