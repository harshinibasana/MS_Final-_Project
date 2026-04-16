const express = require('express');
const router  = express.Router();
const MiscAmount = require('../models/MiscAmount');
const { protect } = require('../middleware/auth');

const parseDate = (dateStr) => {
  if (!dateStr) return new Date();
  if (dateStr.includes('T')) return new Date(dateStr);
  return new Date(dateStr + 'T12:00:00.000Z');
};

router.get('/trip/:tripId', protect, async (req, res) => {
  const items = await MiscAmount.find({ trip: req.params.tripId, user: req.user._id }).sort('-date');
  const total = items.reduce((s, i) => s + i.amount, 0);
  res.json({ success: true, count: items.length, total, items });
});

router.get('/trip/:tripId/summary', protect, async (req, res) => {
  const items = await MiscAmount.find({ trip: req.params.tripId, user: req.user._id });
  const byType = items.reduce((acc, i) => { acc[i.type] = (acc[i.type] || 0) + i.amount; return acc; }, {});
  const total  = items.reduce((s, i) => s + i.amount, 0);
  res.json({ success: true, total, byType, count: items.length });
});

router.post('/', protect, async (req, res) => {
  const { amount, date, ...rest } = req.body;
  const parsedAmount = parseFloat(String(amount).replace(/[^0-9.]/g, ''));
  if (isNaN(parsedAmount) || parsedAmount < 0)
    return res.status(400).json({ success: false, message: 'Invalid amount' });
  const item = await MiscAmount.create({
    ...rest, amount: parsedAmount, date: parseDate(date), user: req.user._id,
  });
  res.status(201).json({ success: true, item });
});

router.put('/:id', protect, async (req, res) => {
  const { amount, date, ...rest } = req.body;
  const update = { ...rest };
  if (amount !== undefined) {
    const parsed = parseFloat(String(amount).replace(/[^0-9.]/g, ''));
    if (isNaN(parsed)) return res.status(400).json({ success: false, message: 'Invalid amount' });
    update.amount = parsed;
  }
  if (date) update.date = parseDate(date);
  const item = await MiscAmount.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { $set: update },
    { new: true, runValidators: true }
  );
  if (!item) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, item });
});

router.delete('/:id', protect, async (req, res) => {
  await MiscAmount.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  res.json({ success: true });
});

module.exports = router;
