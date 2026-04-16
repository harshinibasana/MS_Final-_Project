const express = require('express');
const router  = express.Router();
const JournalEntry = require('../models/JournalEntry');
const { protect }  = require('../middleware/auth');

router.get('/trip/:tripId', protect, async (req, res) => {
  const entries = await JournalEntry.find({ trip: req.params.tripId, user: req.user._id }).sort('date');
  res.json({ success: true, entries });
});

router.post('/', protect, async (req, res) => {
  const { date, trip, ...rest } = req.body;
  const safeDate = new Date(date + 'T12:00:00.000Z');
  const entry = await JournalEntry.create({ ...rest, trip, date: safeDate, user: req.user._id });
  res.status(201).json({ success: true, entry });
});

router.put('/:id', protect, async (req, res) => {
  const { date, ...rest } = req.body;
  const update = { ...rest };
  if (date) update.date = new Date(date + 'T12:00:00.000Z');
  const entry = await JournalEntry.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id }, { $set: update }, { new: true }
  );
  if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });
  res.json({ success: true, entry });
});

router.delete('/:id', protect, async (req, res) => {
  await JournalEntry.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  res.json({ success: true });
});
module.exports = router;
