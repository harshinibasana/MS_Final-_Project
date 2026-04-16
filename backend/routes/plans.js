const express = require('express');
const router  = express.Router();
const TripPlan = require('../models/TripPlan');
const { protect } = require('../middleware/auth');

// Helper — get a date as a yyyy-MM-dd string safely
function toDateStr(d) {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt)) return null;
  const y  = dt.getUTCFullYear();
  const m  = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

// GET all plans for a trip
router.get('/trip/:tripId', protect, async (req, res) => {
  const plans = await TripPlan.find({ trip: req.params.tripId, user: req.user._id }).sort('date createdAt');
  res.json({ success: true, count: plans.length, plans });
});

// POST create plan — date is required, one plan per date per trip
router.post('/', protect, async (req, res) => {
  const { date, trip, ...rest } = req.body;

  // Date is mandatory
  if (!date) {
    return res.status(400).json({ success: false, message: 'A date is required for every plan' });
  }
  if (!trip) {
    return res.status(400).json({ success: false, message: 'Trip ID is required' });
  }

  const safeDate  = new Date(date + 'T12:00:00.000Z');
  const dateStart = new Date(date + 'T00:00:00.000Z');
  const dateEnd   = new Date(date + 'T23:59:59.999Z');

  // Check if a plan already exists for this date in this trip
  const existing = await TripPlan.findOne({
    trip,
    user: req.user._id,
    date: { $gte: dateStart, $lte: dateEnd },
  });

  if (existing) {
    return res.status(409).json({
      success: false,
      message: `"${existing.title}" is already planned for ${date}. Only one plan per day is allowed. Edit that plan or choose a different date.`,
      existingPlan: { id: existing._id, title: existing.title, date: toDateStr(existing.date) },
    });
  }

  const plan = await TripPlan.create({ ...rest, trip, date: safeDate, user: req.user._id });
  res.status(201).json({ success: true, plan });
});

// PUT update plan — if changing date, block if new date already taken by a DIFFERENT plan
router.put('/:id', protect, async (req, res) => {
  const { date, ...rest } = req.body;
  const update = { ...rest };

  if (date) {
    const safeDate  = new Date(date + 'T12:00:00.000Z');
    const dateStart = new Date(date + 'T00:00:00.000Z');
    const dateEnd   = new Date(date + 'T23:59:59.999Z');

    // Find any other plan on the same date for the same trip
    const existing = await TripPlan.findOne({
      _id: { $ne: req.params.id },      // not the current plan
      user: req.user._id,
      date: { $gte: dateStart, $lte: dateEnd },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `"${existing.title}" is already planned for ${date}. Choose a different date.`,
        existingPlan: { id: existing._id, title: existing.title },
      });
    }

    update.date = safeDate;
  }

  const plan = await TripPlan.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    update,
    { new: true, runValidators: true }
  );
  if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
  res.json({ success: true, plan });
});

// PATCH toggle status
router.patch('/:id/toggle', protect, async (req, res) => {
  const plan = await TripPlan.findOne({ _id: req.params.id, user: req.user._id });
  if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
  plan.status = plan.status === 'completed' ? 'active' : 'completed';
  await plan.save();
  res.json({ success: true, plan });
});

// DELETE plan
router.delete('/:id', protect, async (req, res) => {
  await TripPlan.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  res.json({ success: true });
});

module.exports = router;
