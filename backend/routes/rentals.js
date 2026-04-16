const express = require('express');
const router = express.Router();
const CarRental = require('../models/CarRental');
const { protect } = require('../middleware/auth');

router.get('/trip/:tripId', protect, async (req, res) => {
  const rentals = await CarRental.find({ trip: req.params.tripId, user: req.user._id }).sort('-createdAt');
  res.json({ success: true, rentals });
});

router.post('/', protect, async (req, res) => {
  const rental = await CarRental.create({ ...req.body, user: req.user._id });
  res.status(201).json({ success: true, rental });
});

router.put('/:id', protect, async (req, res) => {
  const rental = await CarRental.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, req.body, { new: true });
  if (!rental) return res.status(404).json({ success: false, message: 'Rental not found' });
  res.json({ success: true, rental });
});

router.delete('/:id', protect, async (req, res) => {
  await CarRental.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  res.json({ success: true });
});

module.exports = router;
