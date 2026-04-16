const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');
const Expense = require('../models/Expense');
const { protect } = require('../middleware/auth');
const { upload, cloudinary } = require('../middleware/cloudinary');

// GET all trips for user
router.get('/', protect, async (req, res) => {
  const { status, sort = '-createdAt' } = req.query;
  const filter = { user: req.user._id };
  if (status) filter.status = status;
  const trips = await Trip.find(filter).sort(sort);
  res.json({ success: true, count: trips.length, trips });
});

// GET community trips (all users' trips except own)
router.get('/public/community', protect, async (req, res) => {
  try {
    const { destination, status } = req.query;
    const filter = { user: { $ne: req.user._id } };
    if (status && status !== 'all') filter.status = status;
    else filter.status = { $in: ['completed', 'planning', 'active'] };
    if (destination && destination.trim()) {
      filter.$or = [
        { destination: { $regex: destination.trim(), $options: 'i' } },
        { country: { $regex: destination.trim(), $options: 'i' } },
        { title: { $regex: destination.trim(), $options: 'i' } },
        { tags: { $elemMatch: { $regex: destination.trim(), $options: 'i' } } },
      ];
    }
    const trips = await Trip.find(filter)
      .populate('user', 'name avatar email')
      .sort('-createdAt')
      .limit(60);

    const tripsWithStats = await Promise.all(trips.map(async (t) => {
      const expenses = await Expense.find({ trip: t._id });
      const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
      const byCategory = expenses.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount;
        return acc;
      }, {});
      return { ...t.toJSON(), totalSpent, byCategory, expenseCount: expenses.length };
    }));

    res.json({ success: true, trips: tripsWithStats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single trip
router.get('/:id', protect, async (req, res) => {
  const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id });
  if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
  res.json({ success: true, trip });
});

// GET trip stats
router.get('/:id/stats', protect, async (req, res) => {
  const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id });
  if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
  const expenses = await Expense.find({ trip: req.params.id });
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const byCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});
  res.json({ success: true, stats: { totalBudget: trip.totalBudget, totalSpent, remaining: trip.totalBudget - totalSpent, byCategory, expenseCount: expenses.length } });
});

// POST create trip — block overlapping date ranges
router.post('/', protect, async (req, res) => {
  const { startDate, endDate } = req.body;

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end   = new Date(endDate);

    if (end < start) {
      return res.status(400).json({ success: false, message: 'End date must be after start date' });
    }

    // Check for any existing trip whose dates overlap with the requested range
    // Overlap condition: existing.start <= newEnd AND existing.end >= newStart
    const overlapping = await Trip.findOne({
      user: req.user._id,
      status: { $nin: ['cancelled'] }, // cancelled trips don't block
      startDate: { $lte: end },
      endDate:   { $gte: start },
    });

    if (overlapping) {
      const fmt = d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return res.status(409).json({
        success: false,
        message: `"${overlapping.title}" is already planned from ${fmt(overlapping.startDate)} to ${fmt(overlapping.endDate)}. These dates overlap. Please choose different dates or cancel that trip first.`,
        conflictTrip: {
          id: overlapping._id,
          title: overlapping.title,
          startDate: overlapping.startDate,
          endDate: overlapping.endDate,
          status: overlapping.status,
        },
      });
    }
  }

  const trip = await Trip.create({ ...req.body, user: req.user._id });
  res.status(201).json({ success: true, trip });
});

// PUT update trip — also check for date overlaps when editing
router.put('/:id', protect, async (req, res) => {
  const { startDate, endDate, status } = req.body;

  // Only check overlap if dates are being changed and trip isn't cancelled
  if (startDate && endDate && status !== 'cancelled') {
    const start = new Date(startDate);
    const end   = new Date(endDate);

    const overlapping = await Trip.findOne({
      _id:       { $ne: req.params.id }, // exclude this trip itself
      user:      req.user._id,
      status:    { $nin: ['cancelled'] },
      startDate: { $lte: end },
      endDate:   { $gte: start },
    });

    if (overlapping) {
      const fmt = d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return res.status(409).json({
        success: false,
        message: `"${overlapping.title}" is already planned from ${fmt(overlapping.startDate)} to ${fmt(overlapping.endDate)}. These dates overlap.`,
        conflictTrip: { id: overlapping._id, title: overlapping.title },
      });
    }
  }

  const trip = await Trip.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
  res.json({ success: true, trip });
});

// POST upload cover
router.post('/:id/cover', protect, upload.single('image'), async (req, res) => {
  const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id });
  if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
  if (trip.coverImagePublicId) await cloudinary.uploader.destroy(trip.coverImagePublicId);
  trip.coverImage = req.file.path;
  trip.coverImagePublicId = req.file.filename;
  await trip.save();
  res.json({ success: true, trip });
});

// DELETE trip
router.delete('/:id', protect, async (req, res) => {
  const trip = await Trip.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
  res.json({ success: true, message: 'Trip deleted' });
});

module.exports = router;
