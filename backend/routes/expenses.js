const express = require('express');
const router  = express.Router();
const Expense = require('../models/Expense');
const { protect } = require('../middleware/auth');

// Helper: parse a date string "yyyy-MM-dd" into a Date stored at noon UTC
// This guarantees the date never shifts by timezone when reading back
const parseDate = (dateStr) => {
  if (!dateStr) return new Date();
  // Already an ISO string with time
  if (dateStr.includes('T')) return new Date(dateStr);
  // yyyy-MM-dd  → store at noon UTC so .slice(0,10) always gives back the right date
  return new Date(dateStr + 'T12:00:00.000Z');
};

// GET expenses for a trip — sorted by date descending
router.get('/trip/:tripId', protect, async (req, res) => {
  const expenses = await Expense.find({ trip: req.params.tripId, user: req.user._id }).sort('-date');
  res.json({ success: true, count: expenses.length, expenses });
});

// POST create expense
router.post('/', protect, async (req, res) => {
  const { amount, date, ...rest } = req.body;
  const parsedAmount = parseFloat(String(amount).replace(/[^0-9.]/g, ''));
  if (isNaN(parsedAmount) || parsedAmount < 0)
    return res.status(400).json({ success: false, message: 'Invalid amount' });
  const expense = await Expense.create({
    ...rest,
    amount: parsedAmount,
    date: parseDate(date),
    user: req.user._id,
  });
  res.status(201).json({ success: true, expense });
});

// PUT update expense
router.put('/:id', protect, async (req, res) => {
  const { amount, date, ...rest } = req.body;
  const update = { ...rest };
  if (amount !== undefined) {
    const parsed = parseFloat(String(amount).replace(/[^0-9.]/g, ''));
    if (isNaN(parsed) || parsed < 0)
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    update.amount = parsed;
  }
  if (date) update.date = parseDate(date);
  const expense = await Expense.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { $set: update },
    { new: true, runValidators: true }
  );
  if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
  res.json({ success: true, expense });
});

// DELETE
router.delete('/:id', protect, async (req, res) => {
  await Expense.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  res.json({ success: true, message: 'Expense deleted' });
});

module.exports = router;
