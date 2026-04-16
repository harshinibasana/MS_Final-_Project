const express = require('express');
const router = express.Router();
const HotelBooking = require('../models/HotelBooking');
const { protect } = require('../middleware/auth');

// GET all hotel bookings for a trip
router.get('/trip/:tripId', protect, async (req, res) => {
  const bookings = await HotelBooking.find({ trip: req.params.tripId, user: req.user._id }).sort('-checkIn');
  res.json({ success: true, count: bookings.length, bookings });
});

// GET all hotel bookings for user (across all trips)
router.get('/my', protect, async (req, res) => {
  const bookings = await HotelBooking.find({ user: req.user._id }).populate('trip', 'title destination').sort('-checkIn');
  res.json({ success: true, bookings });
});

// GET single booking
router.get('/:id', protect, async (req, res) => {
  const booking = await HotelBooking.findOne({ _id: req.params.id, user: req.user._id }).populate('trip', 'title');
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
  res.json({ success: true, booking });
});

// POST create booking
router.post('/', protect, async (req, res) => {
  const nights = Math.ceil((new Date(req.body.checkOut) - new Date(req.body.checkIn)) / (1000 * 60 * 60 * 24));
  const totalPrice = req.body.totalPrice || (req.body.pricePerNight * nights * (req.body.rooms || 1));

  const booking = await HotelBooking.create({
    ...req.body,
    user: req.user._id,
    totalPrice,
  });
  res.status(201).json({ success: true, booking });
});

// PUT update booking
router.put('/:id', protect, async (req, res) => {
  const booking = await HotelBooking.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { ...req.body, updatedAt: Date.now() },
    { new: true }
  );
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
  res.json({ success: true, booking });
});

// PUT update status only
router.patch('/:id/status', protect, async (req, res) => {
  const booking = await HotelBooking.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { status: req.body.status },
    { new: true }
  );
  res.json({ success: true, booking });
});

// DELETE booking
router.delete('/:id', protect, async (req, res) => {
  await HotelBooking.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  res.json({ success: true, message: 'Booking deleted' });
});

module.exports = router;
