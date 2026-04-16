const express = require('express');
const router  = express.Router();
const PackingItem = require('../models/PackingItem');
const { protect } = require('../middleware/auth');

router.get('/trip/:tripId', protect, async (req, res) => {
  const items = await PackingItem.find({ trip: req.params.tripId, user: req.user._id }).sort('category name');
  res.json({ success: true, items });
});

router.post('/', protect, async (req, res) => {
  const item = await PackingItem.create({ ...req.body, user: req.user._id });
  res.status(201).json({ success: true, item });
});

// Bulk template
router.post('/template/:tripId', protect, async (req, res) => {
  const templates = [
    { name:'Passport', category:'documents', quantity:1 },
    { name:'Travel Insurance', category:'documents', quantity:1 },
    { name:'Flight Tickets', category:'documents', quantity:1 },
    { name:'Hotel Booking', category:'documents', quantity:1 },
    { name:'T-Shirts', category:'clothing', quantity:5 },
    { name:'Pants', category:'clothing', quantity:3 },
    { name:'Underwear', category:'clothing', quantity:7 },
    { name:'Socks', category:'clothing', quantity:7 },
    { name:'Jacket', category:'clothing', quantity:1 },
    { name:'Comfortable Shoes', category:'clothing', quantity:1 },
    { name:'Toothbrush', category:'toiletries', quantity:1 },
    { name:'Toothpaste', category:'toiletries', quantity:1 },
    { name:'Shampoo', category:'toiletries', quantity:1 },
    { name:'Sunscreen', category:'toiletries', quantity:1 },
    { name:'Phone Charger', category:'electronics', quantity:1 },
    { name:'Camera', category:'electronics', quantity:1 },
    { name:'Power Bank', category:'electronics', quantity:1 },
    { name:'Headphones', category:'electronics', quantity:1 },
    { name:'Pain Reliever', category:'medicine', quantity:1 },
    { name:'Prescription Meds', category:'medicine', quantity:1 },
    { name:'Hand Sanitizer', category:'medicine', quantity:1 },
  ];
  const items = await PackingItem.insertMany(
    templates.map(t => ({ ...t, trip: req.params.tripId, user: req.user._id, packed: false }))
  );
  res.status(201).json({ success: true, count: items.length, items });
});

// PUT — use $set so partial updates don't wipe fields
router.put('/:id', protect, async (req, res) => {
  const item = await PackingItem.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { $set: req.body },
    { new: true, runValidators: true }
  );
  if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
  res.json({ success: true, item });
});

router.delete('/:id', protect, async (req, res) => {
  await PackingItem.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  res.json({ success: true });
});

module.exports = router;
