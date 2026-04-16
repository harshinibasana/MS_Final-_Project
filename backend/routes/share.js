const express  = require('express');
const router   = express.Router();
const Trip     = require('../models/Trip');
const Expense  = require('../models/Expense');
const TripPlan = require('../models/TripPlan');
const { protect } = require('../middleware/auth');
const crypto   = require('crypto');

// Generate share token for a trip
router.post('/trip/:id', protect, async (req, res) => {
  const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id });
  if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
  if (!trip.shareToken) {
    trip.shareToken = crypto.randomBytes(16).toString('hex');
    await trip.save();
  }
  res.json({ success: true, shareToken: trip.shareToken, shareUrl: `/shared/${trip.shareToken}` });
});

// Revoke share
router.delete('/trip/:id', protect, async (req, res) => {
  await Trip.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { $unset: { shareToken: 1 } });
  res.json({ success: true });
});

// Public view — no auth needed
router.get('/view/:token', async (req, res) => {
  const trip = await Trip.findOne({ shareToken: req.params.token })
    .populate('user', 'name avatar');
  if (!trip) return res.status(404).json({ success: false, message: 'Share link not found or expired' });
  const [expenses, plans] = await Promise.all([
    Expense.find({ trip: trip._id }).sort('-date').limit(50),
    TripPlan.find({ trip: trip._id }).sort('date'),
  ]);
  const totalSpent = expenses.reduce((s,e) => s + e.amount, 0);
  res.json({ success: true, trip, expenses, plans, totalSpent });
});
module.exports = router;
