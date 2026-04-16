const express = require('express');
const router = express.Router();
const Place = require('../models/Place');
const { protect } = require('../middleware/auth');

router.get('/trip/:tripId', protect, async (req, res) => {
  const places = await Place.find({ trip: req.params.tripId, user: req.user._id }).sort('-createdAt');
  res.json({ success: true, places });
});

router.post('/', protect, async (req, res) => {
  const place = await Place.create({ ...req.body, user: req.user._id });
  res.status(201).json({ success: true, place });
});

router.put('/:id', protect, async (req, res) => {
  const place = await Place.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, req.body, { new: true });
  if (!place) return res.status(404).json({ success: false, message: 'Place not found' });
  res.json({ success: true, place });
});

router.delete('/:id', protect, async (req, res) => {
  await Place.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  res.json({ success: true });
});

module.exports = router;
